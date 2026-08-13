import { DataSource, Repository } from 'typeorm';
import { TeacherQuotaEntity } from '../../modules/teacher-billing/entities/teacher-quota.entity';

const DEFAULT_ALLOWANCE = 100;

/**
 * Seeds the teacher's AI-credit quota row (or leaves an existing one
 * untouched — if the admin already topped the teacher up, a reseed must
 * not clobber that). The teacher's quota is the only one the platform
 * has, matching the single-teacher constraint.
 */
export async function seedTeacherQuota(
  dataSource: DataSource,
  teacherId: string,
): Promise<TeacherQuotaEntity> {
  const repository: Repository<TeacherQuotaEntity> =
    dataSource.getRepository(TeacherQuotaEntity);

  const existing = await repository.findOne({ where: { teacherId } });
  if (existing) return existing;

  const firstOfNextMonth = new Date();
  firstOfNextMonth.setUTCDate(1);
  firstOfNextMonth.setUTCMonth(firstOfNextMonth.getUTCMonth() + 1);
  firstOfNextMonth.setUTCHours(0, 0, 0, 0);

  return repository.save(
    repository.create({
      teacherId,
      monthlyAllowance: DEFAULT_ALLOWANCE,
      totalCredits: DEFAULT_ALLOWANCE,
      usedCredits: 0,
      resetAt: firstOfNextMonth,
    }),
  );
}
