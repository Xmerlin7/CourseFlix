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
import { VideoEntity, VideoModerationStatus } from './entities/video.entity';

export interface LessonDetailResponse {
  id: string;
  title: string;
  video: {
    id: string;
    // Null when the video has not cleared moderation. Students get null
    // rather than a 404 so the page can say *why* the lesson can't be
    // played; teachers always get the real URL so they can review their
    // own upload while it's pending or after it's been rejected.
    url: string | null;
    durationSeconds: number | null;
    moderationStatus: VideoModerationStatus;
    // Teacher-only: never disclosed to students.
    moderationReason: string | null;
  };
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

// A finished video legitimately reports watchedSeconds a hair under
// durationSeconds: the frontend floors both `video.currentTime` (read at
// the `ended` event) and `video.duration` independently
// (useProgressHeartbeat.ts), and browsers commonly fire `ended` a few
// milliseconds before `currentTime` reaches a non-integer `duration` —
// e.g. a 305.62s video ends with `watchedSeconds: 304` against
// `durationSeconds: 305`, landing at 99.67%. A strict `>= 100` check
// never completes that lesson (confirmed against the real heartbeat
// payload shape), which silently keeps the next lesson locked despite
// the student having watched to the end. This tolerance absorbs that
// one-floored-second gap without treating a meaningfully-incomplete
// watch (e.g. skipping the last 10% via seeking) as done.
const COMPLETION_THRESHOLD_PERCENT = 99;

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
    // Deliberately not gated on moderation: a lesson whose video hasn't
    // cleared review still exists, so 404-ing here would tell the student
    // "page not found" about a lesson sitting right there in their
    // outline. The URL is withheld below instead.
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
        url: video.moderationStatus === 'approved' ? video.videoUrl : null,
        durationSeconds: video.durationSeconds,
        moderationStatus: video.moderationStatus,
        // The rejection reason quotes the flagged content — teacher and
        // admin only, never surfaced to students.
        moderationReason: null,
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
    // Unlike the student path, teachers see their own video regardless of
    // moderation status — otherwise they'd have no way to tell a pending
    // review from a video that was never uploaded.
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
        moderationStatus: video.moderationStatus,
        moderationReason: video.moderationReason,
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
   * "Current lesson" is the earliest lesson in course order the student
   * hasn't completed — partially watched, or never opened at all. That
   * deliberately matches the client's sequential-unlock rule
   * (StudentLessonPage), so the resume target is always a lesson the
   * student can actually open; it's null once the course is finished.
   *
   * `lastCompletedLesson` stays separate and is ranked by `completedAt`
   * (the only real timestamp on content_progress) — it answers "what did
   * they last finish" for activity feeds, not "where do they resume".
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
      let firstIncompleteLesson: CourseCurrentLesson | null = null;
      let lastInProgressLesson: CourseCurrentLesson | null = null;
      let lastCompletedLesson: CourseCurrentLesson | null = null;
      let lastCompletedAt: Date | null = null;

      for (const lesson of courseLessons) {
        const video = videoByLessonId.get(lesson.id)!;
        const progress = progressByVideoId.get(video.id);

        if (progress?.status === 'completed') {
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
          continue;
        }

        // Anything not completed is a resume candidate — including a
        // lesson with no `content_progress` row at all. Those used to be
        // skipped outright, so a never-opened lesson sitting mid-course
        // was invisible here while still blocking the client's
        // sequential unlocking, and the resume link pointed past it at a
        // lesson the student could not actually open.
        if (!firstIncompleteLesson) {
          firstIncompleteLesson = {
            id: lesson.id,
            title: lesson.title,
            lastVideoPosition: progress?.lastVideoPosition ?? 0,
          };
        }

        // Furthest lesson they've actually started. Overwritten as the
        // loop advances, so this ends up holding the last one in course
        // order — "the lesson I'm working through" for the resume CTA.
        if (progress?.status === 'in_progress') {
          lastInProgressLesson = {
            id: lesson.id,
            title: lesson.title,
            lastVideoPosition: progress.lastVideoPosition ?? 0,
          };
        }
      }

      // Resume where they actually left off: the furthest lesson already
      // in progress, falling back to the earliest untouched one when
      // nothing is mid-watch. Both are openable — sequential unlocking
      // admits any started lesson plus the first incomplete one — so this
      // can't land on a locked lesson. Null means the course is finished.
      const currentLesson: CourseCurrentLesson | null =
        lastInProgressLesson ?? firstIncompleteLesson;

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
    const video = await this.loadApprovedVideoForLesson(lesson.id);

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
      nextPercentage >= COMPLETION_THRESHOLD_PERCENT
        ? 'completed'
        : 'in_progress';

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

  // Write guard for progress only. Reads (getLessonDetail) deliberately
  // do NOT use this — they return the lesson with a null URL so the page
  // can explain the review state — but a student must never be able to
  // accrue watch progress or attendance against a video that hasn't
  // cleared moderation, so the write path still refuses outright.
  private async loadApprovedVideoForLesson(
    lessonId: string,
  ): Promise<VideoEntity> {
    const video = await this.loadVideoForLesson(lessonId);
    if (video.moderationStatus !== 'approved') {
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
