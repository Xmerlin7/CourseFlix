import { type FormEvent, useMemo, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { EXAM_GENERATION_STATUS } from '../../../shared/lib/status-labels'
import { showToast } from '../../../shared/components/Toast'
import { handleChatInputKeyDown } from '../../../shared/utils/chatInput'
import type { CourseDetail } from '../../courses/types/course.types'
import { useExamGenerationRequest } from '../hooks/useExamGenerationRequest'
import { useExamGenerationRequests } from '../hooks/useExamGenerationRequests'
import { Pagination } from '../../../shared/components/Pagination'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import type {
  ExamDifficulty,
  ExamGenerationRequestSummary,
  ExamScopeType,
} from '../types/exam-generation.types'

interface ExamGenerationManagerProps {
  course: CourseDetail
}

interface RequestForm {
  scopeType: ExamScopeType
  sectionId: string
  lessonId: string
  difficulty: ExamDifficulty
  mcqCount: number
  trueFalseCount: number
  dueAt: string
}

const DIFFICULTY_LABELS: Record<ExamDifficulty, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

function defaultDueAt(): string {
  const inOneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  inOneWeek.setSeconds(0, 0)
  // datetime-local expects "YYYY-MM-DDTHH:mm" in local time.
  const offsetMs = inOneWeek.getTimezoneOffset() * 60 * 1000
  return new Date(inOneWeek.getTime() - offsetMs).toISOString().slice(0, 16)
}

function emptyForm(): RequestForm {
  return {
    scopeType: 'course',
    sectionId: '',
    lessonId: '',
    difficulty: 'medium',
    mcqCount: 5,
    trueFalseCount: 3,
    dueAt: defaultDueAt(),
  }
}

function scopeLabel(request: ExamGenerationRequestSummary, course: CourseDetail): string {
  if (request.scopeType === 'course') return 'الدورة كاملة'
  if (request.scopeType === 'section') {
    const section = course.sections.find((s) => s.id === request.scopeId)
    return section ? `قسم: ${section.title}` : 'قسم محذوف'
  }
  const lesson = course.sections.flatMap((s) => s.lessons).find((l) => l.id === request.scopeId)
  return lesson ? `درس: ${lesson.title}` : 'درس محذوف'
}

const PAGE_SIZE = 10

/** Requests are ordered by date, not searched by name. */
const NO_CLIENT_FILTER = () => ''

export function ExamGenerationManager({ course }: ExamGenerationManagerProps) {
  const requests = useExamGenerationRequests(course.id)
  const requestList = usePaginatedList(requests.data, NO_CLIENT_FILTER, PAGE_SIZE)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<RequestForm>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const lessons = useMemo(
    () =>
      course.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          sectionTitle: section.title,
        })),
      ),
    [course.sections],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (form.scopeType === 'section' && !form.sectionId) {
      setFormError('اختر القسم')
      return
    }
    if (form.scopeType === 'lesson' && !form.lessonId) {
      setFormError('اختر الدرس')
      return
    }
    if (form.mcqCount <= 0 && form.trueFalseCount <= 0) {
      setFormError('حدد عدد أسئلة أكبر من صفر لنوع واحد على الأقل')
      return
    }
    const dueAt = new Date(form.dueAt)
    if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() <= Date.now()) {
      setFormError('الديدلاين يجب أن يكون تاريخًا في المستقبل')
      return
    }

    setIsSubmitting(true)
    try {
      await requests.create({
        courseId: course.id,
        scopeType: form.scopeType,
        scopeId:
          form.scopeType === 'section'
            ? form.sectionId
            : form.scopeType === 'lesson'
              ? form.lessonId
              : undefined,
        difficulty: form.difficulty,
        questionSpec: [
          ...(form.mcqCount > 0 ? [{ type: 'mcq' as const, count: form.mcqCount }] : []),
          ...(form.trueFalseCount > 0
            ? [{ type: 'true_false' as const, count: form.trueFalseCount }]
            : []),
        ],
        dueAt: dueAt.toISOString(),
      })
      setIsFormOpen(false)
      setForm(emptyForm())
    } catch {
      setFormError('تعذر إرسال الطلب، حاول مرة أخرى')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>امتحان بالذكاء الاصطناعي</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            اطلب من الذكاء الاصطناعي إنشاء اختبار من محتوى درس أو قسم أو الدورة كاملة
          </p>
        </div>
        <button type="button" className="btn" onClick={() => setIsFormOpen((open) => !open)}>
          <span className="ms">auto_awesome</span>
          طلب اختبار جديد
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={(event) => void handleSubmit(event)} className="card" style={{ gap: 18 }}>
          {formError && (
            <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 700 }}>
              {formError}
            </p>
          )}

          <div className="grid-2">
            <div className="tf">
              <label htmlFor="exam-scope">نطاق الاختبار</label>
              <select
                id="exam-scope"
                value={form.scopeType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scopeType: event.target.value as ExamScopeType,
                    sectionId: '',
                    lessonId: '',
                  }))
                }
              >
                <option value="course">الدورة كاملة</option>
                <option value="section">قسم معين</option>
                <option value="lesson">درس معين</option>
              </select>
            </div>

            {form.scopeType === 'section' && (
              <div className="tf">
                <label htmlFor="exam-section">القسم</label>
                <select
                  id="exam-section"
                  value={form.sectionId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sectionId: event.target.value }))
                  }
                >
                  <option value="">اختر القسم</option>
                  {course.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.scopeType === 'lesson' && (
              <div className="tf">
                <label htmlFor="exam-lesson">الدرس</label>
                <select
                  id="exam-lesson"
                  value={form.lessonId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, lessonId: event.target.value }))
                  }
                >
                  <option value="">اختر الدرس</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.sectionTitle} - {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="tf">
              <label htmlFor="exam-difficulty">مستوى الصعوبة</label>
              <select
                id="exam-difficulty"
                value={form.difficulty}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    difficulty: event.target.value as ExamDifficulty,
                  }))
                }
              >
                {(Object.keys(DIFFICULTY_LABELS) as ExamDifficulty[]).map((value) => (
                  <option key={value} value={value}>
                    {DIFFICULTY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="tf">
              <label htmlFor="exam-due-at">الديدلاين</label>
              <input
                id="exam-due-at"
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueAt: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="tf">
              <label htmlFor="exam-mcq-count">عدد أسئلة الاختيار من متعدد</label>
              <input
                id="exam-mcq-count"
                type="number"
                min={0}
                max={30}
                value={form.mcqCount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mcqCount: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="tf">
              <label htmlFor="exam-tf-count">عدد أسئلة صح أو خطأ</label>
              <input
                id="exam-tf-count"
                type="number"
                min={0}
                max={30}
                value={form.trueFalseCount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    trueFalseCount: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn" disabled={isSubmitting}>
              <span className="ms">send</span>
              {isSubmitting ? 'جارٍ الإرسال...' : 'أرسل للذكاء الاصطناعي'}
            </button>
          </div>
        </form>
      )}

      {requests.isLoading ? (
        <p className="subtitle">جارٍ تحميل الطلبات...</p>
      ) : requests.data.length === 0 ? (
        <p className="subtitle">لسه مفيش طلبات اختبار بالذكاء الاصطناعي</p>
      ) : (
        <div className="list">
          {requestList.pageItems.map((request) => {
            const status = EXAM_GENERATION_STATUS[request.status]
            return (
              <button
                type="button"
                key={request.id}
                className="list-item hoverable"
                style={{ width: '100%', textAlign: 'start', border: 'none' }}
                onClick={() => setSelectedRequestId(request.id)}
              >
                <span className={`lead ${status.chip}`}>
                  <span className="ms">{status.icon}</span>
                </span>
                <span className="body">
                  <span className="t">{scopeLabel(request, course)}</span>
                  <span className="s">
                    {DIFFICULTY_LABELS[request.difficulty]} · محاولة {request.attemptNumber} ·
                    ديدلاين {new Date(request.dueAt).toLocaleDateString('ar-EG')}
                  </span>
                </span>
                <span className="end">
                  <span className={`chip ${status.chip}`}>
                    <span className="ms">{status.icon}</span>
                    {status.label}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {requestList.hasPages && (
        <Pagination
          page={requestList.page}
          totalPages={requestList.totalPages}
          onPageChange={requestList.setPage}
          matchCount={requestList.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="طلب"
        />
      )}

      {selectedRequestId && (
        <ExamGenerationReviewPanel
          requestId={selectedRequestId}
          onClose={() => {
            setSelectedRequestId(null)
            requests.refetch()
          }}
        />
      )}
    </section>
  )
}

function ExamGenerationReviewPanel({
  requestId,
  onClose,
}: {
  requestId: string
  onClose: () => void
}) {
  const { data, isLoading, error, accept, reject, sendFeedback } =
    useExamGenerationRequest(requestId)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleAccept() {
    setIsBusy(true)
    setActionError(null)
    try {
      await accept()
    } catch (err) {
      setActionError(
        err instanceof ApiError ? 'تعذر القبول، حاول مرة أخرى' : 'حدث خطأ غير متوقع',
      )
    } finally {
      setIsBusy(false)
    }
  }

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  async function handleConfirmReject() {
    if (isRejecting) return
    setIsRejecting(true)
    setIsBusy(true)
    setActionError(null)
    try {
      await reject()
      setShowRejectModal(false)
      showToast('تم رفض المسودة بنجاح', 'success')
      onClose()
    } catch {
      setShowRejectModal(false)
      showToast('حدث خطأ أثناء رفض المسودة. حاول مرة أخرى.', 'error')
      setActionError('تعذر الرفض، حاول مرة أخرى')
    } finally {
      setIsRejecting(false)
      setIsBusy(false)
    }
  }

  async function handleFeedback(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault()
    if (!feedbackMessage.trim() || isBusy) return

    setIsBusy(true)
    setActionError(null)
    try {
      await sendFeedback(feedbackMessage.trim())
      setFeedbackMessage('')
    } catch {
      setActionError('تعذر إرسال الملاحظة، حاول مرة أخرى')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="card" style={{ gap: 18, marginTop: 18 }}>
      <div className="section-head" style={{ marginBottom: 0 }}>
        <h3>مراجعة الاختبار المولّد</h3>
        <button type="button" className="btn text" onClick={onClose}>
          إغلاق
        </button>
      </div>

      {isLoading && <p className="subtitle">جارٍ التحميل...</p>}
      {error && <p role="alert" style={{ color: 'var(--error)' }}>تعذر تحميل الطلب</p>}
      {actionError && (
        <p role="alert" style={{ color: 'var(--error)', fontWeight: 700 }}>
          {actionError}
        </p>
      )}

      {data && (
        <>
          <span className={`chip ${EXAM_GENERATION_STATUS[data.status].chip}`} style={{ width: 'fit-content' }}>
            <span className="ms">{EXAM_GENERATION_STATUS[data.status].icon}</span>
            {EXAM_GENERATION_STATUS[data.status].label}
          </span>

          {(data.status === 'queued' || data.status === 'processing') && (
            <p className="subtitle">الذكاء الاصطناعي بيجهّز الاختبار الآن، هيظهر هنا أول ما يخلص...</p>
          )}

          {data.status === 'failed' && data.errorMessage && (
            <p role="alert" style={{ color: 'var(--error)' }}>{data.errorMessage}</p>
          )}

          {data.draft && (
            <div className="quiz-question-editor">
              <h4>{data.draft.title}</h4>
              {data.draft.questions.map((question, index) => (
                <div key={question.id} className="quiz-question-card">
                  <span className="s">سؤال {index + 1} — {question.type === 'mcq' ? 'اختيار من متعدد' : 'صح أو خطأ'}</span>
                  <p style={{ fontWeight: 700 }}>{question.text}</p>
                  <ul>
                    {(question.options ?? []).map((option) => (
                      <li
                        key={option}
                        style={{
                          fontWeight: option === question.correctAnswer ? 800 : 400,
                          color: option === question.correctAnswer ? 'var(--success, #1a9b5c)' : undefined,
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

          {data.feedback.length > 0 && (
            <div>
              <h4>سجل الملاحظات</h4>
              <ul>
                {data.feedback.map((entry) => (
                  <li key={entry.id}>{entry.message}</li>
                ))}
              </ul>
            </div>
          )}

          {data.status === 'pending_review' && (
            <>
              <div className="actions">
                <button type="button" className="btn" disabled={isBusy} onClick={() => void handleAccept()}>
                  <span className="ms">check</span>
                  قبول ونشر
                </button>
                <button
                  type="button"
                  className="btn tonal"
                  disabled={isBusy}
                  onClick={() => setShowRejectModal(true)}
                  style={{ color: 'var(--error)' }}
                >
                  <span className="ms">close</span>
                  رفض
                </button>
              </div>

              <form onSubmit={(event) => void handleFeedback(event)} className="tf">
                <label htmlFor="exam-feedback">اطلب من الذكاء الاصطناعي تعديل الاختبار</label>
                <textarea
                  id="exam-feedback"
                  rows={3}
                  value={feedbackMessage}
                  onChange={(event) => setFeedbackMessage(event.target.value)}
                  onKeyDown={(event) =>
                    handleChatInputKeyDown(
                      event,
                      () => void handleFeedback(),
                      isBusy || !feedbackMessage.trim(),
                    )
                  }
                  placeholder="مثال: ركّز أكتر على الفصل التاني، وسهّل الأسئلة شوية"
                />
                <button type="submit" className="btn tonal" disabled={isBusy || !feedbackMessage.trim()}>
                  <span className="ms">refresh</span>
                  أعد الإنشاء بهذه الملاحظة
                </button>
              </form>
            </>
          )}
        </>
      )}

      <ConfirmModal
        open={showRejectModal}
        title="رفض المسودة"
        message="هل أنت متأكد من رفض هذه المسودة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="رفض المسودة"
        cancelLabel="إلغاء"
        isLoading={isRejecting}
        variant="danger"
        onConfirm={() => void handleConfirmReject()}
        onCancel={() => setShowRejectModal(false)}
      />
    </div>
  )
}
