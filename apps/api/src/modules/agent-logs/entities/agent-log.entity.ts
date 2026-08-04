import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type {
  AgentLogStatus,
  AgentType,
} from '../../../common/ports/agent-log.port';

/**
 * Mirrors the `agent_logs` table created by
 * `1785000060000-CreateAgentLogs.ts` — see that migration's docblock for
 * the Sprint 3 extensions past `schemaV2.sql`.
 *
 * `courseId`/`targetEntityId` stay plain UUID columns (no TypeORM
 * relation), matching `enrollment.entity.ts` and `ai_jobs.entity.ts`, to
 * avoid a module import cycle with CoursesModule.
 */
@Entity({ name: 'agent_logs' })
export class AgentLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_agent_logs_agent_type_executed')
  @Column({
    name: 'agent_type',
    type: 'enum',
    enum: [
      'content_scout',
      'proactive_proctor',
      'tutor_llm',
      'analytics_agent',
    ],
    enumName: 'agent_type',
  })
  agentType!: AgentType;

  @Index('idx_agent_logs_course_executed')
  @Column({ name: 'course_id', type: 'uuid', nullable: true })
  courseId!: string | null;

  // Polymorphic, no enforced FK by design — matches schemaV2.sql.
  @Column({ name: 'target_entity_type', type: 'text', nullable: true })
  targetEntityType!: string | null;

  @Column({ name: 'target_entity_id', type: 'uuid', nullable: true })
  targetEntityId!: string | null;

  @Column({ type: 'text' })
  action!: string;

  @Column({
    type: 'enum',
    enum: ['success', 'failed', 'retrying', 'skipped'],
    enumName: 'agent_log_status',
  })
  status!: AgentLogStatus;

  @Column({ name: 'tokens_used', type: 'integer', nullable: true })
  tokensUsed!: number | null;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs!: number | null;

  @Column({ name: 'row_count', type: 'integer', nullable: true })
  rowCount!: number | null;

  @Column({ name: 'correlation_id', type: 'text', nullable: true })
  correlationId!: string | null;

  // Structured, already-redacted details only — see agent-log.port.ts.
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'executed_at', type: 'timestamptz', default: () => 'now()' })
  executedAt!: Date;
}
