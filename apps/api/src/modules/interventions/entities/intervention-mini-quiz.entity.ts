import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type MiniQuizStatus = 'active' | 'completed';

/**
 * Nabile's N-1 addition on top of the merged interventions schema
 * (`1785000063000-CreateInterventionMiniQuizzes.ts`). Linked 1:1 to
 * `interventions.mini_quiz_id`, which the interventions module leaves
 * null until this service populates it.
 */
@Entity({ name: 'intervention_mini_quizzes' })
export class InterventionMiniQuizEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_mini_quiz_intervention')
  @Column({ name: 'intervention_id', type: 'uuid' })
  interventionId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'weak_concept', type: 'text' })
  weakConcept!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'completed'],
    enumName: 'mini_quiz_status',
    default: 'active',
  })
  status!: MiniQuizStatus;

  @Column({ type: 'integer', nullable: true })
  score!: number | null;

  @Column({ type: 'integer', nullable: true })
  total!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
