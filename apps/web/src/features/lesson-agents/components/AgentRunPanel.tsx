import { useState } from 'react'
import { showToast } from '../../../shared/components/Toast'
import { AGENT_RUN_STATUS } from '../../../shared/lib/status-labels'
import { useAgentRun } from '../hooks/useAgentRun'
import { AgentCrewStrip } from './AgentCrewStrip'
import { AgentFeed } from './AgentFeed'
import { AgentStepReview } from './AgentStepReview'

interface AgentRunPanelProps {
  runId: string
  onClose: () => void
}

/**
 * The teacher's window onto one agent run: who is on the job, what they
 * are saying, and what still needs a verdict.
 *
 * Nothing here is client state — the whole run lives in the database and
 * the crew keeps working whether or not this is open, so closing the
 * page and returning tomorrow shows exactly where they got to.
 */
export function AgentRunPanel({ runId, onClose }: AgentRunPanelProps) {
  const { data, isLoading, error, approve, reject, sendFeedback, publish, refetch } =
    useAgentRun(runId)
  const [isPublishing, setIsPublishing] = useState(false)

  if (isLoading) {
    return (
      <div className="card" style={{ marginTop: 18 }}>
        <p className="subtitle" style={{ marginBottom: 0 }}>
          جارٍ تحميل شغل الفريق...
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card" style={{ marginTop: 18, gap: 12 }}>
        <p role="alert" style={{ color: 'var(--error)', margin: 0 }}>
          تعذر تحميل تفاصيل التشغيلة
        </p>
        <div className="actions">
          <button type="button" className="btn tonal" onClick={refetch}>
            حاول تاني
          </button>
          <button type="button" className="btn text" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    )
  }

  const status = AGENT_RUN_STATUS[data.status]
  const isLive = data.status === 'queued' || data.status === 'running'
  const reviewSteps = data.steps.filter(
    (step) => step.reviewable && step.status === 'completed',
  )
  const failedSteps = data.steps.filter((step) => step.status === 'failed')

  async function handlePublish() {
    if (isPublishing) return
    setIsPublishing(true)
    try {
      await publish()
      showToast('اتنشر شغل الفريق للطلاب', 'success')
    } catch {
      showToast('تعذر النشر، راجع إن كل الوكلاء خدوا رأيك', 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="card" style={{ gap: 18, marginTop: 18 }}>
      <div className="agent-run-head">
        <div>
          <h3 style={{ margin: 0 }}>فريق الوكلاء — {data.lessonTitle}</h3>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            {isLive
              ? 'شغّالين دلوقتي. تقدر تقفل الصفحة عادي وترجع في أي وقت.'
              : 'الفريق خلّص شغله.'}
          </p>
        </div>
        <div className="actions" style={{ gap: 8 }}>
          {/* Every rewrite adds to this, so it's shown on the panel where
              the rewrite button is — not only on the billing page. */}
          <span className="chip outline" title="رصيد الذكاء الاصطناعي المستهلك في التشغيلة دي">
            <span className="ms sm">toll</span>
            {data.creditsCharged} كريدت
          </span>
          <span className={`chip ${status.chip}`}>
            <span className="ms sm">{status.icon}</span>
            {status.label}
          </span>
          <button type="button" className="btn text" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>

      <div>
        <div className="progress-label-row">
          <span className="progress-title">التقدّم الكلي</span>
          <span className="progress-value">{data.progress}%</span>
        </div>
        <span
          className="agent-run-progress"
          role="progressbar"
          aria-valuenow={data.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="التقدّم الكلي للفريق"
        >
          <span style={{ width: `${data.progress}%` }} />
        </span>
      </div>

      <AgentCrewStrip steps={data.steps} />

      {data.errorMessage && (
        <p role="alert" style={{ color: 'var(--error)', margin: 0, fontWeight: 700 }}>
          {data.errorMessage}
        </p>
      )}

      {failedSteps.length > 0 && (
        <div className="card" style={{ gap: 8, background: 'var(--error-container)' }}>
          {failedSteps.map((step) => (
            <p key={step.id} style={{ margin: 0, fontSize: 13.5 }}>
              <strong>{step.name}:</strong> {step.errorMessage ?? 'وقف من غير سبب واضح.'}
            </p>
          ))}
        </div>
      )}

      <div>
        <h4 style={{ marginTop: 0, marginBottom: 10 }}>اللي بيحصل</h4>
        <AgentFeed events={data.events} isLive={isLive} />
      </div>

      {reviewSteps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h4 style={{ margin: 0 }}>راجع شغلهم</h4>
          {reviewSteps.map((step) => (
            <AgentStepReview
              key={step.id}
              step={step}
              onApprove={() => approve(step.id)}
              onReject={() => reject(step.id)}
              onFeedback={(message) => sendFeedback(step.id, message)}
            />
          ))}
        </div>
      )}

      {data.status === 'pending_review' && (
        <div className="actions">
          <button
            type="button"
            className="btn"
            disabled={!data.canPublish || isPublishing}
            onClick={() => void handlePublish()}
          >
            <span className="ms">publish</span>
            {isPublishing ? 'جارٍ النشر...' : 'انشر شغل الفريق'}
          </button>
          {!data.canPublish && (
            <span className="meta">لسه في وكيل مستني رأيك قبل ما تنشر.</span>
          )}
        </div>
      )}
    </div>
  )
}
