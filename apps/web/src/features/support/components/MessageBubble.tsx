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
        <div className="chat-msg-group-label">
          <span className="chat-msg-avatar" aria-hidden="true">
            <span className="ms">{isStaffReply ? 'support_agent' : 'person'}</span>
          </span>
          <span className="chat-msg-author-name">{authorName}</span>
          <span className={`chat-role-tag ${isStaffReply ? 'support-tag' : 'student-tag'}`}>
            {isStaffReply ? 'فريق الدعم' : 'الطالب'}
          </span>
        </div>
      )}
      <div className={`chat-msg from-${variant}${pendingStatus === 'failed' ? ' is-failed' : ''}`}>
        <p>{body}</p>
        <div className="chat-msg-meta">
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
        </div>
        {pendingStatus === 'failed' && (
          <div className="chat-msg-retry">
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
          </div>
        )}
      </div>
    </div>
  )
}

