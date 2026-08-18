import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getTicket } from '../api/support.api'
import type { SupportTicketDetail } from '../types/support.types'

interface UseTicketResult {
  data: SupportTicketDetail | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useTicket(ticketId: string): UseTicketResult {
  const [data, setData] = useState<SupportTicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load(showLoading: boolean) {
      if (showLoading) setIsLoading(true)
      setError(null)
      try {
        const ticket = await getTicket(ticketId)
        if (!controller.signal.aborted) setData(ticket)
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
  }, [ticketId, refetchToken])

  return { data, isLoading, error, refetch: () => setRefetchToken((t) => t + 1) }
}
