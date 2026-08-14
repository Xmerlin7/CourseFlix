import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AttachmentPreviewList } from '../../../shared/components/AttachmentPreview'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { showToast } from '../../../shared/components/Toast'
import { useAuth } from '../../auth/hooks/useAuth'
import { emitUnreadCountChanged } from '../../notifications/utils/notificationEvents'
import { updateTicketStatus } from '../api/support.api'
import { MessageBubble } from '../components/MessageBubble'
import '../components/SupportChat.css'
import { SupportTicketDetailSkeleton } from '../components/SupportTicketDetailSkeleton'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import { useTicket } from '../hooks/useTicket'
import { SUPPORT_TICKET_CATEGORY_LABELS } from '../lib/support-status-labels'
import type { SupportTicketStatus } from '../types/support.types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_OPTIONS: { value: SupportTicketStatus; label: string }[] = [
  { value: 'open', label: 'مفتوح' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'waiting_for_student', label: 'بانتظار الطالب' },
  { value: 'resolved', label: 'تم الحل' },
  { value: 'closed', label: 'مغلق' },
]

const CATEGORY_ICONS: Record<string, string> = {
  technical: 'build',
  course: 'school',
  payment: 'payments',
  account: 'account_circle',
  other: 'more_horiz',
}

interface RenderableMessage {
  key: string
  authorName: string
  authorAvatarUrl: string | null
  isStaffReply: boolean
  body: string
  createdAt: string
}

function shouldShowHeader(list: RenderableMessage[], index: number): boolean {
  if (index === 0) return true
  const prev = list[index - 1]
  const current = list[index]
  return prev.authorName !== current.authorName || prev.isStaffReply !== current.isStaffReply
}

export function SupportTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'assistant'
  const backPath = isStaff ? (user?.role === 'admin' ? '/admin/support' : '/teacher/support') : '/student/support'

  const { data, isLoading, error, refetch } = useTicket(ticketId ?? '')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (data) {
      emitUnreadCountChanged()
    }
  }, [data?.id])

  const renderList: RenderableMessage[] = (data?.messages ?? []).map((message) => ({
    key: message.id,
    authorName: message.authorName,
    authorAvatarUrl: message.authorAvatarUrl,
    isStaffReply: message.isStaffReply,
    body: message.body,
    createdAt: message.createdAt,
  }))

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [renderList.length])

  if (isLoading) return <SupportTicketDetailSkeleton />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
    if (error.status === 404) return <NotFoundState />
    return <ErrorState onRetry={refetch} />
  }

  if (!data) return <NotFoundState />

  async function handleStatusChange(status: SupportTicketStatus) {
    if (!ticketId) return
    setIsUpdatingStatus(true)
    try {
      await updateTicketStatus(ticketId, status)
      showToast('تم تحديث حالة الطلب', 'success')
      refetch()
    } catch {
      showToast('تعذر تحديث الحالة', 'error')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <Link to={backPath} className="meta-link support-back-link">
        <span className="ms" aria-hidden="true">arrow_forward</span>
        العودة للدعم
      </Link>

      <div className="card support-ticket-header">
        <div className="support-ticket-header-top">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 260 }}>
            <div className="support-ticket-chips">
              <span className="support-ticket-id">طلب دعم #{data.id.slice(0, 8)}</span>
              <span className="chip outline">
                <span className="ms sm" aria-hidden="true">
                  {CATEGORY_ICONS[data.category] ?? 'label'}
                </span>
                {SUPPORT_TICKET_CATEGORY_LABELS[data.category]}
              </span>
              {data.courseTitle && (
                <span className="chip outline">
                  <span className="ms sm" aria-hidden="true">school</span>
                  {data.courseTitle}
                </span>
              )}
              <span className="chip outline">
                <span className="ms sm" aria-hidden="true">schedule</span>
                {formatDate(data.createdAt)}
              </span>
              {isStaff && (
                <span className="chip outline">
                  <span className="ms sm" aria-hidden="true">person</span>
                  {data.studentName}
                </span>
              )}
            </div>

            <h1 className="page-title" style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700 }}>
              {data.subject}
            </h1>
          </div>

          {isStaff ? (
            <div className="tf" style={{ marginBottom: 0, minWidth: 160 }}>
              <label htmlFor="ticket-status" style={{ fontSize: 12 }}>الحالة</label>
              <select
                id="ticket-status"
                value={data.status}
                onChange={(event) => handleStatusChange(event.target.value as SupportTicketStatus)}
                disabled={isUpdatingStatus}
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <TicketStatusBadge status={data.status} />
          )}
        </div>

        {data.description && <p className="support-ticket-description">{data.description}</p>}

        {data.attachments.length > 0 && (
          <div className="support-ticket-attachments" style={{ marginTop: 6 }}>
            <AttachmentPreviewList attachments={data.attachments} layout="horizontal" />
          </div>
        )}
      </div>

      <div className="support-chat-panel">
        <div className="support-chat-messages" ref={messagesRef}>
          {renderList.length === 0 ? (
            <div className="support-chat-empty">
              <span style={{ fontSize: 26 }} aria-hidden="true">👋</span>
              <strong style={{ fontSize: 15, marginTop: 4 }}>أهلاً بيك</strong>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--on-surface-variant)' }}>
                تم استلام طلب الدعم. هنراجع طلبك ونرد عليك هنا.
              </p>
            </div>
          ) : (
            renderList.map((message, index) => (
              <MessageBubble
                key={message.key}
                authorName={message.authorName}
                authorAvatarUrl={message.authorAvatarUrl}
                isStaffReply={message.isStaffReply}
                body={message.body}
                createdAt={message.createdAt}
                showHeader={shouldShowHeader(renderList, index)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
