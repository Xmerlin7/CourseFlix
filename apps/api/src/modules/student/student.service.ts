import { Injectable } from '@nestjs/common';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import type { EnrollmentStatus } from '../enrollments/entities/enrollment.entity';

export interface StudentDashboardRecentCourse {
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
}

export interface StudentDashboardResponse {
  student: { id: string };
  stats: {
    enrolledCoursesCount: number;
    activeCoursesCount: number;
  };
  overallProgressPercent: null;
  continueLearning: null;
  recentCourses: StudentDashboardRecentCourse[];
}

@Injectable()
export class StudentService {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  async getDashboard(studentId: string): Promise<StudentDashboardResponse> {
    const enrollments =
      await this.enrollmentsService.findStudentEnrollments(studentId);

    const recentCourses: StudentDashboardRecentCourse[] = [...enrollments]
      .sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime())
      .slice(0, 5)
      .map((enrollment) => ({
        courseId: enrollment.courseId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        // TODO(blocked on Seif's course service): enrich with course
        // title/coverImageUrl once GET /api/v1/courses/:courseId lands.
      }));

    return {
      // TODO(blocked on Users module): enrich with fullName/email/avatarUrl
      // once UsersService reads from a real DB instead of being a stub.
      student: { id: studentId },
      stats: {
        enrolledCoursesCount: enrollments.length,
        activeCoursesCount: enrollments.filter((e) => e.status === 'active')
          .length,
      },
      // Sprint 1 boundary: progress tracking / continue-learning stay null
      // until Sprint 2, per sprint1-plan.md acceptance criteria.
      overallProgressPercent: null,
      continueLearning: null,
      recentCourses,
    };
  }

  async getEnrollments(
    studentId: string,
    filters: { status?: string; gradeLevel?: string },
  ) {
    // Real filter validation/mapping is CF-TASK-014 (Branch 3). For now
    // this just passes the authenticated studentId through correctly
    // instead of the previous hardcoded placeholder id.
    return this.enrollmentsService.findStudentEnrollments(studentId, {
      status: filters.status as EnrollmentStatus | undefined,
      gradeLevel: filters.gradeLevel,
    });
  }
}