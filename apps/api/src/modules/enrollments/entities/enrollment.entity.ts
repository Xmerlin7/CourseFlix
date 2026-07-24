import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type EnrollmentStatus = 'active' | 'suspended' | 'completed';
export type StatusChangedBy = 'system_agent' | 'teacher';

/**
 * Mirrors the `enrollments` table in `schemaV2.sql` exactly.
 *
 * NOTE: `studentId` / `courseId` are kept as plain UUID columns, not
 * `@ManyToOne` relations, because `UserEntity` / `CourseEntity` are still
 * plain TODO stub classes (not real TypeORM entities yet — that's
 * Albraa's / Seif's track). Wiring relations now would break the moment
 * those land in a different shape. Add the relations once both sides
 * exist as real entities.
 *
 * `suspendedBySubmissionId` intentionally has no FK: it points at
 * `homework_submissions`, which is out of Sprint 1 scope (quiz/homework
 * grading is explicitly excluded — see "Sprint 1 Boundaries").
 */
@Entity({ name: 'enrollments' })
@Index('uq_enrollments_student_course', ['studentId', 'courseId'], {
  unique: true,
})
export class EnrollmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'completed'],
    enumName: 'enrollment_status',
    default: 'active',
  })
  status!: EnrollmentStatus;

  @Column({ name: 'suspended_reason', type: 'text', nullable: true })
  suspendedReason!: string | null;

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt!: Date | null;

  // No FK: homework_submissions doesn't exist in Sprint 1. See class docblock.
  @Column({
    name: 'suspended_by_submission_id',
    type: 'uuid',
    nullable: true,
  })
  suspendedBySubmissionId!: string | null;

  @Column({
    name: 'status_changed_by',
    type: 'enum',
    enum: ['system_agent', 'teacher'],
    enumName: 'status_changed_by_type',
    nullable: true,
  })
  statusChangedBy!: StatusChangedBy | null;

  @Column({ name: 'override_active', type: 'boolean', default: false })
  overrideActive!: boolean;

  // TypeORM returns `numeric` as a string to avoid float precision loss.
  // Superseded by content_progress aggregation in Sprint 2; not used yet.
  @Column({
    name: 'progress_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  progressPercentage!: string | null;

  @CreateDateColumn({ name: 'enrolled_at', type: 'timestamptz' })
  enrolledAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
