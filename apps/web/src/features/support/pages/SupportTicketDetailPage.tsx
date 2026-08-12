import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { showToast } from '../../../shared/components/Toast'
import { useAuth } from '../../auth/hooks/useAuth'
import { addTicketMessage, updateTicketStatus } from '../api/support.api'
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

export function SupportTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'assistant'
  const backPath = isStaff ? (user?.role === 'admin' ? '/admin/support' : '/teacher/support') : '/student/support'

  const { data, isLoading, error, refetch } = useTicket(ticketId ?? '')
  const [messageBody, setMessageBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  if (isLoading) return <SupportTicketDetailSkeleton />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
    if (error.status === 404) return <NotFoundState />
    return <ErrorState onRetry={refetch} />
  }

  if (!data) return <NotFoundState />

  async function handleSendMessage(event: React.FormEvent) {
    event.preventDefault()
    if (!messageBody.trim() || !ticketId) return
    setIsSending(true)
    try {
      await addTicketMessage(ticketId, messageBody.trim())
      setMessageBody('')
      refetch()
    } catch {
      showToast('تعذر إرسال الرد', 'error')
    } finally {
      setIsSending(false)
    }
  }

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
    <div>
      <Link to={backPath} className="meta-link">
        <span className="ms">arrow_back</span>
        الرجوع لطلبات الدعم
      </Link>

      <div className="card" style={{ gap: 10, marginTop: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <span className="meta">طلب دعم #{data.id.slice(0, 8)}</span>
            <h1 className="page-title" style={{ margin: '4px 0' }}>
              {data.subject}
            </h1>
          </div>
          {isStaff ? (
            <div className="tf" style={{ marginBottom: 0, minWidth: 180 }}>
              <label htmlFor="ticket-status">الحالة</label>
              <select
                id="ticket-status"
                value={data.status}
                onChange={(event) => handleStatusChange(event.target.value as SupportTicketStatus)}
                disabled={isUpdatingStatus}
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

        <span className="meta">
          {SUPPORT_TICKET_CATEGORY_LABELS[data.category]}
          {data.courseTitle ? ` · ${data.courseTitle}` : ''} · {formatDate(data.createdAt)}
        </span>
        {isStaff && <span className="meta">الطالب: {data.studentName}</span>}

        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{data.description}</p>

        {data.attachments.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.attachments.map((file) => (
              <span key={file.id} className="chip outline">
                <span className="ms" style={{ fontSize: 14 }}>
                  attach_file
                </span>
                {file.fileName}
              </span>
            ))}
          </div>
        )}
      </div>

      <h2>المحادثة</h2>

      {data.messages.length === 0 ? (
        <p className="subtitle">لا يوجد ردود بعد.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {data.messages.map((message) => (
            <div
              key={message.id}
              className={`card${message.isStaffReply ? ' announcement-pinned' : ''}`}
              style={{ gap: 4 }}
            >
              <span className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {message.authorName}
                {message.isStaffReply && (
                  <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                    فريق الدعم
                  </span>
                )}
                {' · '}
                {formatDate(message.createdAt)}
              </span>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.body}</p>
            </div>
          ))}
        </div>
      )}

      {data.status !== 'closed' && (
        <form onSubmit={handleSendMessage} className="card" style={{ gap: 10 }}>
          <div className="tf" style={{ marginBottom: 0 }}>
            <label htmlFor="ticket-reply">اكتب ردًا</label>
            <textarea
              id="ticket-reply"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              rows={3}
              maxLength={10000}
              disabled={isSending}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn primary" disabled={isSending}>
              {isSending && <span className="ms spin">progress_activity</span>}
              {isSending ? 'جارٍ الإرسال...' : 'إرسال'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
