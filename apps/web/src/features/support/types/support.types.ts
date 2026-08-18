export type SupportTicketCategory = 'technical' | 'course' | 'payment' | 'account' | 'other'

export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_for_student'
  | 'resolved'
  | 'closed'

export interface SupportTicketListItem {
  id: string
  category: SupportTicketCategory
  subject: string
  status: SupportTicketStatus
  courseTitle: string | null
  studentName: string
  createdAt: string
  updatedAt: string
  hasUnread?: boolean
  isCourseChat: boolean
}

export interface SupportMessage {
  id: string
  authorName: string
  authorAvatarUrl: string | null
  isStaffReply: boolean
  body: string
  createdAt: string
  isUnread?: boolean
}

export interface SupportTicketAttachment {
  id: string
  fileName: string
  mimeType: string
}

export interface SupportTicketDetail extends SupportTicketListItem {
  description: string
  attachments: SupportTicketAttachment[]
  messages: SupportMessage[]
}
