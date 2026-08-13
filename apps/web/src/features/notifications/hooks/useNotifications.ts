import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications.api'
import type {
  NotificationItem,
  NotificationStatusFilter,
  NotificationType,
} from '../types/notification.types'

type StatusFilterOption = NotificationStatusFilter | 'all'
type TypeFilterOption = NotificationType | 'all'

interface UseNotificationsResult {
  data: NotificationItem[]
  isLoading: boolean
  error: ApiError | null
  statusFilter: StatusFilterOption
  setStatusFilter: (value: StatusFilterOption) => void
  typeFilter: TypeFilterOption
  setTypeFilter: (value: TypeFilterOption) => void
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>
  refetch: () => void
}

export function useNotifications(): UseNotificationsResult {
  const [data, setData] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)
  // True once a response has landed. Gates the skeleton — see the guard
  // inside the effect below.
  const hasLoadedRef = useRef(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilterOption>('all')

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
        const notifications = await getNotifications({
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
        })
        if (!controller.signal.aborted) {
          setData(notifications)
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
  }, [refetchToken, statusFilter, typeFilter])

  // Updates local state directly instead of refetching: marking one
  // notification read doesn't change anything else server-side, so a
  // full round-trip would just be a slower way to flip one boolean. If
  // the "unread only" filter is active, a just-read item no longer
  // belongs in the list, so it's dropped instead of just flipped.
  async function markRead(notificationId: string) {
    await markNotificationRead(notificationId)
    setData((current) =>
      statusFilter === 'unread'
        ? current.filter((notification) => notification.id !== notificationId)
        : current.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification,
          ),
    )
  }

  async function markAllRead() {
    await markAllNotificationsRead()
    setData((current) =>
      statusFilter === 'unread'
        ? []
        : current.map((notification) => ({ ...notification, isRead: true })),
    )
  }

  return {
    data,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    markRead,
    markAllRead,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
