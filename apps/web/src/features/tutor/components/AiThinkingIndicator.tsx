export function AiThinkingIndicator() {
  return (
    <div
      className="ai-thinking-indicator"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="المساعد الذكي يحضّر الرد"
    >
      <span className="ai-thinking-sparkle ms fill" aria-hidden="true">
        auto_awesome
      </span>
      <span className="ai-thinking-lines" aria-hidden="true">
        <span className="ai-thinking-line" />
        <span className="ai-thinking-line" />
        <span className="ai-thinking-line" />
      </span>
    </div>
  )
}
