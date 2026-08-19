import { AGENT_STEP_STATUS } from '../../../shared/lib/status-labels'
import type { LessonAgentStep } from '../types/lesson-agents.types'

interface AgentCrewStripProps {
  steps: LessonAgentStep[]
}

const STATUS_CLASS: Record<LessonAgentStep['status'], string> = {
  pending: '',
  running: ' is-running',
  completed: ' is-done',
  failed: ' is-failed',
  skipped: ' is-skipped',
}

/**
 * The crew line-up: every agent in the run, in the order they hand off,
 * with an arrow between each pair.
 *
 * The arrow *before* the currently running agent is the live one — that
 * is the baton actually in motion, since the agent it points at is the
 * one working right now.
 */
export function AgentCrewStrip({ steps }: AgentCrewStripProps) {
  return (
    <div className="agent-crew" role="list" aria-label="فريق الوكلاء">
      {steps.map((step, index) => {
        const status = AGENT_STEP_STATUS[step.status]
        const previous = steps[index - 1]
        const isLiveArrow = step.status === 'running' && previous?.status === 'completed'

        return (
          <div key={step.id} style={{ display: 'contents' }}>
            {index > 0 && (
              <span
                className={`ms agent-crew-arrow${isLiveArrow ? ' is-live' : ''}`}
                aria-hidden="true"
              >
                arrow_back
              </span>
            )}

            <div
              role="listitem"
              className={`agent-crew-card${STATUS_CLASS[step.status]}`}
              aria-label={`${step.name} — ${status.label}`}
            >
              <span className="agent-crew-icon">
                <span className="ms">{step.icon}</span>
                {step.name}
              </span>
              <span className="agent-crew-role">{step.role}</span>

              <span className={`chip ${status.chip}`} style={{ width: 'fit-content' }}>
                <span className="ms sm">{status.icon}</span>
                {status.label}
              </span>

              {step.status !== 'skipped' && (
                <span
                  className="agent-crew-bar"
                  role="progressbar"
                  aria-valuenow={step.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`تقدّم ${step.name}`}
                >
                  <span style={{ width: `${step.progress}%` }} />
                </span>
              )}

              {step.attempt > 1 && (
                <span className="agent-crew-role">المحاولة رقم {step.attempt}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
