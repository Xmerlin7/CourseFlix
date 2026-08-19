import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { LessonAgentKey } from '../lesson-agents.constants';

export type LessonAgentStepStatus =
  'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type LessonAgentReviewStatus =
  'not_required' | 'pending' | 'approved' | 'rejected' | 'revision_requested';

/**
 * What each agent produced, in a shape the review panel can render
 * without another round-trip. Every field is optional because the union
 * is keyed by which agent wrote it, not by a discriminator column.
 */
export interface LessonAgentStepOutput {
  /** transcript */
  cueCount?: number;
  durationSeconds?: number;
  provider?: string;
  transcriptPreview?: string;

  /** reviewer */
  verdict?: 'approved' | 'rejected';
  reason?: string;

  /** indexer */
  chunkCount?: number;
  embeddedCount?: number;

  /** handout */
  documentId?: string;
  fileName?: string;
  pageTitles?: string[];
  handoutPreview?: string;

  /** quizmaster */
  quizId?: string;
  questions?: Array<{
    type: string;
    text: string;
    options: string[];
    correctAnswer: string;
  }>;
}

/**
 * One agent's slot inside a run — created up front for the whole roster
 * (so the teacher sees the full crew from second zero, greyed out and
 * waiting) and filled in as the worker walks the pipeline.
 *
 * `status` and `reviewStatus` move independently on purpose: an agent
 * can be `completed` while its output is still `pending` a teacher's
 * verdict, and a `revision_requested` step goes back to `running` without
 * its review history being lost.
 */
@Entity({ name: 'lesson_agent_steps' })
export class LessonAgentStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'run_id', type: 'uuid' })
  runId!: string;

  @Column({
    name: 'agent_key',
    type: 'enum',
    enum: ['transcript', 'reviewer', 'indexer', 'handout', 'quizmaster'],
    enumName: 'lesson_agent_key',
  })
  agentKey!: LessonAgentKey;

  @Column({ name: 'order_index', type: 'integer' })
  orderIndex!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
    enumName: 'lesson_agent_step_status',
    default: 'pending',
  })
  status!: LessonAgentStepStatus;

  @Column({
    name: 'review_status',
    type: 'enum',
    enum: [
      'not_required',
      'pending',
      'approved',
      'rejected',
      'revision_requested',
    ],
    enumName: 'lesson_agent_review_status',
    default: 'not_required',
  })
  reviewStatus!: LessonAgentReviewStatus;

  // 0–100, written by the worker as it works through a long stage so the
  // teacher's progress bar moves during the minutes an LLM call takes.
  @Column({ type: 'integer', default: 0 })
  progress!: number;

  // One human sentence about what this agent ended up producing —
  // "استخرجت ٤١٢ جملة من الفيديو (١٨ دقيقة)".
  @Column({ type: 'text', nullable: true })
  headline!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  output!: LessonAgentStepOutput | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  // Bumped when the teacher sends feedback and the step re-runs; the row
  // itself is reused (see the UNIQUE constraint in the migration).
  @Column({ type: 'integer', default: 1 })
  attempt!: number;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
