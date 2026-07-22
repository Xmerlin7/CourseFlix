import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EnrollmentEntity, EnrollmentStatus } from './entities/enrollment.entity';

export interface StudentEnrollmentFilters {
  status?: EnrollmentStatus;
  gradeLevel?: string;
}

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentsRepository: Repository<EnrollmentEntity>,
  ) {}

  /**
   * Returns only the given student's own enrollments, never anyone else's,
   * and never soft-deleted rows.
   */
  async findStudentEnrollments(
    studentId: string,
    filters: StudentEnrollmentFilters = {},
  ): Promise<EnrollmentEntity[]> {
    const query = this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.student_id = :studentId', { studentId })
      .andWhere('enrollment.deleted_at IS NULL');

    if (filters.status) {
      query.andWhere('enrollment.status = :status', {
        status: filters.status,
      });
    }

    // TODO(follow-up on CF-TASK-012): `courses` has no `grade_level` column
    // in schemaV2.sql (it has `category` instead). Confirm with Seif/Nabile
    // whether the API's `gradeLevel` filter should map to `category` or a
    // new column, then join `courses` here and apply it. Left
    // unimplemented on purpose rather than silently filtering wrong.
    void filters.gradeLevel;

    return query.orderBy('enrollment.enrolled_at', 'DESC').getMany();
  }

  /**
   * Throws 403 unless the student has an active, non-deleted enrollment in
   * this course. Used to gate the shared course-detail endpoint (Seif) and
   * any other student-only course access.
   */
  async assertStudentEnrolled(
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentEntity> {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: {
        studentId,
        courseId,
        status: 'active',
        deletedAt: IsNull(),
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course.');
    }

    return enrollment;
  }
}