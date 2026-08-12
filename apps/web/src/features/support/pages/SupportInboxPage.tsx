import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { useAuth } from '../../auth/hooks/useAuth'
import { SupportInboxSkeleton } from '../components/SupportInboxSkeleton'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import { SUPPORT_TICKET_CATEGORY_LABELS } from '../lib/support-status-labels'
import { useStaffTickets } from '../hooks/useStaffTickets'
import type { SupportTicketStatus } from '../types/support.types'

const STATUS_FILTERS: { value: SupportTicketStatus | undefined; label: string }[] = [
  { value: undefined, label: 'الكل' },
  { value: 'open', label: 'مفتوح' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'waiting_for_student', label: 'بانتظار الطالب' },
  { value: 'resolved', label: 'تم الحل' },
  { value: 'closed', label: 'مغلق' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

export function SupportInboxPage() {
  const { user } = useAuth()
  const detailPathPrefix = user?.role === 'admin' ? '/admin/support' : '/teacher/support'

  const [status, setStatus] = useState<SupportTicketStatus | undefined>(undefined)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useStaffTickets({ status, search })

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
  }

  if (isLoading) return <SupportInboxSkeleton />

  return (
    <>
      <div className="section-head">
        <h1 className="page-title">صندوق الدعم الفني</h1>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex" style={{ gap: 8, marginBottom: 14 }}>
        <div className="tf" style={{ flex: 1, maxWidth: 320, marginBottom: 0 }}>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ابحث في طلبات الدعم..."
            aria-label="ابحث في طلبات الدعم"
          />
        </div>
        <button type="submit" className="btn outline">
          <span className="ms">search</span>
        </button>
      </form>

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
        <EmptyState title="لا يوجد طلبات دعم" message="لا يوجد طلبات دعم مطابقة حاليًا" />
      ) : (
        <div className="list">
          {data.map((ticket) => (
            <Link key={ticket.id} to={`${detailPathPrefix}/${ticket.id}`} className="list-item">
              <span className="lead">
                <span className="ms">confirmation_number</span>
              </span>
              <span className="body">
                <span className="t">{ticket.subject}</span>
                <span className="s">
                  {ticket.studentName} · {SUPPORT_TICKET_CATEGORY_LABELS[ticket.category]}
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
    </>
  )
}
