interface TypingIndicatorProps {
  variant: 'student' | 'support'
}

export function TypingIndicator({ variant }: TypingIndicatorProps) {
  const isSupport = variant === 'support'
  const authorName = isSupport ? 'فريق الدعم' : 'الطالب'

  return (
    <div className={`chat-msg-group from-${variant} is-typing-group`}>
      <div className="chat-msg-group-label">
        <span className="chat-msg-avatar" aria-hidden="true">
          <span className="ms">{isSupport ? 'support_agent' : 'person'}</span>
        </span>
        <span className="chat-msg-author-name">{authorName}</span>
        <span className={`chat-role-tag ${isSupport ? 'support-tag' : 'student-tag'}`}>
          {isSupport ? 'فريق الدعم' : 'الطالب'}
        </span>
      </div>
      <div
        className={`chat-msg chat-typing from-${variant}`}
        role="status"
        aria-label={isSupport ? 'فريق الدعم يكتب الآن' : 'الطالب يكتب الآن'}
      >
        <span className="chat-typing-dots">
          <span className="chat-typing-dot" aria-hidden="true" />
          <span className="chat-typing-dot" aria-hidden="true" />
          <span className="chat-typing-dot" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

