export type NotificationType =
  | 'hw_assigned'
  | 'quiz_ready'
  | 'progress_report'
  | 'announcement'
  | 'course_update'
  | 'system'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface UnreadCountResponse {
  count: number
}

export interface MarkReadResponse {
  id: string
  isRead: boolean
}
