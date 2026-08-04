import { Inject, Injectable } from '@nestjs/common';
import {
  AGENT_LOG_PORT,
  AgentLogPort,
} from '../../common/ports/agent-log.port';

/**
 * Thin wrapper so the controller stays free of agent-log plumbing.
 * N-3: persists normalized intent, status, row count, duration, and the
 * correlation id via the merged AGENT_LOG_PORT (analytics_agent type).
 * Never logs the raw question text.
 */
@Injectable()
export class AnalyticsLogService {
  constructor(
    @Inject(AGENT_LOG_PORT) private readonly agentLogPort: AgentLogPort,
  ) {}

  async record(input: {
    courseId?: string;
    action: string;
    status: 'success' | 'failed' | 'skipped';
    metadata?: Record<string, unknown>;
    rowCount?: number;
    durationMs?: number;
    errorMessage?: string;
  }): Promise<void> {
    await this.agentLogPort.record({
      agentType: 'analytics_agent',
      action: input.action,
      status: input.status,
      courseId: input.courseId,
      metadata: input.metadata,
      rowCount: input.rowCount,
      durationMs: input.durationMs,
      errorMessage: input.errorMessage,
    });
  }
}
