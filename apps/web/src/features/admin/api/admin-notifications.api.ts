import { httpClient } from '../../../shared/api/http-client'
import type { AdminNotificationListItem, AdminNotificationsFilter } from '../types/admin.types'

export async function getAdminNotifications(
  filters: AdminNotificationsFilter = {},
): Promise<AdminNotificationListItem[]> {
  return httpClient.get<AdminNotificationListItem[]>('/admin/notifications-log', {
    searchParams: filters,
  })
}

export async function deleteAdminNotification(notificationId: string): Promise<void> {
  await httpClient.delete(`/admin/notifications-log/${notificationId}`)
}
