import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';
import type { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import type {
  EnrollmentEntity,
  EnrollmentStatus,
} from '../enrollments/entities/enrollment.entity';
import { LessonsService } from '../lessons/lessons.service';
import type {
  CourseCurrentLesson,
  CourseProgressSummary,
} from '../lessons/lessons.service';
import { UsersService } from '../users/users.service';

export interface StudentDashboardRecentCourse {
  courseId: string;
  courseTitle: string | null;
  coverImageUrl: string | null;
  status: EnrollmentStatus;
  enrolledAt: Date;
}

export interface StudentDashboardContinueLearning {
  courseId: string;
  courseTitle: string | null;
  coverImageUrl: string | null;
  gradeLevel: string | null;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  currentLesson: CourseCurrentLesson;
}

export type StudentActivityType = 'enrolled' | 'lesson_completed';

export interface StudentDashboardActivityItem {
  type: StudentActivityType;
  courseId: string;
  courseTitle: string | null;
  lessonTitle: string | null;
  occurredAt: string;
}

export interface StudentDashboardResponse {
  student: {
    id: string;
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  stats: {
    enrolledCoursesCount: number;
    activeCoursesCount: number;
    completedCoursesCount: number;
  };
  /** Average progressPercent across courses that have trackable lessons; null when none do. */
  overallProgressPercent: number | null;
  continueLearning: StudentDashboardContinueLearning | null;
  recentCourses: StudentDashboardRecentCourse[];
  /** Most recent enrollment/lesson-completion events, newest first, capped to 5. */
  recentActivity: StudentDashboardActivityItem[];
}

export interface StudentEnrollmentResponse {
  id: string;
  courseId: string;
  courseTitle?: string;
  coverImageUrl: string | null;
  gradeLevel?: string;
  status: EnrollmentStatus;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  currentLesson: CourseCurrentLesson | null;
  lastActivityAt: string;
}

const EMPTY_PROGRESS_SUMMARY: CourseProgressSummary = {
  totalLessonsCount: 0,
  completedLessonsCount: 0,
  progressPercent: 0,
  currentLesson: null,
  lastActivityAt: null,
  lastCompletedLesson: null,
};

const VALID_ENROLLMENT_STATUSES: readonly EnrollmentStatus[] = [
  'active',
  'suspended',
  'completed',
];

function parseEnrollmentStatus(value?: string): EnrollmentStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!VALID_ENROLLMENT_STATUSES.includes(value as EnrollmentStatus)) {
    throw new BadRequestException(
      `Invalid status filter: "${value}". Must be one of ${VALID_ENROLLMENT_STATUSES.join(', ')}.`,
    );
  }

  return value as EnrollmentStatus;
}

