import { AiThinkingIndicator } from '../../tutor/components/AiThinkingIndicator'

/**
 * TeacherAnalyticsPage has no page-level loading gate — the title, the
 * question form and example chips render immediately. This response-sized
 * surface uses the same CourseFlex AI composing state as every tutor chat.
 */
export function TeacherAnalyticsResultSkeleton() {
  return (
    <div
      className="card section"
      style={{ maxWidth: 760, background: 'var(--surface-container-low)' }}
      data-testid="analytics-result-skeleton"
    >
      <AiThinkingIndicator />
    </div>
  )
}
