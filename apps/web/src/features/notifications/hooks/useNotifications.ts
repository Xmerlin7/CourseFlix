import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getNotifications, markNotificationRead } from '../api/notifications.api'
import type { NotificationItem } from '../types/notification.types'

interface UseNotificationsResult {
  data: NotificationItem[]
  isLoading: boolean
  error: ApiError | null
  markRead: (notificationId: string) => Promise<void>
  refetch: () => void
}

export function useNotifications(): UseNotificationsResult {
  const [data, setData] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const notifications = await getNotifications()
        if (!controller.signal.aborted) {
          setData(notifications)
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

  // Updates local state directly instead of refetching: marking one
  // notification read doesn't change anything else server-side, so a
  // full round-trip would just be a slower way to flip one boolean.
  async function markRead(notificationId: string) {
    await markNotificationRead(notificationId)
    setData((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    )
  }

  return {
    data,
    isLoading,
    error,
    markRead,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
