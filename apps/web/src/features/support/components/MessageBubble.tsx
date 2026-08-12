export type MessagePendingStatus = 'sending' | 'failed'

interface MessageBubbleProps {
  authorName: string
  isStaffReply: boolean
  body: string
  createdAt: string
  showHeader: boolean
  pendingStatus?: MessagePendingStatus
  onRetry?: () => void
  onDismiss?: () => void
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { timeStyle: 'short' })
}

export function MessageBubble({
  authorName,
  isStaffReply,
  body,
  createdAt,
  showHeader,
  pendingStatus,
  onRetry,
  onDismiss,
}: MessageBubbleProps) {
  const variant = isStaffReply ? 'support' : 'student'

  return (
    <div className={`chat-msg-group from-${variant}${showHeader ? ' is-new-group' : ''}`}>
      {showHeader && (
        <span className="chat-msg-group-label">
          {authorName}
          {isStaffReply && <span className="support-tag">فريق الدعم</span>}
        </span>
      )}
      <div className={`chat-msg from-${variant}${pendingStatus === 'failed' ? ' is-failed' : ''}`}>
        <p>{body}</p>
        <span className="chat-msg-time">
          {pendingStatus === 'sending' ? (
            <span className="chat-msg-status">
              <span className="ms spin" aria-hidden="true">
                progress_activity
              </span>
              جارٍ الإرسال
            </span>
          ) : pendingStatus === 'failed' ? (
            'تعذر الإرسال'
          ) : (
            formatTime(createdAt)
          )}
        </span>
        {pendingStatus === 'failed' && (
          <span className="chat-msg-retry">
            {onRetry && (
              <button type="button" className="chat-msg-retry-btn" onClick={onRetry}>
                إعادة المحاولة
              </button>
            )}
            {onDismiss && (
              <button type="button" className="chat-msg-dismiss-btn" onClick={onDismiss}>
                حذف
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
