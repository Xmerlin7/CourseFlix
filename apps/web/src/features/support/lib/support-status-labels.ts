import type { SupportTicketStatus } from '../types/support.types'

export const SUPPORT_TICKET_CATEGORY_LABELS: Record<string, string> = {
  technical: 'مشكلة تقنية',
  course: 'مشكلة في الدورة',
  payment: 'مشكلة في الدفع',
  account: 'مشكلة في الحساب',
  other: 'أخرى',
}

export const TICKET_STATUS_META: Record<
  SupportTicketStatus,
  { label: string; icon: string; chipClass: string }
> = {
  open: { label: 'مفتوح', icon: 'radio_button_unchecked', chipClass: 'status-open' },
  in_progress: { label: 'قيد المعالجة', icon: 'sync', chipClass: 'status-pending' },
  waiting_for_student: { label: 'بانتظار ردك', icon: 'hourglass_top', chipClass: 'status-pending' },
  resolved: { label: 'تم الحل', icon: 'check_circle', chipClass: 'status-resolved' },
  closed: { label: 'مغلق', icon: 'cancel', chipClass: 'status-closed' },
}

export function ticketStatusLabel(status: SupportTicketStatus): string {
  return TICKET_STATUS_META[status].label
}
