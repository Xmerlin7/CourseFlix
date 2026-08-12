interface TypingIndicatorProps {
  variant: 'student' | 'support'
}

export function TypingIndicator({ variant }: TypingIndicatorProps) {
  return (
    <div
      className={`chat-msg chat-typing from-${variant}`}
      role="status"
      aria-label={variant === 'support' ? 'فريق الدعم يكتب الآن' : 'الطالب يكتب الآن'}
    >
      <span className="chat-typing-dot" aria-hidden="true" />
      <span className="chat-typing-dot" aria-hidden="true" />
      <span className="chat-typing-dot" aria-hidden="true" />
    </div>
  )
}
