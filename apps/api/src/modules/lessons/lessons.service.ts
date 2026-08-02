import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
      progress: {
        lastPositionSeconds: progress?.lastVideoPosition ?? 0,
        watchedPercentage: progress ? Number(progress.progressPercentage) : 0,
        status: progress?.status ?? 'not_started',
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

    const durationSeconds = video.durationSeconds ?? 0;
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
}
