export type MessagePendingStatus = 'sending' | 'failed'

interface MessageBubbleProps {
  authorName: string
  authorAvatarUrl?: string | null
  isStaffReply: boolean
  body: string
  createdAt: string
  showHeader: boolean
  pendingStatus?: MessagePendingStatus
  isUnread?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  staffLabel?: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { timeStyle: 'short' })
}

export function MessageBubble({
  authorName,
  authorAvatarUrl,
  isStaffReply,
  body,
  createdAt,
  showHeader,
  pendingStatus,
  isUnread,
  onRetry,
  onDismiss,
  staffLabel = 'فريق الدعم',
}: MessageBubbleProps) {
  const variant = isStaffReply ? 'support' : 'student'

  return (
    <div className={`chat-msg-group from-${variant}${showHeader ? ' is-new-group' : ''}`}>
      {showHeader && (
        <div className="chat-msg-group-label">
          {isUnread && <span className="unread-dot" aria-label="غير مقروء" />}
          <span className="chat-msg-avatar" aria-hidden="true">
            {authorAvatarUrl ? (
              <img src={authorAvatarUrl} alt="" />
            ) : (
              <span className="ms">{isStaffReply ? 'support_agent' : 'person'}</span>
            )}
          </span>
          <span className="chat-msg-author-name">{authorName}</span>
          <span className={`chat-role-tag ${isStaffReply ? 'support-tag' : 'student-tag'}`}>
            {isStaffReply ? staffLabel : 'الطالب'}
          </span>
        </div>
      )}
      <div
        className={`chat-msg from-${variant}${pendingStatus === 'failed' ? ' is-failed' : ''}${isUnread ? ' is-unread' : ''}`}
      >
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
