import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getDiscussions, type DiscussionListFilters } from '../api/community.api'
import type { DiscussionThreadListItem } from '../types/community.types'

interface UseDiscussionsResult {
  data: DiscussionThreadListItem[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

// NOTE: plain useEffect/useState, matching useCourseDetail.ts — no
// data-fetching library is installed in apps/web yet.
export function useDiscussions(
  courseId: string,
  filters: DiscussionListFilters,
): UseDiscussionsResult {
  const [data, setData] = useState<DiscussionThreadListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const threads = await getDiscussions(courseId, filters)
        if (!controller.signal.aborted) {
          setData(threads)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is a plain object; its fields are the real deps.
  }, [courseId, filters.status, filters.search, filters.tag, refetchToken])

  return { data, isLoading, error, refetch: () => setRefetchToken((t) => t + 1) }
}
