import { useEffect, useRef } from 'react'
import type { LessonAgentEvent, LessonAgentEventType } from '../types/lesson-agents.types'

interface AgentFeedProps {
  events: LessonAgentEvent[]
  /** Only auto-scroll while the crew is actually producing new lines. */
  isLive: boolean
}

const EVENT_ICON: Record<LessonAgentEventType, string> = {
  run_started: 'rocket_launch',
  agent_started: 'play_arrow',
  agent_progress: 'more_horiz',
  handoff: 'sync_alt',
  agent_completed: 'check',
  agent_failed: 'error',
  agent_skipped: 'do_not_disturb_on',
  review_requested: 'rate_review',
  teacher_feedback: 'edit_note',
  teacher_approved: 'thumb_up',
  teacher_rejected: 'thumb_down',
  run_completed: 'celebration',
  run_failed: 'report',
}

const EVENT_CLASS: Partial<Record<LessonAgentEventType, string>> = {
  handoff: ' is-handoff',
  agent_completed: ' is-done',
  run_completed: ' is-done',
  agent_failed: ' is-failed',
  run_failed: ' is-failed',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * The running commentary — every line an agent wrote about its own work,
 * oldest first, with handoffs called out.
 *
 * `aria-live="polite"` because this genuinely updates on its own while
 * the teacher is reading it; without it a screen-reader user would sit
 * on a silent, static page while five agents worked.
 */
export function AgentFeed({ events, isLive }: AgentFeedProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isLive) return
    // Guarded rather than called outright: `scrollIntoView` is absent in
    // jsdom and in older embedded browsers, and this runs inside an
    // effect where a throw is unhandled — losing auto-scroll is a fine
    // degradation, taking the panel down with it is not.
    const bottom = bottomRef.current
    if (typeof bottom?.scrollIntoView !== 'function') return
    bottom.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [events.length, isLive])

  if (events.length === 0) {
    return <p className="subtitle">لسه الفريق ما قالش حاجة...</p>
  }

  return (
    <div className="agent-feed" aria-live="polite" aria-label="سجل شغل الوكلاء">
      {events.map((event) => (
        <div key={event.id} className={`agent-feed-row${EVENT_CLASS[event.type] ?? ''}`}>
          <span className="agent-feed-dot" aria-hidden="true">
            <span className="ms sm">{EVENT_ICON[event.type] ?? 'circle'}</span>
          </span>
          <span>{event.message}</span>
          <time className="agent-feed-time" dateTime={event.createdAt}>
            {formatTime(event.createdAt)}
          </time>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
