import { httpClient } from '../../../shared/api/http-client'
import type { AgentLogFilters, AgentLogItem } from '../types/agent-log.types'

export async function getAgentLogs(filters: AgentLogFilters = {}): Promise<AgentLogItem[]> {
  return httpClient.get<AgentLogItem[]>('/teacher/agent-logs', { searchParams: filters })
}
