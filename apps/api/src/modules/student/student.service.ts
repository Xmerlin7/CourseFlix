import { Injectable } from '@nestjs/common';
import { EnrollmentsService } from '../enrollments/enrollments.service';

@Injectable()
export class StudentService {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  getDashboard() {
    return {
      TODO: 'Build student dashboard values from DB; progress fields stay null in Sprint 1.',
      overallProgressPercent: null,
      continueLearning: null,
    };
  }

  getEnrollments(filters: { status?: string; gradeLevel?: string }) {
    return {
      TODO: 'Use authenticated student id and pass filters to enrollment queries.',
      filters,
      serviceLayer: this.enrollmentsService.findStudentEnrollments(
        'TODO-authenticated-student-id',
      ),
    };
  }
}
