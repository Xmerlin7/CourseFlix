import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getAgentLogs } from '../api/agent-logs.api'
import type { AgentLogFilters, AgentLogItem } from '../types/agent-log.types'

interface UseAgentLogsResult {
  data: AgentLogItem[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

// Matches useTeacherCourses.ts — plain useEffect/useState, filters owned
// by the caller so the page's filter chips can drive the query directly.
export function useAgentLogs(filters: AgentLogFilters = {}): UseAgentLogsResult {
  const { agentType, status } = filters
  const [data, setData] = useState<AgentLogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const logs = await getAgentLogs({ agentType, status })
        if (!controller.signal.aborted) {
          setData(logs)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [agentType, status, refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
