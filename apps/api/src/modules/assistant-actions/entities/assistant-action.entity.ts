import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AssistantActionStatus = 'pending' | 'approved' | 'rejected';

/**
 * One parked write from an assistant, waiting on the teacher.
 *
 * Assistants act on the teacher's behalf but nothing they do takes effect
 * until the teacher approves it, so every write they make on the teacher
 * surface is recorded here instead of being executed. On approval the
 * request is replayed against the same service the controller would have
 * called (see assistant-action.registry.ts); on rejection it is simply
 * marked and never runs.
 *
 * The request is stored as method + route key + params + body rather than
 * as a typed per-action column set: the parked surface spans four
 * controllers and twenty-odd endpoints whose payloads have nothing in
 * common, and a shared shape would either be mostly-null columns or a
 * table per endpoint.
 */
@Entity({ name: 'assistant_actions' })
export class AssistantActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_assistant_actions_assistant_id')
  @Column({ name: 'assistant_id', type: 'uuid' })
  assistantId!: string;

  /** The teacher whose data this touches, and who reviews it. */
  @Index('idx_assistant_actions_teacher_id')
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  /**
   * Registry key: `${METHOD} ${route pattern}`, e.g.
   * `POST /api/v1/teacher/courses`. Matches a replay entry rather than
   * the concrete URL, so the ids live in `params`.
   */
  @Column({ name: 'route_key', type: 'text' })
  routeKey!: string;

  @Column({ name: 'params', type: 'jsonb', default: () => "'{}'::jsonb" })
  params!: Record<string, string>;

  @Column({ name: 'body', type: 'jsonb', default: () => "'{}'::jsonb" })
  body!: Record<string, unknown>;

  /**
   * Arabic one-liner for the review list, built when the action is
   * parked. Rendered rather than recomputed at read time because it may
   * quote a title the action itself later changes.
   */
  @Column({ name: 'summary', type: 'text' })
  summary!: string;

  @Index('idx_assistant_actions_status')
  @Column({ type: 'text', default: 'pending' })
  status!: AssistantActionStatus;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  /** Teacher's reason when rejecting; shown to the assistant. */
  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote!: string | null;

  /**
   * Set when an approved action was replayed but the replay itself
   * failed — the course it edited was deleted in the meantime, say. The
   * row stays `approved` so the teacher's decision is not lost, but the
   * teacher is told it did not land.
   */
  @Column({ name: 'execution_error', type: 'text', nullable: true })
  executionError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
