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
import { UsersService } from '../users/users.service';

export interface StudentDashboardRecentCourse {
  courseId: string;
  courseTitle: string | null;
  coverImageUrl: string | null;
  status: EnrollmentStatus;
  enrolledAt: Date;
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
  };
  overallProgressPercent: null;
  continueLearning: null;
  recentCourses: StudentDashboardRecentCourse[];
}

export interface StudentEnrollmentResponse {
  id: string;
  courseId: string;
  courseTitle?: string;
  gradeLevel?: string;
  status: EnrollmentStatus;
}

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
  ) {}

  async getDashboard(studentId: string): Promise<StudentDashboardResponse> {
    const enrollments =
      await this.enrollmentsService.findStudentEnrollments(studentId);

    const recentEnrollments = [...enrollments]
      .sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime())
      .slice(0, 5);

    const courses = await this.coursesService.findByIds(
      recentEnrollments.map((enrollment) => enrollment.courseId),
    );
    const courseById = this.indexCoursesById(courses);

    const recentCourses: StudentDashboardRecentCourse[] = recentEnrollments.map(
      (enrollment) => {
        const course = courseById.get(enrollment.courseId);
        return {
          courseId: enrollment.courseId,
          courseTitle: course?.title ?? null,
          coverImageUrl: course?.coverImageUrl ?? null,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
        };
      },
    );

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
      },
      overallProgressPercent: null,
      continueLearning: null,
      recentCourses,
    };
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

    return enrollments
      .map((enrollment) => ({
        enrollment,
        course: courseById.get(enrollment.courseId),
      }))
      .filter(
        ({ course }) =>
          !filters.gradeLevel || course?.gradeLevel === filters.gradeLevel,
      )
      .map(({ enrollment, course }) =>
        this.toEnrollmentResponse(enrollment, course),
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
    return this.toEnrollmentResponse(enrollment, course);
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
    return this.toEnrollmentResponse(enrollment, course ?? undefined);
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
    return this.toEnrollmentResponse(enrollment, course ?? undefined);
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
  ): StudentEnrollmentResponse {
    return {
      id: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: course?.title,
      gradeLevel: course?.gradeLevel ?? undefined,
      status: enrollment.status,
    };
  }
}
