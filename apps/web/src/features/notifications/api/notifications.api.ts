import { httpClient } from '../../../shared/api/http-client'
import type {
  MarkReadResponse,
  NotificationItem,
  UnreadCountResponse,
} from '../types/notification.types'

export async function getNotifications(): Promise<NotificationItem[]> {
  return httpClient.get<NotificationItem[]>('/notifications')
}

export async function getUnreadNotificationsCount(): Promise<UnreadCountResponse> {
  return httpClient.get<UnreadCountResponse>('/notifications/unread-count')
}

export async function markNotificationRead(notificationId: string): Promise<MarkReadResponse> {
  return httpClient.patch<MarkReadResponse>(`/notifications/${notificationId}/read`)
}
