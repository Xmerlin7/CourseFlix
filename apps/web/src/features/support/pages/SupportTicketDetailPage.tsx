import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { showToast } from '../../../shared/components/Toast'
import { useAuth } from '../../auth/hooks/useAuth'
import { addTicketMessage, updateTicketStatus } from '../api/support.api'
import { AttachmentCard } from '../components/AttachmentCard'
import { MessageBubble, type MessagePendingStatus } from '../components/MessageBubble'
import { MessageComposer } from '../components/MessageComposer'
import '../components/SupportChat.css'
import { SupportTicketDetailSkeleton } from '../components/SupportTicketDetailSkeleton'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import { TypingIndicator } from '../components/TypingIndicator'
import { useTicket } from '../hooks/useTicket'
import { SUPPORT_TICKET_CATEGORY_LABELS } from '../lib/support-status-labels'
import type { SupportMessage, SupportTicketStatus } from '../types/support.types'

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

interface PendingMessage {
  localId: string
  authorName: string
  authorAvatarUrl: string | null
  isStaffReply: boolean
  body: string
  createdAt: string
  status: MessagePendingStatus
}

interface RenderableMessage {
  key: string
  authorName: string
  authorAvatarUrl: string | null
  isStaffReply: boolean
  body: string
  createdAt: string
  pendingStatus?: MessagePendingStatus
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
  const [messageBody, setMessageBody] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [confirmedExtra, setConfirmedExtra] = useState<SupportMessage[]>([])
  const [pending, setPending] = useState<PendingMessage | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  const renderList: RenderableMessage[] = [
    ...(data?.messages ?? []).map((message) => ({
      key: message.id,
      authorName: message.authorName,
      authorAvatarUrl: message.authorAvatarUrl,
      isStaffReply: message.isStaffReply,
      body: message.body,
      createdAt: message.createdAt,
    })),
    ...confirmedExtra.map((message) => ({
      key: message.id,
      authorName: message.authorName,
      authorAvatarUrl: message.authorAvatarUrl,
      isStaffReply: message.isStaffReply,
      body: message.body,
      createdAt: message.createdAt,
    })),
    ...(pending
      ? [
          {
            key: pending.localId,
            authorName: pending.authorName,
            authorAvatarUrl: pending.authorAvatarUrl,
            isStaffReply: pending.isStaffReply,
            body: pending.body,
            createdAt: pending.createdAt,
            pendingStatus: pending.status,
          },
        ]
      : []),
  ]

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [renderList.length, pending?.status])

  if (isLoading) return <SupportTicketDetailSkeleton />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
    if (error.status === 404) return <NotFoundState />
    return <ErrorState onRetry={refetch} />
  }

  if (!data) return <NotFoundState />

  async function trySend(ticketIdValue: string, body: string) {
    try {
      const created = await addTicketMessage(ticketIdValue, body)
      setConfirmedExtra((current) => [...current, created])
      setPending(null)
    } catch {
      setPending((current) => (current ? { ...current, status: 'failed' } : current))
      showToast('تعذر إرسال الرد', 'error')
    }
  }

  function handleComposerSubmit() {
    const body = messageBody.trim()
    if (!body || pending || !ticketId) return
    setMessageBody('')
    setPending({
      localId: `pending-${Date.now()}`,
      authorName: user?.fullName ?? (isStaff ? 'فريق الدعم' : 'أنت'),
      authorAvatarUrl: user?.avatarUrl ?? null,
      isStaffReply: isStaff,
      body,
      createdAt: new Date().toISOString(),
      status: 'sending',
    })
    void trySend(ticketId, body)
  }

  function handleRetry() {
    if (!pending || !ticketId) return
    setPending({ ...pending, status: 'sending' })
    void trySend(ticketId, pending.body)
  }

  function handleDismissFailed() {
    setPending(null)
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

  const isClosed = data.status === 'closed'

  return (
    <div>
      <Link to={backPath} className="meta-link support-back-link">
        <span className="ms" aria-hidden="true">arrow_forward</span>
        العودة للدعم
      </Link>


      <div className="card support-ticket-header">
        <div className="support-ticket-header-top">
          <div>
            <span className="support-ticket-id">طلب دعم #{data.id.slice(0, 8)}</span>
            <h1 className="page-title" style={{ margin: '4px 0 10px', fontSize: 21 }}>
              {data.subject}
            </h1>
            <div className="support-ticket-chips">
              <span className="chip outline">
                <span className="ms" aria-hidden="true">
                  {CATEGORY_ICONS[data.category] ?? 'label'}
                </span>
                {SUPPORT_TICKET_CATEGORY_LABELS[data.category]}
              </span>
              {data.courseTitle && (
                <span className="chip outline">
                  <span className="ms" aria-hidden="true">school</span>
                  {data.courseTitle}
                </span>
              )}
              <span className="chip outline">
                <span className="ms" aria-hidden="true">schedule</span>
                {formatDate(data.createdAt)}
              </span>
              {isStaff && (
                <span className="chip outline">
                  <span className="ms" aria-hidden="true">person</span>
                  {data.studentName}
                </span>
              )}
            </div>
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

        {data.description && <p className="support-ticket-description">{data.description}</p>}

        {data.attachments.length > 0 && (
          <div className="support-ticket-attachments">
            {data.attachments.map((file) => (
              <AttachmentCard key={file.id} attachment={file} />
            ))}
          </div>
        )}
      </div>

      <div className="support-chat-panel">
        <div className="support-chat-messages" ref={messagesRef}>
          {renderList.length === 0 ? (
            <div className="support-chat-empty">
              <strong>أهلاً بيك 👋</strong>
              <p>اكتب رسالتك وهيساعدك فريق الدعم في حل المشكلة.</p>
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
                pendingStatus={message.pendingStatus}
                onRetry={message.pendingStatus === 'failed' ? handleRetry : undefined}
                onDismiss={message.pendingStatus === 'failed' ? handleDismissFailed : undefined}
              />
            ))
          )}

          {pending?.status === 'sending' && <TypingIndicator variant={isStaff ? 'student' : 'support'} />}
        </div>

        {isClosed ? (
          <div className="support-chat-closed-notice">
            <span className="ms" aria-hidden="true">lock</span>
            تم إغلاق هذا الطلب، ولا يمكن إرسال ردود جديدة.
          </div>
        ) : (
          <MessageComposer
            value={messageBody}
            onChange={setMessageBody}
            onSubmit={handleComposerSubmit}
            disabled={pending !== null}
            isSending={pending?.status === 'sending'}
          />
        )}
      </div>
    </div>
  )
}
