import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { QuestionType } from '../../quizzes/entities/question.entity';

/**
 * Nabile's N-1 addition (`1785000063000-CreateInterventionMiniQuizzes.ts`).
 * Deterministic questions generated from the intervention's weak concept —
 * `options` may be null for free-text prompts, but the seed/fallback bank
 * always provides them.
 */
@Entity({ name: 'intervention_mini_quiz_questions' })
export class InterventionMiniQuizQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_mini_quiz_questions_quiz')
  @Column({ name: 'mini_quiz_id', type: 'uuid' })
  miniQuizId!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({
    type: 'enum',
    enum: ['mcq', 'true_false'],
    enumName: 'question_type',
  })
  type!: QuestionType;

  @Column({ type: 'text', array: true, nullable: true })
  options!: string[] | null;

  @Column({ name: 'correct_answer', type: 'text' })
  correctAnswer!: string;

  @Column({ name: 'order_index', type: 'integer', default: 0 })
  orderIndex!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
