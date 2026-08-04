import { Injectable, Logger } from '@nestjs/common';

/**
 * Sprint 3 day-1 contract (sprint3-plan.md §1/§4 H-3, CF-TASK-074) — the
 * one structured shape every Sprint 3 agent (proctor intervention,
 * Nabile's Analytics Agent) writes through, so `GET
 * /api/v1/teacher/agent-logs` never needs per-agent parsing.
 *
 * Same `useExisting` binding pattern as `notification-producer.port.ts`:
 * `AgentLogsService` implements this directly, so no fake is bound in
 * `agent-logs.module.ts`. `NoopAgentLogPort` is only for a caller module
 * that needs the port before `AgentLogsModule` is in its graph.
 *
 * Redaction is enforced by construction, not by scrubbing afterwards:
 * this input shape has no field for raw prompt text, document text,
 * order PII, or stack traces — callers must never put that data in
 * `action`/`metadata`/`errorMessage` either, since those are the only
 * free-text fields and they are returned as-is by the read API.
 */
export const AGENT_LOG_PORT = Symbol('AGENT_LOG_PORT');

export type AgentType =
  | 'content_scout'
  | 'proactive_proctor'
  | 'tutor_llm'
  | 'analytics_agent';

export type AgentLogStatus = 'success' | 'failed' | 'retrying' | 'skipped';

export interface RecordAgentLogInput {
  agentType: AgentType;
  action: string;
  status: AgentLogStatus;
  courseId?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  tokensUsed?: number;
  durationMs?: number;
  rowCount?: number;
  correlationId?: string;
  // Structured, already-redacted details only (e.g. normalized intent,
  // rule key, date range) — never raw user/document text.
  metadata?: Record<string, unknown>;
  // Short, safe summary only — never a raw stack trace.
  errorMessage?: string;
}

export interface AgentLogPort {
  record(input: RecordAgentLogInput): Promise<void>;
}

@Injectable()
export class NoopAgentLogPort implements AgentLogPort {
  private readonly logger = new Logger(NoopAgentLogPort.name);

  record(input: RecordAgentLogInput): Promise<void> {
    this.logger.log(`(noop) agent log ${input.agentType}: ${input.action}`);
    return Promise.resolve();
  }
}
