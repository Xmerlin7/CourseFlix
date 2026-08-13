import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getAdminAgentLogs } from '../api/admin-agent-logs.api'
import type { AdminAgentLogListItem, AdminAgentLogsFilter } from '../types/admin.types'

interface UseAdminAgentLogsResult {
  data: AdminAgentLogListItem[] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useAdminAgentLogs(filters: AdminAgentLogsFilter): UseAdminAgentLogsResult {
  const [data, setData] = useState<AdminAgentLogListItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)
  // True once a response has landed. Gates the skeleton — see the guard
  // inside the effect below.
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      // Only the first load shows a skeleton; every load after it keeps
      // the current content mounted. Swapping in a full-page skeleton
      // collapses the page height, which makes the browser reset scroll
      // to the top — that fired after every save/edit/delete, and once
      // per keystroke on the pages whose search term is part of the
      // request, where it read as the page reloading mid-word.
      if (!hasLoadedRef.current) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const logs = await getAdminAgentLogs(filters)
        if (!controller.signal.aborted) {
          setData(logs)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
        }
      } finally {
        if (!controller.signal.aborted) {
          hasLoadedRef.current = true
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is a plain object recreated by callers each render; agentType/status/courseId are the real deps.
  }, [filters.agentType, filters.status, filters.courseId, refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
