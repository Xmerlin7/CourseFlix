import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getAssistantActions } from '../api/assistant-actions.api'
import type { AssistantAction } from '../types/assistant-action.types'

interface UseAssistantActionsResult {
  data: AssistantAction[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * The review queue. Scoped server-side by who is asking — a teacher gets
 * everything awaiting them, an assistant gets only their own submissions
 * — so there is no id to pass here.
 */
export function useAssistantActions(status: string): UseAssistantActionsResult {
  const [data, setData] = useState<AssistantAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)
  // True once a response has landed. Gates the skeleton — same rule as
  // every other list hook: only the first load may collapse the page.
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      if (!hasLoadedRef.current) setIsLoading(true)
      setError(null)
      try {
        const actions = await getAssistantActions(status)
        if (!controller.signal.aborted) setData(actions)
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
  }, [status, refetchToken])

  return { data, isLoading, error, refetch: () => setRefetchToken((t) => t + 1) }
}
