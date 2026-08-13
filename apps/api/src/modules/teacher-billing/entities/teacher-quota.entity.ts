import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One row per teacher — how much AI credit they get per month, how much
 * they have left, and when the next monthly reset happens. Admin top-ups
 * add to `totalCredits`; `usedCredits` counts consumption inside the
 * current cycle and resets to zero (with `totalCredits` replenished to
 * the allowance) when `resetAt` passes.
 */
@Entity({ name: 'teacher_quotas' })
export class TeacherQuotaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('ux_teacher_quotas_teacher_id', { unique: true })
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @Column({ name: 'monthly_allowance', type: 'int' })
  monthlyAllowance!: number;

  @Column({ name: 'total_credits', type: 'int' })
  totalCredits!: number;

  @Column({ name: 'used_credits', type: 'int' })
  usedCredits!: number;

  @Column({ name: 'reset_at', type: 'timestamptz' })
  resetAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
