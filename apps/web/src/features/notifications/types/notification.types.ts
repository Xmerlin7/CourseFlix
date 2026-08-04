export type NotificationType =
  | 'hw_assigned'
  | 'quiz_ready'
  | 'progress_report'
  | 'announcement'
  | 'course_update'
  | 'system'

export type NotificationStatusFilter = 'unread' | 'read'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface NotificationFilters {
  status?: NotificationStatusFilter
  type?: NotificationType
}

export interface UnreadCountResponse {
  count: number
}

export interface MarkReadResponse {
  id: string
  isRead: boolean
}

export interface MarkAllReadResponse {
  updated: number
}
