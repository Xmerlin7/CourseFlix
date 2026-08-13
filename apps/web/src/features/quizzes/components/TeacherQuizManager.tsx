import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { showToast } from '../../../shared/components/Toast'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import type { CourseDetail } from '../../courses/types/course.types'
import {
  createTeacherQuiz,
  deleteTeacherQuiz,
  getTeacherCourseQuizzes,
  updateTeacherQuiz,
} from '../api/quizzes.api'
import type {
  TeacherQuiz,
  TeacherQuizQuestionPayload,
} from '../types/quiz.types'

interface TeacherQuizManagerProps {
  course: CourseDetail
}

type QuizTargetType = 'course' | 'section' | 'lesson'

interface QuestionDraft {
  id?: string
  type: 'mcq' | 'true_false'
  text: string
  options: string[]
  correctAnswer: string
}

interface QuizDraft {
  title: string
  targetType: QuizTargetType
  sectionId: string
  lessonId: string
  questions: QuestionDraft[]
}

const TRUE_FALSE_OPTIONS = ['صح', 'خطأ']

function emptyQuestion(): QuestionDraft {
  return {
    type: 'mcq',
    text: '',
    options: ['', ''],
    correctAnswer: '',
  }
}

function emptyDraft(): QuizDraft {
  return {
    title: '',
    targetType: 'course',
    sectionId: '',
    lessonId: '',
    questions: [emptyQuestion()],
  }
}

function draftFromQuiz(quiz: TeacherQuiz): QuizDraft {
  return {
    title: quiz.title,
    targetType: 'course',
    sectionId: '',
    lessonId: '',
    questions: quiz.questions.map((question) => ({
      id: question.id,
      type: question.type,
      text: question.text,
      options:
        question.type === 'true_false'
          ? TRUE_FALSE_OPTIONS
          : (question.options ?? ['', '']).map(String),
      correctAnswer: question.correctAnswer,
    })),
  }
}

function toPayloadQuestion(question: QuestionDraft): TeacherQuizQuestionPayload {
  const options =
    question.type === 'true_false'
      ? TRUE_FALSE_OPTIONS
      : question.options.map((option) => option.trim()).filter(Boolean)

  return {
    id: question.id,
    type: question.type,
    text: question.text.trim(),
    options,
    correctAnswer: question.correctAnswer.trim(),
  }
}

function isValidQuestion(question: QuestionDraft): boolean {
  const payload = toPayloadQuestion(question)
  return (
    payload.text.length > 0 &&
    payload.correctAnswer.length > 0 &&
    payload.options.length >= 2 &&
    payload.options.includes(payload.correctAnswer)
  )
}

const PAGE_SIZE = 10

