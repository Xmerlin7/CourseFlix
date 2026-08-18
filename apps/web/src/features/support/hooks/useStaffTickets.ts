import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getStaffTickets, type StaffTicketFilters } from '../api/support.api'
import type { SupportTicketListItem } from '../types/support.types'

interface UseStaffTicketsResult {
  data: SupportTicketListItem[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useStaffTickets(filters: StaffTicketFilters): UseStaffTicketsResult {
  const [data, setData] = useState<SupportTicketListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load(showLoading: boolean) {
      if (showLoading) setIsLoading(true)
      setError(null)
      try {
        const tickets = await getStaffTickets(filters)
        if (!controller.signal.aborted) setData(tickets)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void load(true)
    const intervalId = window.setInterval(() => void load(false), 30_000)
    return () => {
      window.clearInterval(intervalId)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is a plain object; its fields are the real deps.
  }, [filters.status, filters.category, filters.courseId, filters.search, refetchToken])

  return { data, isLoading, error, refetch: () => setRefetchToken((t) => t + 1) }
}
