import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getMyTickets } from '../api/support.api'
import type { SupportTicketListItem, SupportTicketStatus } from '../types/support.types'

interface UseMyTicketsResult {
  data: SupportTicketListItem[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useMyTickets(status?: SupportTicketStatus): UseMyTicketsResult {
  const [data, setData] = useState<SupportTicketListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const tickets = await getMyTickets(status)
        if (!controller.signal.aborted) setData(tickets)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [status, refetchToken])

  return { data, isLoading, error, refetch: () => setRefetchToken((t) => t + 1) }
}
