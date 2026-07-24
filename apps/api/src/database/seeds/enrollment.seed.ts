import { DataSource } from 'typeorm';
import { EnrollmentEntity } from '../../modules/enrollments/entities/enrollment.entity';

export interface EnrollmentSeedInput {
  studentId: string;
  courseId: string;
}

/**
 * Seeds exactly one active enrollment for the Sprint 1 fixture: the one
 * seeded student, actively enrolled in the one seeded/published course.
 *
 * Intended to be called by the central seed runner (Nabile/Seif's
 * baseline) after the seeded student and course rows already exist.
 * Safe to run on every reseed: it upserts on the (student_id, course_id)
 * unique constraint instead of inserting a duplicate row, matching the
 * team rule that everyone can reset and reseed locally at any time.
 */
export async function seedEnrollment(
  dataSource: DataSource,
  { studentId, courseId }: EnrollmentSeedInput,
): Promise<EnrollmentEntity> {
  const repository = dataSource.getRepository(EnrollmentEntity);

  const existing = await repository.findOne({
    where: { studentId, courseId },
  });

  if (existing) {
    return existing;
  }

  return repository.save(
    repository.create({
      studentId,
      courseId,
      status: 'active',
    }),
  );
}
