import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A teacher's note asking one agent to redo its work, same append-only
 * thread shape as `quiz_generation_feedback` — the worker replays the
 * whole thread into the prompt on each re-run, so the agent sees every
 * correction it has been given, not just the latest one.
 *
 * Scoped to a step rather than a run because the teacher comments on one
 * agent's output at a time ("الشرح مختصر أوي") and only that agent
 * re-runs.
 */
@Entity({ name: 'lesson_agent_step_feedback' })
export class LessonAgentStepFeedbackEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'step_id', type: 'uuid' })
  stepId!: string;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