export function TeacherQuizManager({ course }: TeacherQuizManagerProps) {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])

  const toHaystack = useCallback((quiz: TeacherQuiz) => quiz.title, [])
  const list = usePaginatedList(quizzes, toHaystack, PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [busyQuizId, setBusyQuizId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<QuizDraft>(emptyDraft)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const lessons = useMemo(
    () =>
      course.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          sectionId: section.id,
          sectionTitle: section.title,
        })),
      ),
    [course.sections],
  )

  const selectedLesson = lessons.find((lesson) => lesson.id === draft.lessonId)

  async function loadQuizzes() {
    setIsLoading(true)
    setError(null)
    try {
      setQuizzes(await getTeacherCourseQuizzes(course.id))
    } catch {
      setError('تعذر تحميل الاختبارات')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadQuizzes()
  }, [course.id])

  function openCreateForm() {
    setDraft(emptyDraft())
    setEditingQuizId(null)
    setIsFormOpen(true)
    setError(null)
  }

  function openEditForm(quiz: TeacherQuiz) {
    setDraft(draftFromQuiz(quiz))
    setEditingQuizId(quiz.id)
    setIsFormOpen(true)
    setError(null)
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => {
        if (questionIndex !== index) return question

        const next = { ...question, ...patch }
        if (patch.type === 'true_false') {
          next.options = TRUE_FALSE_OPTIONS
          next.correctAnswer = TRUE_FALSE_OPTIONS.includes(next.correctAnswer)
            ? next.correctAnswer
            : TRUE_FALSE_OPTIONS[0]
        }
        if (patch.type === 'mcq' && question.type === 'true_false') {
          next.options = ['', '']
          next.correctAnswer = ''
        }
        if (patch.options && !patch.options.includes(next.correctAnswer)) {
          next.correctAnswer = ''
        }

        return next
      }),
    }))
  }

  function addQuestion() {
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, emptyQuestion()],
    }))
  }

  function removeQuestion(index: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.filter((_, questionIndex) => questionIndex !== index),
    }))
  }

  function buildPayload() {
    const title = draft.title.trim()
    const questions = draft.questions.map(toPayloadQuestion)
    if (!title || questions.length === 0 || !draft.questions.every(isValidQuestion)) {
      return null
    }
    if (draft.targetType === 'section' && !draft.sectionId) {
      return null
    }
    if (draft.targetType === 'lesson' && (!draft.lessonId || !selectedLesson)) {
      return null
    }

    const target =
      draft.targetType === 'lesson'
        ? { lessonId: draft.lessonId, sectionId: selectedLesson?.sectionId }
        : draft.targetType === 'section'
          ? { sectionId: draft.sectionId }
          : {}

    return {
      courseId: course.id,
      ...target,
      title,
      questions,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = buildPayload()
    if (!payload) {
      setError('راجع عنوان الاختبار والأسئلة والإجابات الصحيحة')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      if (editingQuizId) {
        await updateTeacherQuiz(editingQuizId, {
          title: payload.title,
          questions: payload.questions,
        })
      } else {
        await createTeacherQuiz(payload)
      }
      setIsFormOpen(false)
      setEditingQuizId(null)
      setDraft(emptyDraft())
      await loadQuizzes()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('لا يمكن تعديل أسئلة اختبار تم تسليمه من الطلاب')
      } else {
        setError('تعذر حفظ الاختبار، راجع البيانات وحاول مرة أخرى')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const [deleteTargetQuiz, setDeleteTargetQuiz] = useState<TeacherQuiz | null>(null)
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false)

  async function handleDelete(quiz: TeacherQuiz) {
    setDeleteTargetQuiz(quiz)
  }

  async function handleConfirmDeleteQuiz() {
    if (!deleteTargetQuiz || isDeletingQuiz) return

    setIsDeletingQuiz(true)
    setBusyQuizId(deleteTargetQuiz.id)
    setError(null)
    try {
      await deleteTeacherQuiz(deleteTargetQuiz.id)
      setDeleteTargetQuiz(null)
      showToast('تم حذف الاختبار بنجاح', 'success')
      await loadQuizzes()
    } catch {
      setDeleteTargetQuiz(null)
      setError('تعذر حذف الاختبار')
      showToast('حدث خطأ أثناء حذف الاختبار. حاول مرة أخرى.', 'error')
    } finally {
      setIsDeletingQuiz(false)
      setBusyQuizId(null)
    }
  }

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>الاختبارات اليدوية</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            أنشئ وعدّل اختبارات الكورس بنفسك بدون استخدام الذكاء الاصطناعي
          </p>
        </div>
        <button type="button" className="btn" onClick={openCreateForm}>
          <span className="ms">add</span>
          اختبار جديد
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 700 }}>
          {error}
        </p>
      )}

      {isFormOpen && (
        <form onSubmit={(event) => void handleSubmit(event)} className="card" style={{ gap: 18 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h3>{editingQuizId ? 'تعديل الاختبار' : 'إنشاء اختبار يدوي'}</h3>
            <button
              type="button"
              className="btn text"
              onClick={() => {
                setIsFormOpen(false)
                setEditingQuizId(null)
                setDraft(emptyDraft())
              }}
            >
              إلغاء
            </button>
          </div>

          <div className="tf">
            <label htmlFor="quiz-title">عنوان الاختبار</label>
            <input
              id="quiz-title"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              required
              maxLength={200}
            />
          </div>

          {!editingQuizId && (
            <div className="grid-2">
              <div className="tf">
                <label htmlFor="quiz-target">مكان الاختبار</label>
                <select
                  id="quiz-target"
                  value={draft.targetType}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      targetType: event.target.value as QuizTargetType,
                      sectionId: '',
                      lessonId: '',
                    }))
                  }
                >
                  <option value="course">الكورس كله</option>
                  <option value="section">قسم معين</option>
                  <option value="lesson">درس معين</option>
                </select>
              </div>

              {draft.targetType === 'section' && (
                <div className="tf">
                  <label htmlFor="quiz-section">القسم</label>
                  <select
                    id="quiz-section"
                    value={draft.sectionId}
                    onChange={(event) => setDraft((current) => ({ ...current, sectionId: event.target.value }))}
                    required
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

              {draft.targetType === 'lesson' && (
                <div className="tf">
                  <label htmlFor="quiz-lesson">الدرس</label>
                  <select
                    id="quiz-lesson"
                    value={draft.lessonId}
                    onChange={(event) => setDraft((current) => ({ ...current, lessonId: event.target.value }))}
                    required
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
          )}

          <div className="quiz-question-editor">
            {draft.questions.map((question, index) => (
              <QuestionEditor
                key={question.id ?? index}
                question={question}
                index={index}
                canRemove={draft.questions.length > 1}
                onChange={(patch) => updateQuestion(index, patch)}
                onRemove={() => removeQuestion(index)}
              />
            ))}
          </div>

          <div className="actions">
            <button type="button" className="btn tonal" onClick={addQuestion}>
              <span className="ms">add</span>
              إضافة سؤال
            </button>
            <button type="submit" className="btn" disabled={isSaving}>
              <span className="ms">save</span>
              {isSaving ? 'جارٍ الحفظ...' : 'حفظ الاختبار'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="subtitle">جارٍ تحميل الاختبارات...</p>
      ) : quizzes.length === 0 ? (
        <p className="subtitle">لسه مفيش اختبارات في الكورس ده</p>
      ) : (
        <>
          <SearchField
            id="teacher-quizzes-search"
            label="بحث في الاختبارات"
            placeholder="ابحث باسم الاختبار..."
            value={list.query}
            onChange={list.search}
          />

          {list.isEmptyResult && (
            <p className="subtitle">مفيش اختبارات مطابقة لبحثك، جرّب كلمة تانية</p>
          )}

          <div className="list">
            {list.pageItems.map((quiz) => (
            <div key={quiz.id} className="list-item">
              <span className="lead">
                <span className="ms">quiz</span>
              </span>
              <span className="body">
                <span className="t">{quiz.title}</span>
                <span className="s">
                  {quiz.questions.length} سؤال - الإصدار {quiz.version}
                </span>
              </span>
              <span className="end">
                <button type="button" className="btn text" onClick={() => openEditForm(quiz)}>
                  <span className="ms sm">edit</span>
                  تعديل
                </button>
                <button
                  type="button"
                  className="btn text"
                  disabled={busyQuizId === quiz.id}
                  onClick={() => void handleDelete(quiz)}
                  style={{ color: 'var(--error)' }}
                >
                  <span className="ms sm">delete</span>
                  حذف
                </button>
              </span>
            </div>
            ))}
          </div>

          {list.hasPages && (
            <Pagination
              page={list.page}
              totalPages={list.totalPages}
              onPageChange={list.setPage}
              matchCount={list.matchCount}
              pageSize={PAGE_SIZE}
              itemLabel="اختبار"
            />
          )}
        </>
      )}
      <ConfirmModal
        open={deleteTargetQuiz !== null}
        title="حذف الاختبار"
        message={`هل أنت متأكد من حذف اختبار "${deleteTargetQuiz?.title ?? ''}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف الاختبار"
        cancelLabel="إلغاء"
        isLoading={isDeletingQuiz}
        variant="danger"
        onConfirm={() => void handleConfirmDeleteQuiz()}
        onCancel={() => setDeleteTargetQuiz(null)}
      />
    </section>
  )
}

function QuestionEditor({
  question,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  question: QuestionDraft
  index: number
  canRemove: boolean
  onChange: (patch: Partial<QuestionDraft>) => void
  onRemove: () => void
}) {
  const options = question.type === 'true_false' ? TRUE_FALSE_OPTIONS : question.options

  function updateOption(optionIndex: number, value: string) {
    const nextOptions = question.options.map((option, currentIndex) =>
      currentIndex === optionIndex ? value : option,
    )
    onChange({ options: nextOptions })
  }

  return (
    <div className="quiz-question-card">
      <div className="section-head" style={{ marginBottom: 0 }}>
        <h4>سؤال {index + 1}</h4>
        <div className="actions">
          <select
            aria-label={`نوع سؤال ${index + 1}`}
            value={question.type}
            onChange={(event) => onChange({ type: event.target.value as QuestionDraft['type'] })}
          >
            <option value="mcq">اختيار من متعدد</option>
            <option value="true_false">صح أو خطأ</option>
          </select>
          {canRemove && (
            <button type="button" className="btn text" onClick={onRemove} style={{ color: 'var(--error)' }}>
              <span className="ms sm">delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="tf">
        <label htmlFor={`quiz-question-${index}`}>نص السؤال</label>
        <textarea
          id={`quiz-question-${index}`}
          value={question.text}
          onChange={(event) => onChange({ text: event.target.value })}
          rows={2}
          required
        />
      </div>

      <div className="quiz-options-grid">
        {options.map((option, optionIndex) => (
          <div className="tf" key={`${question.type}-${optionIndex}`}>
            <label htmlFor={`quiz-question-${index}-option-${optionIndex}`}>
              إجابة {optionIndex + 1}
            </label>
            <input
              id={`quiz-question-${index}-option-${optionIndex}`}
              value={option}
              onChange={(event) => updateOption(optionIndex, event.target.value)}
              readOnly={question.type === 'true_false'}
              required
            />
          </div>
        ))}
      </div>

      {question.type === 'mcq' && (
        <button
          type="button"
          className="btn tonal"
          onClick={() => onChange({ options: [...question.options, ''] })}
        >
          <span className="ms">add</span>
          إضافة اختيار
        </button>
      )}

      <div className="tf">
        <label htmlFor={`quiz-question-${index}-correct`}>الإجابة الصحيحة</label>
        <select
          id={`quiz-question-${index}-correct`}
          value={question.correctAnswer}
          onChange={(event) => onChange({ correctAnswer: event.target.value })}
          required
        >
          <option value="">اختر الإجابة الصحيحة</option>
          {options
            .map((option) => option.trim())
            .filter(Boolean)
            .map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}
