import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { showToast } from '../../../shared/components/Toast'
import { createSupportTicket, type CreateTicketInput } from '../api/support.api'
import { CreateTicketDialog } from '../components/CreateTicketDialog'
import { SupportTicketsPageSkeleton } from '../components/SupportTicketsPageSkeleton'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import { useMyTickets } from '../hooks/useMyTickets'
import { SUPPORT_TICKET_CATEGORY_LABELS } from '../lib/support-status-labels'
import type { SupportTicketStatus } from '../types/support.types'

const STATUS_FILTERS: { value: SupportTicketStatus | undefined; label: string; countKey: string }[] = [
  { value: undefined, label: 'الكل', countKey: 'all' },
  { value: 'open', label: 'مفتوح', countKey: 'open' },
  { value: 'in_progress', label: 'قيد المعالجة', countKey: 'in_progress' },
  { value: 'waiting_for_student', label: 'بانتظار ردك', countKey: 'waiting_for_student' },
  { value: 'resolved', label: 'تم الحل', countKey: 'resolved' },
  { value: 'closed', label: 'مغلق', countKey: 'closed' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

const PAGE_SIZE = 10

function getEmptyStateProps(status?: SupportTicketStatus) {
  switch (status) {
    case 'open':
      return {
        title: 'مفيش طلبات مفتوحة حاليًا',
        message: 'جميع طلبات الدعم المفتوحة تم متابعتها والإجابة عليها.',
      }
    case 'in_progress':
      return {
        title: 'مفيش طلبات قيد المعالجة حاليًا',
        message: 'لا توجد طلبات يجرى العمل عليها في الوقت الحالي.',
      }
    case 'waiting_for_student':
      return {
        title: 'مفيش طلبات بانتظار ردك',
        message: 'ليس لديك أي طلبات تتطلب ردًا أو توضيحًا منك الآن.',
      }
    case 'resolved':
      return {
        title: 'مفيش طلبات تم حلها لحد دلوقتي',
        message: 'الطلبات المجابة والتي تم حلها ستظهر هنا.',
      }
    case 'closed':
      return {
        title: 'مفيش طلبات مغلقة حاليًا',
        message: 'الطلبات المغلقة تظهر هنا.',
      }
    default:
      return {
        title: 'مفيش طلبات دعم لسه',
        message: 'لو واجهتك مشكلة أو عندك استفسار، تقدر تبعت طلب دعم جديد.',
      }
  }
}

export function SupportTicketsPage() {
  const [selectedStatus, setSelectedStatus] = useState<SupportTicketStatus | undefined>(undefined)
  const { data: allTickets, isLoading, error, refetch } = useMyTickets(undefined)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredTickets = useMemo(() => {
    if (!selectedStatus) return allTickets
    return allTickets.filter((t) => t.status === selectedStatus)
  }, [allTickets, selectedStatus])

  const toHaystack = useCallback(
    (ticket: (typeof allTickets)[number]) =>
      `${ticket.subject} ${ticket.courseTitle ?? ''} ${SUPPORT_TICKET_CATEGORY_LABELS[ticket.category]} ${ticket.id}`,
    [],
  )
  const list = usePaginatedList(filteredTickets, toHaystack, PAGE_SIZE)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allTickets.length,
      open: 0,
      in_progress: 0,
      waiting_for_student: 0,
      resolved: 0,
      closed: 0,
    }
    allTickets.forEach((ticket) => {
      if (counts[ticket.status] !== undefined) {
        counts[ticket.status] += 1
      }
    })
    return counts
  }, [allTickets])

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

  const emptyProps = getEmptyStateProps(selectedStatus)

  return (
    <>
      <div className="support-page-head">
        <div className="support-page-title-group">
          <h1 className="page-title">الدعم الفني</h1>
          <p className="support-page-subtitle">لو عندك مشكلة أو استفسار، إحنا هنا لمساعدتك</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setIsCreating(true)}>
          <span className="ms" aria-hidden="true">add_circle</span>
          طلب دعم جديد
        </button>
      </div>

      <div className="support-status-filters" role="tablist" aria-label="تصفية طلبات الدعم">
        {STATUS_FILTERS.map((filter) => {
          const isActive = selectedStatus === filter.value
          const count = statusCounts[filter.countKey] ?? 0
          return (
            <button
              key={filter.label}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedStatus(filter.value)}
              className={`support-filter-chip${isActive ? ' active' : ''}`}
            >
              <span>{filter.label}</span>
              <span className="support-filter-count">{count}</span>
            </button>
          )
        })}
      </div>

      <SearchField
        id="my-tickets-search"
        label="بحث في طلباتك"
        placeholder="ابحث بعنوان الطلب أو الدورة أو رقم الطلب..."
        value={list.query}
        onChange={list.search}
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : list.isEmptyResult ? (
        <EmptyState
          title="لا توجد نتائج"
          message="مفيش طلبات مطابقة لبحثك، جرّب كلمة تانية"
          actionLabel="مسح البحث"
          onAction={() => list.search('')}
        />
      ) : list.pageItems.length === 0 ? (
        <EmptyState
          title={emptyProps.title}
          message={emptyProps.message}
          actionLabel="طلب دعم جديد"
          onAction={() => setIsCreating(true)}
        />
      ) : (
        <div className="support-tickets-list">
          {list.pageItems.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/student/support/${ticket.id}`}
              className={`support-ticket-card card lift${ticket.hasUnread ? ' unread' : ''}`}
            >
              <div className="support-card-top">
                <div className="support-card-meta">
                  {ticket.hasUnread && (
                    <span className="unread-badge-pill" aria-label="نشاط جديد">
                      <span className="unread-dot" aria-hidden="true" />
                      <span>جديد</span>
                    </span>
                  )}
                  <span className="support-card-id">#{ticket.id.slice(0, 8)}</span>
                  <span className="chip outline sm">
                    {SUPPORT_TICKET_CATEGORY_LABELS[ticket.category]}
                  </span>
                </div>
                <TicketStatusBadge status={ticket.status} />
              </div>

              <h2 className="support-card-title">{ticket.subject}</h2>

              <div className="support-card-footer">
                <div className="support-card-info">
                  {ticket.courseTitle && (
                    <span className="support-card-info-item">
                      <span className="ms sm" aria-hidden="true">school</span>
                      الدورة: {ticket.courseTitle}
                    </span>
                  )}
                  <span className="support-card-info-item">
                    <span className="ms sm" aria-hidden="true">schedule</span>
                    آخر تحديث: {formatDate(ticket.updatedAt || ticket.createdAt)}
                  </span>
                </div>
                <span className="ms support-card-arrow" aria-hidden="true">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="طلب"
        />
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

