import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { LessonAgentKey } from '../lesson-agents.constants';

/**
 * The vocabulary the timeline knows how to draw. `handoff` is the one
 * that carries `toAgentKey` — it's the "المُفرِّغ سلّم النص للمُفهرِس"
 * line, drawn as an arrow between two agent cards rather than as a row.
 */
export type LessonAgentEventType =
  | 'run_started'
  | 'agent_started'
  | 'agent_progress'
  | 'handoff'
  | 'agent_completed'
  | 'agent_failed'
  | 'agent_skipped'
  | 'review_requested'
  | 'teacher_feedback'
  | 'teacher_approved'
  | 'teacher_rejected'
  | 'run_completed'
  | 'run_failed';

/**
 * Append-only narration of a run — what the teacher actually watches.
 *
 * Kept separate from `lesson_agent_steps` because a step is a mutable,
 * re-runnable slot while its history is not: re-running the handout
 * agent overwrites the step's `output`, but the events explaining why it
 * re-ran have to survive.
 *
 * There is no update path and no service method to edit a row; rows are
 * only ever inserted (by the worker) and read (by the teacher).
 */
@Entity({ name: 'lesson_agent_events' })
export class LessonAgentEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'run_id', type: 'uuid' })
  runId!: string;

  @Column({ name: 'step_id', type: 'uuid', nullable: true })
  stepId!: string | null;

  @Column({
    name: 'agent_key',
    type: 'enum',
    enum: ['transcript', 'reviewer', 'indexer', 'handout', 'quizmaster'],
    enumName: 'lesson_agent_key',
    nullable: true,
  })
  agentKey!: LessonAgentKey | null;

  // Only set on `handoff` events — the agent receiving the baton.
  @Column({
    name: 'to_agent_key',
    type: 'enum',
    enum: ['transcript', 'reviewer', 'indexer', 'handout', 'quizmaster'],
    enumName: 'lesson_agent_key',
    nullable: true,
  })
  toAgentKey!: LessonAgentKey | null;

  // Plain text, not an enum — see the migration docblock: the event
  // vocabulary grows with every new thing an agent learns to narrate,
  // and a display-only log doesn't earn a migration per sentence.
  @Column({ type: 'text' })
  type!: LessonAgentEventType;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
