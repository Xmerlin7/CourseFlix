import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { showToast } from '../../../shared/components/Toast'
import { createSupportTicket, type CreateTicketInput } from '../api/support.api'
import { CreateTicketDialog } from '../components/CreateTicketDialog'
import { SupportTicketsPageSkeleton } from '../components/SupportTicketsPageSkeleton'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import { useMyTickets } from '../hooks/useMyTickets'
import { SUPPORT_TICKET_CATEGORY_LABELS } from '../lib/support-status-labels'
import type { SupportTicketStatus } from '../types/support.types'

const STATUS_FILTERS: { value: SupportTicketStatus | undefined; label: string }[] = [
  { value: undefined, label: 'الكل' },
  { value: 'open', label: 'مفتوح' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'waiting_for_student', label: 'بانتظار ردك' },
  { value: 'resolved', label: 'تم الحل' },
  { value: 'closed', label: 'مغلق' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

export function SupportTicketsPage() {
  const [status, setStatus] = useState<SupportTicketStatus | undefined>(undefined)
  const { data, isLoading, error, refetch } = useMyTickets(status)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(input: CreateTicketInput) {
    setIsSubmitting(true)
    try {
      await createSupportTicket(input)
      showToast('تم إرسال طلب الدعم بنجاح', 'success')
      refetch()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <SupportTicketsPageSkeleton />
  }

  return (
    <>
      <div className="section-head">
        <h1 className="page-title">الدعم الفني</h1>
        <button type="button" className="btn primary" onClick={() => setIsCreating(true)}>
          <span className="ms">add_circle</span>
          طلب دعم جديد
        </button>
      </div>

      <div className="tabs" role="tablist" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            role="tab"
            aria-selected={status === filter.value}
            onClick={() => setStatus(filter.value)}
            className={`tab${status === filter.value ? ' active' : ''}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : data.length === 0 ? (
        <EmptyState
          title="لا يوجد طلبات دعم بعد"
          message="لو واجهت أي مشكلة، تقدر تفتح طلب دعم وهيتم الرد عليك"
          actionLabel="طلب دعم جديد"
          onAction={() => setIsCreating(true)}
        />
      ) : (
        <div className="list">
          {data.map((ticket) => (
            <Link key={ticket.id} to={`/student/support/${ticket.id}`} className="list-item">
              <span className="lead">
                <span className="ms">confirmation_number</span>
              </span>
              <span className="body">
                <span className="t">{ticket.subject}</span>
                <span className="s">
                  {SUPPORT_TICKET_CATEGORY_LABELS[ticket.category]}
                  {ticket.courseTitle ? ` · ${ticket.courseTitle}` : ''} · {formatDate(ticket.createdAt)}
                </span>
              </span>
              <span className="end">
                <TicketStatusBadge status={ticket.status} />
              </span>
            </Link>
          ))}
        </div>
      )}

      <CreateTicketDialog
        open={isCreating}
        isSubmitting={isSubmitting}
        onSubmit={handleCreate}
        onClose={() => setIsCreating(false)}
      />
    </>
  )
}
