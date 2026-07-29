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

export interface BulkEnrollmentInput {
  studentIds: string[];
  courseIds: string[];
}

/**
 * Fans the seeded students out across the seeded courses so the teacher
 * dashboard, student "دوراتي" list and enrollment filters all have real
 * volume to show.
 *
 * Deterministic rather than random: the same reseed always produces the
 * same enrollment set, which is what makes `npm run seed` twice in a row
 * idempotent (a Definition-of-Done requirement in sprint2-plan.md §12).
 * Every third enrollment is `completed` and every seventh `suspended`, so
 * all three states are represented without hand-listing them.
 */
export async function seedEnrollments(
  dataSource: DataSource,
  { studentIds, courseIds }: BulkEnrollmentInput,
): Promise<number> {
  const repository = dataSource.getRepository(EnrollmentEntity);
  let created = 0;
  let pair = 0;

  for (const [studentIndex, studentId] of studentIds.entries()) {
    // Staggered so students aren't all in the same courses: student N
    // takes courses N, N+1, N+2 (wrapping).
    for (let offset = 0; offset < 3; offset += 1) {
      const courseId = courseIds[(studentIndex + offset) % courseIds.length];
      pair += 1;

      const existing = await repository.findOne({
        where: { studentId, courseId },
      });
      if (existing) {
        continue;
      }

      await repository.save(
        repository.create({
          studentId,
          courseId,
          status:
            pair % 7 === 0
              ? 'suspended'
              : pair % 3 === 0
                ? 'completed'
                : 'active',
        }),
      );
      created += 1;
    }
  }

  return created;
}
