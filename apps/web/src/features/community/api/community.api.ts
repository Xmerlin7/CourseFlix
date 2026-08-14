import { httpClient } from '../../../shared/api/http-client'
import type {
  Announcement,
  AnnouncementDetail,
  DiscussionReply,
  DiscussionStatusFilter,
  DiscussionThreadDetail,
  DiscussionThreadListItem,
} from '../types/community.types'

export interface DiscussionListFilters {
  status?: DiscussionStatusFilter
  search?: string
  tag?: string
}

export interface CreateThreadInput {
  title?: string
  body: string
  tags: string[]
  attachment?: File | null
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export function getDiscussions(
  courseId: string,
  filters: DiscussionListFilters = {},
): Promise<DiscussionThreadListItem[]> {
  const query = buildQuery({
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
    search: filters.search,
    tag: filters.tag,
  })
  return httpClient.get<DiscussionThreadListItem[]>(`/courses/${courseId}/discussions${query}`)
}

export function getDiscussion(threadId: string): Promise<DiscussionThreadDetail> {
  return httpClient.get<DiscussionThreadDetail>(`/discussions/${threadId}`)
}

export function markCourseCommunityRead(courseId: string): Promise<{ updated: number }> {
  return httpClient.patch<{ updated: number }>(`/courses/${courseId}/discussions/read`)
}

export function createDiscussion(
  courseId: string,
  input: CreateThreadInput,
): Promise<DiscussionThreadDetail> {
  const formData = new FormData()
  formData.set('title', input.title || input.body)
  formData.set('body', input.body)
  formData.set('tags', JSON.stringify(input.tags))
  if (input.attachment) {
    formData.set('attachment', input.attachment)
  }
  return httpClient.postMultipart<DiscussionThreadDetail>(
    `/courses/${courseId}/discussions`,
    formData,
  )
}

export function createReply(threadId: string, body: string): Promise<DiscussionReply> {
  return httpClient.post<DiscussionReply>(`/discussions/${threadId}/replies`, { body })
}

export function acceptAnswer(
  threadId: string,
  replyId: string,
): Promise<DiscussionThreadDetail> {
  return httpClient.post<DiscussionThreadDetail>(`/discussions/${threadId}/accept/${replyId}`)
}

export function unacceptAnswer(
  threadId: string,
  replyId?: string,
): Promise<DiscussionThreadDetail> {
  const url = replyId
    ? `/discussions/${threadId}/accept/${replyId}`
    : `/discussions/${threadId}/accept`
  return httpClient.delete<DiscussionThreadDetail>(url)
}

export function toggleHelpful(
  threadId: string,
): Promise<{ isHelpfulByMe: boolean; helpfulCount: number }> {
  return httpClient.post<{ isHelpfulByMe: boolean; helpfulCount: number }>(
    `/discussions/${threadId}/helpful`,
  )
}

export function toggleThreadPin(threadId: string): Promise<DiscussionThreadDetail> {
  return httpClient.patch<DiscussionThreadDetail>(`/discussions/${threadId}/pin`)
}

export function getAnnouncements(courseId: string): Promise<Announcement[]> {
  return httpClient.get<Announcement[]>(`/courses/${courseId}/announcements`)
}

/** Fetches a single announcement by id (resolves its course) so a
 *  notification deep-link can land on the exact post. */
export function getAnnouncement(postId: string): Promise<AnnouncementDetail> {
  return httpClient.get<AnnouncementDetail>(`/announcements/${postId}`)
}

export function createAnnouncement(
  courseId: string,
  content: string,
  attachment?: File | null,
): Promise<Announcement> {
  const formData = new FormData()
  formData.set('content', content)
  if (attachment) formData.set('attachment', attachment)
  return httpClient.postMultipart<Announcement>(`/courses/${courseId}/announcements`, formData)
}

export function updateAnnouncement(postId: string, content: string): Promise<Announcement> {
  return httpClient.patch<Announcement>(`/announcements/${postId}`, { content })
}

export function deleteAnnouncement(postId: string): Promise<void> {
  return httpClient.delete<void>(`/announcements/${postId}`)
}

export function toggleAnnouncementPin(postId: string): Promise<Announcement> {
  return httpClient.patch<Announcement>(`/announcements/${postId}/pin`)
}
