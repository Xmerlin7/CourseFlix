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

export interface CourseCurrentLesson {
  id: string;
  title: string;
  lastVideoPosition: number;
}

export interface CourseProgressSummary {
  totalLessonsCount: number;
  completedLessonsCount: number;
  progressPercent: number;
  currentLesson: CourseCurrentLesson | null;
  /** Most recent `completedAt` among this course's progress rows, if any. */
  lastActivityAt: Date | null;
  /**
   * The lesson `lastActivityAt` refers to. Distinct from `currentLesson`:
   * once a student moves on to the next lesson, `currentLesson` tracks the
   * new in-progress one while this still names what was last *finished* —
   * that's what a "completed a lesson" activity entry needs to say.
   */
  lastCompletedLesson: CourseCurrentLesson | null;
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
    const course = await this.loadCourseOutline(lesson.courseId, true);
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
   * Batch-computes an enrollment-list-friendly progress summary per course
   * (lesson counts, resume target, recency) from the same `content_progress`
   * rows `getLessonDetail`/`loadCourseLessonProgress` already use — no
   * parallel progress store, just a different projection of it.
   *
   * "Current lesson" priority mirrors the student-facing resume flow:
   * 1) a lesson still `in_progress` (earliest in course order, i.e. the one
   *    the student hasn't finished yet), 2) otherwise the most recently
   *    completed lesson (there's no `updated_at` on content_progress to
   *    rank multiple in-progress rows by recency, so `completedAt` is the
   *    only real timestamp available), 3) otherwise the first lesson, if
   *    the course has never been started.
   */
  async getCourseProgressSummaries(
    studentId: string,
    courseIds: string[],
  ): Promise<Map<string, CourseProgressSummary>> {
    const summaries = new Map<string, CourseProgressSummary>();
    if (courseIds.length === 0) {
      return summaries;
    }

    const lessons = await this.lessonsRepository
      .createQueryBuilder('lesson')
      .innerJoin('lesson.section', 'section', 'section.deleted_at IS NULL')
      .where('lesson.course_id IN (:...courseIds)', { courseIds })
      .andWhere('lesson.deleted_at IS NULL')
      .andWhere('lesson.status = :status', { status: 'published' })
      .orderBy('section.order_index', 'ASC')
      .addOrderBy('lesson.order_index', 'ASC')
      .getMany();

    const lessonsByCourseId = new Map<string, LessonEntity[]>();
    for (const lesson of lessons) {
      const list = lessonsByCourseId.get(lesson.courseId) ?? [];
      list.push(lesson);
      lessonsByCourseId.set(lesson.courseId, list);
    }

    const lessonIds = lessons.map((lesson) => lesson.id);
    const videos = lessonIds.length
      ? await this.videosRepository.find({
          where: { lessonId: In(lessonIds), deletedAt: IsNull() },
        })
      : [];
    const videoByLessonId = new Map(
      videos.map((video) => [video.lessonId!, video]),
    );

    const videoIds = videos.map((video) => video.id);
    const progressRows = videoIds.length
      ? await this.progressRepository.find({
          where: { studentId, itemType: 'video', videoId: In(videoIds) },
        })
      : [];
    const progressByVideoId = new Map(
      progressRows.map((progress) => [progress.videoId, progress]),
    );

    for (const courseId of courseIds) {
      const courseLessons = (lessonsByCourseId.get(courseId) ?? []).filter(
        (lesson) => videoByLessonId.has(lesson.id),
      );
      const totalLessonsCount = courseLessons.length;

      let completedLessonsCount = 0;
      let inProgressLesson: CourseCurrentLesson | null = null;
      let lastCompletedLesson: CourseCurrentLesson | null = null;
      let lastCompletedAt: Date | null = null;

      for (const lesson of courseLessons) {
        const video = videoByLessonId.get(lesson.id)!;
        const progress = progressByVideoId.get(video.id);
        if (!progress) {
          continue;
        }

        if (progress.status === 'completed') {
          completedLessonsCount += 1;
          if (
            !lastCompletedAt ||
            (progress.completedAt && progress.completedAt > lastCompletedAt)
          ) {
            lastCompletedAt = progress.completedAt;
            lastCompletedLesson = {
              id: lesson.id,
              title: lesson.title,
              lastVideoPosition: progress.lastVideoPosition ?? 0,
            };
          }
        } else if (progress.status === 'in_progress' && !inProgressLesson) {
          inProgressLesson = {
            id: lesson.id,
            title: lesson.title,
            lastVideoPosition: progress.lastVideoPosition ?? 0,
          };
        }
      }

      let currentLesson: CourseCurrentLesson | null = null;
      if (inProgressLesson) {
        currentLesson = inProgressLesson;
      } else if (
        completedLessonsCount > 0 &&
        completedLessonsCount < totalLessonsCount
      ) {
        currentLesson = lastCompletedLesson;
      } else if (completedLessonsCount === 0 && totalLessonsCount > 0) {
        const first = courseLessons[0];
        currentLesson = {
          id: first.id,
          title: first.title,
          lastVideoPosition: 0,
        };
      }

      summaries.set(courseId, {
        totalLessonsCount,
        completedLessonsCount,
        progressPercent:
          totalLessonsCount > 0
            ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
            : 0,
        currentLesson,
        lastActivityAt: lastCompletedAt,
        lastCompletedLesson,
      });
    }

    return summaries;
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

  // `publishedOnly` must stay false for the teacher/assistant path
  // (getTeacherLessonDetail) — they need draft lessons in the outline to
  // manage them. Students only ever get true: a draft or unpublished
  // lesson sitting between two published ones would otherwise show up
  // in StudentLessonPage's sequential-unlock walk as a lesson the
  // student can never complete, permanently locking every lesson after
  // it. Keep in sync with the same `lesson.status = 'published'` filter
  // in getCourseProgressSummaries, which already only counts published
  // lessons — a mismatch here is exactly what caused that bug.
  private async loadCourseOutline(
    courseId: string,
    publishedOnly = false,
  ): Promise<CourseEntity> {
    const query = this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect(
        'course.sections',
        'section',
        'section.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'section.lessons',
        'lesson',
        publishedOnly
          ? "lesson.deleted_at IS NULL AND lesson.status = 'published'"
          : 'lesson.deleted_at IS NULL',
      )
      .where('course.id = :courseId', { courseId })
      .andWhere('course.deleted_at IS NULL')
      .orderBy('section.order_index', 'ASC')
      .addOrderBy('lesson.order_index', 'ASC');

    const course = await query.getOne();

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    return course;
  }

  private async loadCourseLessonProgress(
    course: CourseEntity,
    studentId: string,
  ): Promise<
    Map<string, { status: ContentProgressStatus; watchedPercentage: number }>
  > {
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
