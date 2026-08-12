export type DiscussionStatusFilter = 'all' | 'answered' | 'unanswered' | 'mine'

export interface DiscussionAuthorSummary {
  id: string
  fullName: string
  avatarUrl: string | null
  role: 'student' | 'teacher' | 'assistant' | 'admin'
}

export interface DiscussionAttachment {
  id: string
  fileName: string
  mimeType: string
}

export interface DiscussionThreadListItem {
  id: string
  courseId: string
  title: string
  author: DiscussionAuthorSummary
  tags: string[]
  replyCount: number
  helpfulCount: number
  isHelpfulByMe: boolean
  isPinned: boolean
  isAnswered: boolean
  createdAt: string
}

export interface DiscussionReply {
  id: string
  author: DiscussionAuthorSummary
  body: string
  isAccepted: boolean
  createdAt: string
}

export interface DiscussionThreadDetail extends DiscussionThreadListItem {
  body: string
  attachments: DiscussionAttachment[]
  replies: DiscussionReply[]
  canAccept: boolean
  canPin: boolean
}

export interface AnnouncementAttachment {
  id: string
  fileName: string
  mimeType: string
}

export interface Announcement {
  id: string
  content: string
  isPinned: boolean
  attachments: AnnouncementAttachment[]
  canManage: boolean
  createdAt: string
  updatedAt: string
}
