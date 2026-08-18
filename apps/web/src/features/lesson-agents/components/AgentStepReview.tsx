import { useState, type FormEvent } from 'react'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { AGENT_REVIEW_STATUS } from '../../../shared/lib/status-labels'
import { handleChatInputKeyDown } from '../../../shared/utils/chatInput'
import type { LessonAgentStep } from '../types/lesson-agents.types'

interface AgentStepReviewProps {
  step: LessonAgentStep
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
  onFeedback: (message: string) => Promise<void>
}

/**
 * One reviewable agent's output plus the three things the teacher can do
 * with it: take it, drop it, or send it back with a note.
 *
 * The note path is the interesting one — it re-runs only this agent, so
 * commenting on a handout never re-transcribes the video.
 */
export function AgentStepReview({
  step,
  onApprove,
  onReject,
  onFeedback,
}: AgentStepReviewProps) {
  const [message, setMessage] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const isDecided = step.reviewStatus === 'approved' || step.reviewStatus === 'rejected'
  const reviewMeta =
    step.reviewStatus === 'not_required' ? null : AGENT_REVIEW_STATUS[step.reviewStatus]

  async function run(action: () => Promise<void>, failureMessage: string) {
    if (isBusy) return
    setIsBusy(true)
    try {
      await action()
    } catch {
      showToast(failureMessage, 'error')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleFeedback(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    await run(async () => {
      await onFeedback(trimmed)
      setMessage('')
      showToast('بعتنا ملاحظتك، الوكيل بيعيد شغله دلوقتي', 'success')
    }, 'تعذر إرسال الملاحظة، حاول مرة أخرى')
  }

  return (
    <div className="agent-review-card">
      <div className="section-head" style={{ marginBottom: 0 }}>
        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ms">{step.icon}</span>
          {step.name}
        </h4>
        {reviewMeta && (
          <span className={`chip ${reviewMeta.chip}`}>
            <span className="ms sm">{reviewMeta.icon}</span>
            {reviewMeta.label}
          </span>
        )}
      </div>

      {step.headline && <p style={{ margin: 0, fontWeight: 600 }}>{step.headline}</p>}

      {step.agentKey === 'handout' && step.output && (
        <>
          {step.output.pageTitles && step.output.pageTitles.length > 0 && (
            <ol style={{ margin: 0, paddingInlineStart: 20, fontSize: 13.5, lineHeight: 2 }}>
              {step.output.pageTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ol>
          )}
          {step.output.handoutPreview && (
            <div className="agent-review-preview">{step.output.handoutPreview}</div>
          )}
        </>
      )}

      {step.agentKey === 'quizmaster' && step.output?.questions && (
        <div className="quiz-question-editor">
          {step.output.questions.map((question, index) => (
            <div key={`${question.text}-${index}`} className="quiz-question-card">
              <span className="s">
                سؤال {index + 1} — {question.type === 'mcq' ? 'اختيار من متعدد' : 'صح أو خطأ'}
              </span>
              <p style={{ fontWeight: 700 }}>{question.text}</p>
              <ul>
                {question.options.map((option) => (
                  <li
                    key={option}
                    style={{
                      fontWeight: option === question.correctAnswer ? 800 : 400,
                      color:
                        option === question.correctAnswer
                          ? 'var(--on-success-container)'
                          : undefined,
                    }}
                  >
                    {option === question.correctAnswer ? '✓ ' : ''}
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {step.feedback.length > 0 && (
        <div>
          <p className="meta" style={{ marginBottom: 4 }}>ملاحظاتك السابقة:</p>
          <ul style={{ margin: 0, paddingInlineStart: 20, fontSize: 13, lineHeight: 1.9 }}>
            {step.feedback.map((entry) => (
              <li key={entry.id}>{entry.message}</li>
            ))}
          </ul>
        </div>
      )}

      {step.reviewStatus === 'pending' && (
        <>
          <div className="actions">
            <button
              type="button"
              className="btn"
              disabled={isBusy}
              onClick={() =>
                void run(onApprove, 'تعذر قبول الشغل، حاول مرة أخرى')
              }
            >
              <span className="ms">check</span>
              وافق
            </button>
            <button
              type="button"
              className="btn tonal"
              disabled={isBusy}
              onClick={() => setShowRejectModal(true)}
              style={{ color: 'var(--error)' }}
            >
              <span className="ms">close</span>
              ارفض
            </button>
          </div>

          <form onSubmit={(event) => void handleFeedback(event)} className="tf">
            <label htmlFor={`agent-feedback-${step.id}`}>
              أو اكتب ملاحظة و{step.name} هيعيد شغله عليها
            </label>
            <textarea
              id={`agent-feedback-${step.id}`}
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) =>
                handleChatInputKeyDown(
                  event,
                  () => void handleFeedback(),
                  isBusy || !message.trim(),
                )
              }
              placeholder={
                step.agentKey === 'handout'
                  ? 'مثال: الشرح مختصر أوي، وسّع في الجزء بتاع الأمثلة'
                  : 'مثال: الأسئلة سهلة، وركّز على الجزء الأخير من الدرس'
              }
            />
            <button type="submit" className="btn tonal" disabled={isBusy || !message.trim()}>
              <span className="ms">refresh</span>
              اعمله تاني بالملاحظة دي
            </button>
          </form>
        </>
      )}

      {isDecided && (
        <p className="meta" style={{ margin: 0 }}>
          {step.reviewStatus === 'approved'
            ? 'هيتنشر للطلاب أول ما تضغط "انشر شغل الفريق".'
            : 'اترفض واتشال، مش هيوصل لأي طالب.'}
        </p>
      )}

      <ConfirmModal
        open={showRejectModal}
        title={`رفض شغل ${step.name}`}
        message="هيتشال نهائيًا ومش هينفع ترجعه. لو عايز تعديل بس، اقفل ده واكتب ملاحظة بدل الرفض."
        confirmLabel="ارفض وشيل"
        cancelLabel="إلغاء"
        isLoading={isBusy}
        variant="danger"
        onConfirm={() =>
          void run(async () => {
            await onReject()
            setShowRejectModal(false)
            showToast('اترفض واتشال', 'success')
          }, 'تعذر الرفض، حاول مرة أخرى')
        }
        onCancel={() => setShowRejectModal(false)}
      />
    </div>
  )
}
