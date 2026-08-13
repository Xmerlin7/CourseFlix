import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, In, Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { TeacherQuotaEntity } from './entities/teacher-quota.entity';

/** Monthly AI-credit allowance for a teacher with no explicit quota row yet. */
export const DEFAULT_MONTHLY_ALLOWANCE = 100;

export interface TeacherQuotaDto {
  monthlyAllowance: number;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  /** 0-100, rounded; clamped at 100 even when usage exceeds the balance. */
  percentUsed: number;
  resetAt: string;
}

export interface AdminTeacherQuotaDto extends TeacherQuotaDto {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
}

/** First day of the next calendar month — when the cycle resets. */
function nextResetDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/**
 * Per-teacher AI credit. One credit = one AI operation (exam generation,
 * tutor answer, caption moderation...) — the admin tops the teacher up
 * and the monthly cycle refills `totalCredits` to the allowance.
 *
 * "Warning only" policy: consumption may exceed the balance (`usedCredits`
 * keeps counting past `totalCredits`); enforcement of a hard stop is
 * deliberately not here.
 */
@Injectable()
export class TeacherBillingService {
  constructor(
    @InjectRepository(TeacherQuotaEntity)
    private readonly quotaRepository: Repository<TeacherQuotaEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  /** Teacher-facing view of their own quota. Creates the row lazily if
   *  this teacher has never had one (e.g. created before this feature). */
  async getQuotaForTeacher(teacherId: string): Promise<TeacherQuotaDto> {
    const quota = await this.ensureQuota(teacherId);
    return this.toDto(quota);
  }

  /** Admin-facing list: every teacher, quota row or default values. */
  async listQuotas(): Promise<AdminTeacherQuotaDto[]> {
    const teachers = await this.usersRepository.find({
      where: { role: 'teacher', deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });

    const quotas = await this.quotaRepository.find({
      where: { teacherId: In(teachers.map((teacher) => teacher.id)) },
    });
    const quotaByTeacherId = new Map(
      quotas.map((quota) => [quota.teacherId, quota]),
    );

    return teachers.map((teacher) => {
      const quota = quotaByTeacherId.get(teacher.id);
      return {
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        teacherEmail: teacher.email,
        ...(quota
          ? this.toDto(quota)
          : this.toDto(this.defaultQuota(teacher.id))),
      };
    });
  }

  /** Admin adds credit on top of whatever the monthly cycle left. */
  async topUp(teacherId: string, credits: number): Promise<TeacherQuotaDto> {
    const quota = await this.ensureQuota(teacherId);
    quota.totalCredits += credits;
    await this.quotaRepository.save(quota);
    return this.toDto(quota);
  }

  /**
   * Records AI consumption. Never blocks — usage is allowed to exceed the
   * balance ("warning only" policy); the UI surfaces the low-balance state.
   * Returns the updated teacher view for callers that want to react.
   */
  async consumeCredits(
    teacherId: string,
    credits: number,
  ): Promise<TeacherQuotaDto> {
    const quota = await this.ensureQuota(teacherId);
    quota.usedCredits += credits;
    await this.quotaRepository.save(quota);
    return this.toDto(quota);
  }

  private async ensureQuota(teacherId: string): Promise<TeacherQuotaEntity> {
    const existing = await this.quotaRepository.findOne({
      where: { teacherId },
    });
    if (existing) {
      return this.applyMonthlyReset(existing);
    }

    const teacher = await this.usersRepository.findOne({
      where: { id: teacherId, deletedAt: IsNull() },
    });
    if (!teacher || teacher.role !== 'teacher') {
      throw new NotFoundException('Teacher not found.');
    }

    const quota = this.quotaRepository.create(this.defaultQuota(teacherId));
    return this.quotaRepository.save(quota);
  }

  private defaultQuota(
    teacherId: string,
  ): Pick<
    TeacherQuotaEntity,
    | 'teacherId'
    | 'monthlyAllowance'
    | 'totalCredits'
    | 'usedCredits'
    | 'resetAt'
  > {
    return {
      teacherId,
      monthlyAllowance: DEFAULT_MONTHLY_ALLOWANCE,
      totalCredits: DEFAULT_MONTHLY_ALLOWANCE,
      usedCredits: 0,
      resetAt: nextResetDate(),
    };
  }

  /** New month: refill to the allowance and zero the usage counter. */
  private async applyMonthlyReset(
    quota: TeacherQuotaEntity,
  ): Promise<TeacherQuotaEntity> {
    if (new Date() < quota.resetAt) return quota;
    quota.usedCredits = 0;
    quota.totalCredits = quota.monthlyAllowance;
    quota.resetAt = nextResetDate();
    return this.quotaRepository.save(quota);
  }

  private toDto(
    quota: Pick<
      TeacherQuotaEntity,
      'monthlyAllowance' | 'totalCredits' | 'usedCredits' | 'resetAt'
    >,
  ): TeacherQuotaDto {
    const total = Math.max(quota.totalCredits, 1);
    const percentUsed = Math.min(
      100,
      Math.round((quota.usedCredits / total) * 100),
    );
    return {
      monthlyAllowance: quota.monthlyAllowance,
      totalCredits: quota.totalCredits,
      usedCredits: quota.usedCredits,
      remainingCredits: Math.max(quota.totalCredits - quota.usedCredits, 0),
      percentUsed,
      resetAt: quota.resetAt.toISOString(),
    };
  }
}