@Injectable()
export class StudentService {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly coursesService: CoursesService,
    private readonly usersService: UsersService,
    private readonly lessonsService: LessonsService,
  ) {}

  async getDashboard(studentId: string): Promise<StudentDashboardResponse> {
    const enrollments =
      await this.enrollmentsService.findStudentEnrollments(studentId);

    const courses = await this.coursesService.findByIds(
      enrollments.map((enrollment) => enrollment.courseId),
    );
    const courseById = this.indexCoursesById(courses);

    const summaries = await this.lessonsService.getCourseProgressSummaries(
      studentId,
      enrollments.map((enrollment) => enrollment.courseId),
    );

    const recentCourses: StudentDashboardRecentCourse[] = [...enrollments]
      .sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime())
      .slice(0, 5)
      .map((enrollment) => {
        const course = courseById.get(enrollment.courseId);
        return {
          courseId: enrollment.courseId,
          courseTitle: course?.title ?? null,
          coverImageUrl: course?.coverImageUrl ?? null,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
        };
      });

    const profile = await this.usersService.findById(studentId);

    return {
      student: {
        id: studentId,
        fullName: profile?.fullName ?? null,
        email: profile?.email ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      },
      stats: {
        enrolledCoursesCount: enrollments.length,
        activeCoursesCount: enrollments.filter((e) => e.status === 'active')
          .length,
        completedCoursesCount: enrollments.filter(
          (e) => e.status === 'completed',
        ).length,
      },
      overallProgressPercent: this.computeOverallProgressPercent(summaries),
      continueLearning: this.pickContinueLearning(
        enrollments,
        courseById,
        summaries,
      ),
      recentCourses,
      recentActivity: this.buildRecentActivity(
        enrollments,
        courseById,
        summaries,
      ),
    };
  }

  private computeOverallProgressPercent(
    summaries: Map<string, CourseProgressSummary>,
  ): number | null {
    const trackable = [...summaries.values()].filter(
      (summary) => summary.totalLessonsCount > 0,
    );
    if (trackable.length === 0) {
      return null;
    }

    const total = trackable.reduce(
      (sum, summary) => sum + summary.progressPercent,
      0,
    );
    return Math.round(total / trackable.length);
  }

  // Same eligibility/recency rule the "دوراتي" page uses client-side to pick
  // its "تتعلم الآن" course, applied here server-side against the same
  // per-course summaries — one selection rule, one data source.
  private pickContinueLearning(
    enrollments: EnrollmentEntity[],
    courseById: Map<string, CourseEntity>,
    summaries: Map<string, CourseProgressSummary>,
  ): StudentDashboardContinueLearning | null {
    let best: {
      enrollment: EnrollmentEntity;
      summary: CourseProgressSummary;
    } | null = null;

    for (const enrollment of enrollments) {
      const summary =
        summaries.get(enrollment.courseId) ?? EMPTY_PROGRESS_SUMMARY;
      const eligible =
        enrollment.status === 'active' &&
        summary.progressPercent > 0 &&
        summary.progressPercent < 100 &&
        summary.currentLesson !== null;
      if (!eligible) {
        continue;
      }

      if (!best) {
        best = { enrollment, summary };
        continue;
      }

      const bestTime = (
        best.summary.lastActivityAt ?? best.enrollment.enrolledAt
      ).getTime();
      const candidateTime = (
        summary.lastActivityAt ?? enrollment.enrolledAt
      ).getTime();
      if (candidateTime > bestTime) {
        best = { enrollment, summary };
      }
    }

    if (!best) {
      return null;
    }

    const course = courseById.get(best.enrollment.courseId);
    return {
      courseId: best.enrollment.courseId,
      courseTitle: course?.title ?? null,
      coverImageUrl: course?.coverImageUrl ?? null,
      gradeLevel: course?.gradeLevel ?? null,
      progressPercent: best.summary.progressPercent,
      completedLessonsCount: best.summary.completedLessonsCount,
      totalLessonsCount: best.summary.totalLessonsCount,
      // `eligible` above guarantees currentLesson is non-null here.
      currentLesson: best.summary.currentLesson!,
    };
  }

  // Built from data already loaded for this same request (enrollments +
  // progress summaries) — no dedicated activity-log table or service.
  private buildRecentActivity(
    enrollments: EnrollmentEntity[],
    courseById: Map<string, CourseEntity>,
    summaries: Map<string, CourseProgressSummary>,
  ): StudentDashboardActivityItem[] {
    const events: StudentDashboardActivityItem[] = [];

    for (const enrollment of enrollments) {
      const courseTitle = courseById.get(enrollment.courseId)?.title ?? null;

      events.push({
        type: 'enrolled',
        courseId: enrollment.courseId,
        courseTitle,
        lessonTitle: null,
        occurredAt: enrollment.enrolledAt.toISOString(),
      });

      const summary = summaries.get(enrollment.courseId);
      if (summary?.lastCompletedLesson && summary.lastActivityAt) {
        events.push({
          type: 'lesson_completed',
          courseId: enrollment.courseId,
          courseTitle,
          lessonTitle: summary.lastCompletedLesson.title,
          occurredAt: summary.lastActivityAt.toISOString(),
        });
      }
    }

    return events
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
      .slice(0, 5);
  }

  async getEnrollments(
    studentId: string,
    filters: { status?: string; gradeLevel?: string },
  ): Promise<StudentEnrollmentResponse[]> {
    const enrollments = await this.enrollmentsService.findStudentEnrollments(
      studentId,
      { status: parseEnrollmentStatus(filters.status) },
    );

    const courses = await this.coursesService.findByIds(
      enrollments.map((enrollment) => enrollment.courseId),
    );
    const courseById = this.indexCoursesById(courses);

    const matched = enrollments
      .map((enrollment) => ({
        enrollment,
        course: courseById.get(enrollment.courseId),
      }))
      .filter(
        ({ course }) =>
          !filters.gradeLevel || course?.gradeLevel === filters.gradeLevel,
      );

    const summaries = await this.lessonsService.getCourseProgressSummaries(
      studentId,
      matched.map(({ enrollment }) => enrollment.courseId),
    );

    return matched.map(({ enrollment, course }) =>
      this.toEnrollmentResponse(
        enrollment,
        course,
        summaries.get(enrollment.courseId),
      ),
    );
  }

  async enroll(
    studentId: string,
    courseId: string,
  ): Promise<StudentEnrollmentResponse> {
    const course = await this.coursesService.findCourseById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    if (course.teacherId === studentId) {
      throw new ForbiddenException('You cannot enroll in your own course.');
    }
    if (course.status === 'draft') {
      throw new ForbiddenException('This course is not yet published.');
    }
    if (course.status === 'archived') {
      throw new ForbiddenException('This course is no longer available.');
    }

    const enrollment = await this.enrollmentsService.createEnrollment(
      studentId,
      courseId,
    );
    const summary = await this.getSingleCourseProgressSummary(
      studentId,
      courseId,
    );
    return this.toEnrollmentResponse(enrollment, course, summary);
  }

  async getEnrollment(
    enrollmentId: string,
    studentId: string,
  ): Promise<StudentEnrollmentResponse> {
    const enrollment = await this.enrollmentsService.findEnrollmentById(
      enrollmentId,
      studentId,
    );
    const course = await this.coursesService.findCourseById(
      enrollment.courseId,
    );
    const summary = await this.getSingleCourseProgressSummary(
      studentId,
      enrollment.courseId,
    );
    return this.toEnrollmentResponse(enrollment, course ?? undefined, summary);
  }

  async updateEnrollment(
    enrollmentId: string,
    studentId: string,
    status: EnrollmentStatus,
  ): Promise<StudentEnrollmentResponse> {
    const enrollment = await this.enrollmentsService.updateEnrollment(
      enrollmentId,
      studentId,
      status,
    );
    const course = await this.coursesService.findCourseById(
      enrollment.courseId,
    );
    const summary = await this.getSingleCourseProgressSummary(
      studentId,
      enrollment.courseId,
    );
    return this.toEnrollmentResponse(enrollment, course ?? undefined, summary);
  }

  private async getSingleCourseProgressSummary(
    studentId: string,
    courseId: string,
  ): Promise<CourseProgressSummary> {
    const summaries = await this.lessonsService.getCourseProgressSummaries(
      studentId,
      [courseId],
    );
    return summaries.get(courseId) ?? EMPTY_PROGRESS_SUMMARY;
  }

  async unenroll(enrollmentId: string, studentId: string): Promise<void> {
    await this.enrollmentsService.deleteEnrollment(enrollmentId, studentId);
  }

  private indexCoursesById(courses: CourseEntity[]): Map<string, CourseEntity> {
    return new Map(courses.map((course) => [course.id, course]));
  }

  private toEnrollmentResponse(
    enrollment: EnrollmentEntity,
    course: CourseEntity | undefined,
    summary: CourseProgressSummary = EMPTY_PROGRESS_SUMMARY,
  ): StudentEnrollmentResponse {
    return {
      id: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: course?.title,
      coverImageUrl: course?.coverImageUrl ?? null,
      gradeLevel: course?.gradeLevel ?? undefined,
      status: enrollment.status,
      progressPercent: summary.progressPercent,
      completedLessonsCount: summary.completedLessonsCount,
      totalLessonsCount: summary.totalLessonsCount,
      currentLesson: summary.currentLesson,
      lastActivityAt: (
        summary.lastActivityAt ?? enrollment.enrolledAt
      ).toISOString(),
    };
  }
}
