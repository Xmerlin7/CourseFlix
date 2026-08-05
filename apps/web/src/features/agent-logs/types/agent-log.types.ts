export type AgentType =
  | 'content_scout'
  | 'proactive_proctor'
  | 'tutor_llm'
  | 'analytics_agent'

export type AgentLogStatus = 'success' | 'failed' | 'retrying' | 'skipped'

export interface AgentLogItem {
  id: string
  agentType: AgentType
  courseId: string | null
  targetEntityType: string | null
  targetEntityId: string | null
  action: string
  status: AgentLogStatus
  tokensUsed: number | null
  durationMs: number | null
  rowCount: number | null
  correlationId: string | null
  metadata: Record<string, unknown> | null
  errorMessage: string | null
  executedAt: string
}

export interface AgentLogFilters {
  agentType?: AgentType
  status?: AgentLogStatus
}
