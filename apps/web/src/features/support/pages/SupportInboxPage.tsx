import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { Pagination } from '../../../shared/components/Pagination'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { useAuth } from '../../auth/hooks/useAuth'
import { SupportInboxSkeleton } from '../components/SupportInboxSkeleton'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import { useStaffTickets } from '../hooks/useStaffTickets'
import { SUPPORT_TICKET_CATEGORY_LABELS } from '../lib/support-status-labels'
import type { SupportTicketStatus } from '../types/support.types'

const STATUS_FILTERS: { value: SupportTicketStatus | undefined; label: string; countKey: string }[] = [
  { value: undefined, label: 'الكل', countKey: 'all' },
  { value: 'open', label: 'مفتوح', countKey: 'open' },
  { value: 'in_progress', label: 'قيد المعالجة', countKey: 'in_progress' },
  { value: 'waiting_for_student', label: 'بانتظار الطالب', countKey: 'waiting_for_student' },
  { value: 'resolved', label: 'تم الحل', countKey: 'resolved' },
  { value: 'closed', label: 'مغلق', countKey: 'closed' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

const PAGE_SIZE = 10

/** This page already filters `filteredTickets` itself. */
const NO_CLIENT_FILTER = () => ''

function getEmptyStateProps(status?: SupportTicketStatus) {
  switch (status) {
    case 'open':
      return {
        title: 'لا توجد طلبات مفتوحة حاليًا',
        message: 'جميع طلبات الدعم المفتوحة تم الإجابة عليها ومتابعتها.',
      }
    case 'in_progress':
      return {
        title: 'لا توجد طلبات قيد المعالجة حاليًا',
        message: 'لا توجد طلبات يجرى العمل عليها في الوقت الحالي.',
      }
    case 'waiting_for_student':
      return {
        title: 'لا توجد طلبات بانتظار رد الطالب',
        message: 'ليس هناك طلبات معلقة بانتظار إفادة أو توضيح من الطالب.',
      }
    case 'resolved':
      return {
        title: 'لا توجد طلبات تم حلها حتى الآن',
        message: 'الطلبات المجابة والتي تم حسمها تظهر هنا.',
      }
    case 'closed':
      return {
        title: 'لا توجد طلبات مغلقة حاليًا',
        message: 'الطلبات المغلقة تظهر هنا.',
      }
    default:
      return {
        title: 'لا يوجد طلبات دعم',
        message: 'لم يتم استلام أي طلبات دعم من الطلاب حتى الآن.',
      }
  }
}

export function SupportInboxPage() {
  const { user } = useAuth()
  const detailPathPrefix = user?.role === 'admin' ? '/admin/support' : '/teacher/support'

  const [selectedStatus, setSelectedStatus] = useState<SupportTicketStatus | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: allTickets, isLoading, error, refetch } = useStaffTickets({ search: searchQuery })

  const filteredTickets = useMemo(() => {
    let list = allTickets
    if (selectedStatus) {
      list = list.filter((t) => t.status === selectedStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.studentName.toLowerCase().includes(q) ||
          (t.courseTitle && t.courseTitle.toLowerCase().includes(q)) ||
          t.id.toLowerCase().includes(q) ||
          SUPPORT_TICKET_CATEGORY_LABELS[t.category]?.toLowerCase().includes(q),
      )
    }
    return list
  }, [allTickets, selectedStatus, searchQuery])

  // This page keeps its own search box (it matches the ticket UUID, which
  // the shared field's Arabic folding would mangle), so the hook only
  // paginates — `searchQuery` is passed purely to reset to page 1.
  const list = usePaginatedList(filteredTickets, NO_CLIENT_FILTER, PAGE_SIZE, searchQuery)

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

  if (isLoading) return <SupportInboxSkeleton />

  const emptyProps = getEmptyStateProps(selectedStatus)

  return (
    <>
      <div className="support-page-head">
        <div className="support-page-title-group">
          <h1 className="page-title">صندوق الدعم الفني</h1>
          <p className="support-page-subtitle">متابعة وإدارة طلبات الدعم الفني الخاصة بالطلاب والرد عليها</p>
        </div>
      </div>

      <div className="support-controls-section">
        <div className="support-search-field">
          <span className="ms search-icon" aria-hidden="true">search</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في طلبات الدعم..."
            aria-label="ابحث في طلبات الدعم"
          />
          {searchQuery && (
            <button
              type="button"
              className="icon-btn clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
            >
              <span className="ms">close</span>
            </button>
          )}
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
      </div>

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : filteredTickets.length === 0 ? (
        searchQuery ? (
          <EmptyState
            title="لا توجد نتائج بحث"
            message={`لم نجد أي طلبات تتطابق مع "${searchQuery}"`}
            actionLabel="مسح البحث"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <EmptyState title={emptyProps.title} message={emptyProps.message} />
        )
      ) : (
        <div className="support-tickets-list">
          {list.pageItems.map((ticket) => (
            <Link
              key={ticket.id}
              to={`${detailPathPrefix}/${ticket.id}`}
              className="support-ticket-card card lift"
            >
              <div className="support-card-top">
                <div className="support-card-meta">
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
                  <span className="support-card-info-item">
                    <span className="ms sm" aria-hidden="true">person</span>
                    الطالب: {ticket.studentName}
                  </span>
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
    </>
  )
}

