import { Injectable } from '@nestjs/common';

@Injectable()
export class EnrollmentsService {
  findStudentEnrollments(studentId: string) {
    return {
      TODO: 'Return only the authenticated student enrollments, with optional filters later.',
      studentId,
    };
  }

  assertStudentEnrolled(studentId: string, courseId: string) {
    return {
      TODO: 'Throw 403 when student is not actively enrolled in this course.',
      studentId,
      courseId,
    };
  }
}
