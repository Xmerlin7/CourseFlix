import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type InterventionRuleKey =
  | 'low_quiz_score'
  | 'explicit_confusion_phrase'
  | 'repeated_concept_question';

export type InterventionStatus = 'active' | 'resolved';

/**
 * Mirrors `interventions` from `1785000062000-CreateInterventions.ts` —
 * see that migration's docblock for why this table exists beyond
 * `schemaV2.sql`. The DB-level partial unique index on `dedupKey`
 * (`WHERE status = 'active'`) is the real dedup guard; this entity just
 * needs the column to write to it.
 */
@Entity({ name: 'interventions' })
export class InterventionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_interventions_student')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Index('idx_interventions_teacher')
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @Column({
    name: 'rule_key',
    type: 'enum',
    enum: [
      'low_quiz_score',
      'explicit_confusion_phrase',
      'repeated_concept_question',
    ],
    enumName: 'intervention_rule_key',
  })
  ruleKey!: InterventionRuleKey;

  @Column({ name: 'rule_version', type: 'integer' })
  ruleVersion!: number;

  @Column({ name: 'weak_concept', type: 'text' })
  weakConcept!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'resolved'],
    enumName: 'intervention_status',
    default: 'active',
  })
  status!: InterventionStatus;

  @Column({ name: 'dedup_key', type: 'text' })
  dedupKey!: string;

  @Column({ name: 'mini_quiz_id', type: 'uuid', nullable: true })
  miniQuizId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;
}
