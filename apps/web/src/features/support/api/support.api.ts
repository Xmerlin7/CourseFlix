import { httpClient } from '../../../shared/api/http-client'
import type {
  SupportMessage,
  SupportTicketCategory,
  SupportTicketDetail,
  SupportTicketListItem,
  SupportTicketStatus,
} from '../types/support.types'

export interface CreateTicketInput {
  category: SupportTicketCategory
  subject: string
  description: string
  courseId?: string
  attachment?: File | null
}

export interface StaffTicketFilters {
  status?: SupportTicketStatus
  category?: SupportTicketCategory
  courseId?: string
  search?: string
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export function createSupportTicket(input: CreateTicketInput): Promise<SupportTicketDetail> {
  const formData = new FormData()
  formData.set('category', input.category)
  formData.set('subject', input.subject)
  formData.set('description', input.description)
  if (input.courseId) formData.set('courseId', input.courseId)
  if (input.attachment) formData.set('attachment', input.attachment)
  return httpClient.postMultipart<SupportTicketDetail>('/support/tickets', formData)
}

export function getMyTickets(status?: SupportTicketStatus): Promise<SupportTicketListItem[]> {
  return httpClient.get<SupportTicketListItem[]>(`/support/tickets${buildQuery({ status })}`)
}

export function getStaffTickets(filters: StaffTicketFilters): Promise<SupportTicketListItem[]> {
  const query = buildQuery({
    status: filters.status,
    category: filters.category,
    courseId: filters.courseId,
    search: filters.search,
  })
  return httpClient.get<SupportTicketListItem[]>(`/support/staff/tickets${query}`)
}

export function getTicket(ticketId: string): Promise<SupportTicketDetail> {
  return httpClient.get<SupportTicketDetail>(`/support/tickets/${ticketId}`)
}

export function addTicketMessage(ticketId: string, body: string): Promise<SupportMessage> {
  return httpClient.post<SupportMessage>(`/support/tickets/${ticketId}/messages`, { body })
}

export function updateTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
): Promise<SupportTicketDetail> {
  return httpClient.patch<SupportTicketDetail>(`/support/tickets/${ticketId}/status`, { status })
}
