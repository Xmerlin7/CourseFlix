import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { CourseEntity } from '../courses/entities/course.entity';
import { LessonEntity } from '../courses/entities/lesson.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { AttendanceService } from './attendance.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import {
  ContentProgressEntity,
  ContentProgressStatus,
} from './entities/content-progress.entity';
import { VideoEntity } from './entities/video.entity';

export interface LessonDetailResponse {
  id: string;
  title: string;
  video: { id: string; url: string; durationSeconds: number | null };
  course: {
    id: string;
    title: string;
    currentSectionId: string;
    sections: Array<{
      id: string;
      title: string;
      sortOrder: number;
      lessons: Array<{
        id: string;
        title: string;
        sortOrder: number;
        progressStatus: ContentProgressStatus;
        watchedPercentage: number;
      }>;
    }>;
  };
  progress: {
    lastPositionSeconds: number;
    watchedPercentage: number;
    status: ContentProgressStatus;
  };
}

export interface UpdateProgressResponse {
  watchedPercentage: number;
  status: ContentProgressStatus;
  attendanceAwarded: boolean;
}

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private readonly lessonsRepository: Repository<LessonEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(VideoEntity)
    private readonly videosRepository: Repository<VideoEntity>,
    @InjectRepository(ContentProgressEntity)
    private readonly progressRepository: Repository<ContentProgressEntity>,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async getLessonDetail(
    lessonId: string,
    studentId: string,
  ): Promise<LessonDetailResponse> {
    const lesson = await this.loadLesson(lessonId);
    await this.enrollmentsService.assertStudentEnrolled(
      studentId,
      lesson.courseId,
    );
    const video = await this.loadVideoForLesson(lesson.id);
    const course = await this.loadCourseOutline(lesson.courseId);
    const lessonProgress = await this.loadCourseLessonProgress(
      course,
      studentId,
    );

    const progress = await this.progressRepository.findOne({
      where: { studentId, videoId: video.id, itemType: 'video' },
    });

    return {
      id: lesson.id,
      title: lesson.title,
      video: {
        id: video.id,
        url: video.videoUrl,
        durationSeconds: video.durationSeconds,
      },
      course: this.toCourseOutline(course, lesson.sectionId, lessonProgress),
      progress: {
        lastPositionSeconds: progress?.lastVideoPosition ?? 0,
        watchedPercentage: progress ? Number(progress.progressPercentage) : 0,
        status: progress?.status ?? 'not_started',
      },
    };
  }

  async getTeacherLessonDetail(
    lessonId: string,
    teacherId: string,
  ): Promise<LessonDetailResponse> {
    const lesson = await this.loadLesson(lessonId);
    const video = await this.loadVideoForLesson(lesson.id);
    const course = await this.loadCourseOutline(lesson.courseId);

    if (course.teacherId !== teacherId) {
      throw new NotFoundException('Lesson not found.');
    }

    return {
      id: lesson.id,
      title: lesson.title,
      video: {
        id: video.id,
        url: video.videoUrl,
        durationSeconds: video.durationSeconds,
      },
      course: this.toCourseOutline(course, lesson.sectionId),
      progress: {
        lastPositionSeconds: 0,
        watchedPercentage: 0,
        status: 'not_started',
      },
    };
  }

  /**
   * Progress is monotonic and server-derived (docs/api/sprint2-lessons.md):
   * `watchedPercentage` only ever increases — a lower `watchedSeconds` than
   * what's already stored simply fails to raise it, it never regresses the
   * stored value. `lastVideoPosition` always takes the latest submitted
   * position, with no monotonicity requirement, because seeking is free.
   */
  async updateProgress(
    lessonId: string,
    studentId: string,
    dto: UpdateProgressDto,
  ): Promise<UpdateProgressResponse> {
    const lesson = await this.loadLesson(lessonId);
    await this.enrollmentsService.assertStudentEnrolled(
      studentId,
      lesson.courseId,
    );
    const video = await this.loadVideoForLesson(lesson.id);

    const existing = await this.progressRepository.findOne({
      where: { studentId, videoId: video.id, itemType: 'video' },
    });

    const durationSeconds = video.durationSeconds ?? dto.durationSeconds ?? 0;
    const candidatePercentage =
      durationSeconds > 0
        ? Math.min(100, (dto.watchedSeconds / durationSeconds) * 100)
        : 0;
    const previousPercentage = existing
      ? Number(existing.progressPercentage)
      : 0;
    const nextPercentage = Math.max(previousPercentage, candidatePercentage);
    const status: ContentProgressStatus =
      nextPercentage >= 100 ? 'completed' : 'in_progress';

    if (existing) {
      await this.progressRepository.update(existing.id, {
        lastVideoPosition: dto.positionSeconds,
        progressPercentage: nextPercentage.toFixed(2),
        status,
        completedAt:
          status === 'completed'
            ? (existing.completedAt ?? new Date())
            : existing.completedAt,
      });
    } else {
      await this.progressRepository.save(
        this.progressRepository.create({
          studentId,
          courseId: lesson.courseId,
          itemType: 'video',
          videoId: video.id,
          lastVideoPosition: dto.positionSeconds,
          progressPercentage: nextPercentage.toFixed(2),
          status,
          completedAt: status === 'completed' ? new Date() : null,
        }),
      );
    }

    const attendanceAwarded = await this.attendanceService.evaluateAndAward({
      studentId,
      videoId: video.id,
      watchedSeconds: dto.watchedSeconds,
      watchedPercentage: nextPercentage,
    });

    return {
      watchedPercentage: Number(nextPercentage.toFixed(2)),
      status,
      attendanceAwarded,
    };
  }

  private async loadLesson(lessonId: string): Promise<LessonEntity> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId, deletedAt: IsNull() },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }
    return lesson;
  }

  private async loadVideoForLesson(lessonId: string): Promise<VideoEntity> {
    const video = await this.videosRepository.findOne({
      where: { lessonId, deletedAt: IsNull() },
    });
    if (!video) {
      throw new NotFoundException('This lesson has no video yet.');
    }
    return video;
  }

  private async loadCourseOutline(courseId: string): Promise<CourseEntity> {
    const course = await this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect(
        'course.sections',
        'section',
        'section.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'section.lessons',
        'lesson',
        'lesson.deleted_at IS NULL',
      )
      .where('course.id = :courseId', { courseId })
      .andWhere('course.deleted_at IS NULL')
      .orderBy('section.order_index', 'ASC')
      .addOrderBy('lesson.order_index', 'ASC')
      .getOne();

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    return course;
  }

  private async loadCourseLessonProgress(
    course: CourseEntity,
    studentId: string,
  ): Promise<Map<string, { status: ContentProgressStatus; watchedPercentage: number }>> {
    const lessonIds = (course.sections ?? [])
      .flatMap((section) => section.lessons ?? [])
      .map((lesson) => lesson.id);

    if (lessonIds.length === 0) {
      return new Map();
    }

    const videos = await this.videosRepository.find({
      where: { lessonId: In(lessonIds), deletedAt: IsNull() },
    });
    const videoIds = videos.map((video) => video.id);
    if (videoIds.length === 0) {
      return new Map();
    }

    const progressRows = await this.progressRepository.find({
      where: { studentId, itemType: 'video', videoId: In(videoIds) },
    });
    const progressByVideoId = new Map(
      progressRows.map((progress) => [progress.videoId, progress]),
    );

    return new Map(
      videos.map((video) => {
        const progress = progressByVideoId.get(video.id);
        return [
          video.lessonId!,
          {
            status: progress?.status ?? 'not_started',
            watchedPercentage: progress
              ? Number(progress.progressPercentage)
              : 0,
          },
        ];
      }),
    );
  }

  private toCourseOutline(
    course: CourseEntity,
    currentSectionId: string,
    lessonProgress = new Map<
      string,
      { status: ContentProgressStatus; watchedPercentage: number }
    >(),
  ) {
    return {
      id: course.id,
      title: course.title,
      currentSectionId,
      sections: (course.sections ?? []).map((section) => ({
        id: section.id,
        title: section.title,
        sortOrder: section.sortOrder,
        lessons: (section.lessons ?? []).map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          sortOrder: lesson.sortOrder,
          progressStatus:
            lessonProgress.get(lesson.id)?.status ?? 'not_started',
          watchedPercentage:
            lessonProgress.get(lesson.id)?.watchedPercentage ?? 0,
        })),
      })),
    };
  }
}
