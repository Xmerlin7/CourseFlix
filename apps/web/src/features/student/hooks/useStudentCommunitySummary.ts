import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getStudentCommunitySummary } from '../api/student.api'
import type { StudentCommunitySummaryItem } from '../types/student.types'
import { UNREAD_NOTIFICATIONS_CHANGED_EVENT } from '../../notifications/utils/notificationEvents'

interface UseStudentCommunitySummaryResult {
  data: StudentCommunitySummaryItem[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Per-course last-activity preview + unread count for the Community list. */
export function useStudentCommunitySummary(): UseStudentCommunitySummaryResult {
  const [data, setData] = useState<StudentCommunitySummaryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    function handleUnreadChange() {
      setRefetchToken((token) => token + 1)
    }

    window.addEventListener(UNREAD_NOTIFICATIONS_CHANGED_EVENT, handleUnreadChange)
    return () => {
      window.removeEventListener(UNREAD_NOTIFICATIONS_CHANGED_EVENT, handleUnreadChange)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const summary = await getStudentCommunitySummary()
        if (!controller.signal.aborted) {
          setData(summary)
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
  }, [refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
