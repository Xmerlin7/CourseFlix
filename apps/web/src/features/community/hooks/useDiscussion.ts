import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getDiscussion } from '../api/community.api'
import type { DiscussionThreadDetail } from '../types/community.types'

interface UseDiscussionResult {
  data: DiscussionThreadDetail | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
  setData: (data: DiscussionThreadDetail) => void
}

export function useDiscussion(threadId: string): UseDiscussionResult {
  const [data, setData] = useState<DiscussionThreadDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const thread = await getDiscussion(threadId)
        if (!controller.signal.aborted) {
          setData(thread)
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
  }, [threadId, refetchToken])

  return { data, isLoading, error, refetch: () => setRefetchToken((t) => t + 1), setData }
}
