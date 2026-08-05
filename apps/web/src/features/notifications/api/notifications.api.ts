import { httpClient } from '../../../shared/api/http-client'
import type {
  MarkAllReadResponse,
  MarkReadResponse,
  NotificationFilters,
  NotificationItem,
  UnreadCountResponse,
} from '../types/notification.types'

export async function getNotifications(
  filters: NotificationFilters = {},
): Promise<NotificationItem[]> {
  return httpClient.get<NotificationItem[]>('/notifications', { searchParams: filters })
}

export async function getUnreadNotificationsCount(): Promise<UnreadCountResponse> {
  return httpClient.get<UnreadCountResponse>('/notifications/unread-count')
}

export async function markNotificationRead(notificationId: string): Promise<MarkReadResponse> {
  return httpClient.patch<MarkReadResponse>(`/notifications/${notificationId}/read`)
}

export async function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
  return httpClient.patch<MarkAllReadResponse>('/notifications/read-all')
}
