import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  HandoutDetailLevel,
  QuizDifficulty,
} from '../lesson-agents.constants';

/**
 * Per-teacher defaults for the lesson agent pipeline, keyed by the
 * teacher themselves — there is no surrogate `id`, since a teacher can
 * only ever have one set of preferences.
 *
 * A teacher who has never opened the settings form has no row at all;
 * `LessonAgentsService#getSettings` materialises the defaults in that
 * case rather than seeding a row on signup, so the defaults can be
 * changed in code without a backfill.
 *
 * Only the two optional agents appear here. `transcript`, `reviewer` and
 * `indexer` are deliberately absent: turning them off would leave a
 * lesson the student assistant cannot answer questions about, which is
 * the one thing this pipeline always guarantees.
 */
@Entity({ name: 'teacher_agent_settings' })
export class TeacherAgentSettingsEntity {
  @PrimaryColumn({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @Column({ name: 'handout_enabled', type: 'boolean', default: true })
  handoutEnabled!: boolean;

  @Column({ name: 'handout_page_count', type: 'integer', default: 4 })
  handoutPageCount!: number;

  @Column({ name: 'handout_detail_level', type: 'text', default: 'standard' })
  handoutDetailLevel!: HandoutDetailLevel;

  @Column({ name: 'handout_include_examples', type: 'boolean', default: true })
  handoutIncludeExamples!: boolean;

  @Column({ name: 'handout_include_key_terms', type: 'boolean', default: true })
  handoutIncludeKeyTerms!: boolean;

  @Column({ name: 'handout_include_summary', type: 'boolean', default: true })
  handoutIncludeSummary!: boolean;

  @Column({ name: 'quiz_enabled', type: 'boolean', default: true })
  quizEnabled!: boolean;

  @Column({ name: 'quiz_difficulty', type: 'text', default: 'medium' })
  quizDifficulty!: QuizDifficulty;

  // Per type, so the teacher gets exactly the breakdown they asked for
  // instead of a total the quizmaster divides up (migration 1786613800000).
  @Column({ name: 'quiz_mcq_count', type: 'integer', default: 5 })
  quizMcqCount!: number;

  @Column({ name: 'quiz_true_false_count', type: 'integer', default: 3 })
  quizTrueFalseCount!: number;

  @Column({ name: 'quiz_due_in_days', type: 'integer', default: 7 })
  quizDueInDays!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
