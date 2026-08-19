import { useState, type FormEvent } from 'react'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { AGENT_RUN_STATUS } from '../../../shared/lib/status-labels'
import { AgentCrewPicker } from '../../lesson-agents/components/AgentCrewPicker'
import type { AgentCrewSelection } from '../../lesson-agents/components/AgentCrewPicker'
import { AgentRunPanel } from '../../lesson-agents/components/AgentRunPanel'
import { useAgentSettings } from '../../lesson-agents/hooks/useAgentSettings'
import { useCourseAgentRuns } from '../../lesson-agents/hooks/useCourseAgentRuns'
import {
  createLesson,
  createSection,
  deleteLesson,
  deleteSection,
  updateLesson,
  updateSection,
} from '../api/teacher.api'
import type { CourseDetail, CourseLesson, CourseSection } from '../../courses/types/course.types'

interface TeacherContentManagerProps {
  course: CourseDetail
  onChange: () => void
}

/** How the teacher wants a new lesson processed after it's saved. */
type LessonUploadMode = 'manual' | 'agents'

interface LessonDraft {
  title: string
  videoUrl: string
  mode: LessonUploadMode
}

/**
 * Editing an existing lesson has no mode: the choice is about how a
 * *new* lesson gets processed, and re-picking it on every title tweak
 * would imply editing could re-run the crew, which it doesn't.
 */
type LessonEditDraft = Pick<LessonDraft, 'title' | 'videoUrl'>

const EMPTY_LESSON_DRAFT: LessonDraft = { title: '', videoUrl: '', mode: 'manual' }
const EMPTY_LESSON_EDIT_DRAFT: LessonEditDraft = { title: '', videoUrl: '' }

/**
 * Teacher-only section/lesson CRUD — the backend has always supported
 * this (POST/PATCH/DELETE under /teacher/courses, /teacher/sections,
 * /teacher/lessons), it just never had a frontend. CourseDetailView stays
 * the shared read-only student/teacher summary; this is the separate
 * management surface rendered only when `course.canEdit`.
 */
export function TeacherContentManager({ course, onChange }: TeacherContentManagerProps) {
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [sectionError, setSectionError] = useState<string | null>(null)

  const [lessonDrafts, setLessonDrafts] = useState<Record<string, LessonDraft>>({})
  const [busyLessonSectionId, setBusyLessonSectionId] = useState<string | null>(null)
  const [lessonErrorSectionId, setLessonErrorSectionId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [lessonEditDraft, setLessonEditDraft] = useState<LessonEditDraft>(EMPTY_LESSON_EDIT_DRAFT)

  const [busyEntityId, setBusyEntityId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'section' | 'lesson'
    id: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const agentRuns = useCourseAgentRuns(course.id)
  const agentSettings = useAgentSettings()
  const [openRunId, setOpenRunId] = useState<string | null>(null)

  // Per-section, per-run crew choice. `undefined` means "not touched",
  // which falls back to the teacher's saved defaults rather than to a
  // hardcoded pair — so the picker opens showing what would actually run.
  const [crewChoices, setCrewChoices] = useState<Record<string, AgentCrewSelection>>({})

  function crewFor(sectionId: string): AgentCrewSelection {
    return (
      crewChoices[sectionId] ?? {
        handout: agentSettings.data?.handoutEnabled ?? true,
        quiz: agentSettings.data?.quizEnabled ?? true,
        notifier: agentSettings.data?.notifierEnabled ?? true,
      }
    )
  }

  function draftFor(sectionId: string): LessonDraft {
    return lessonDrafts[sectionId] ?? EMPTY_LESSON_DRAFT
  }

  /**
   * The newest run for a lesson. Runs come back newest-first, so the
   * first match is the one whose state belongs on the lesson's row —
   * older runs stay reachable, they just aren't what "this lesson's
   * agents" means right now.
   */
  function latestRunFor(lessonId: string) {
    return agentRuns.data.find((run) => run.lessonId === lessonId)
  }

  async function handleAddSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newSectionTitle.trim()
    if (!title) return

    setIsAddingSection(true)
    setSectionError(null)
    try {
      await createSection(course.id, { title })
      setNewSectionTitle('')
      onChange()
    } catch {
      setSectionError('تعذر إضافة القسم، حاول مرة أخرى')
    } finally {
      setIsAddingSection(false)
    }
  }

  /**
   * Two steps on purpose in agent mode: the lesson is saved first (with
   * `useAgents`, which tells the API not to fire its own caption job),
   * then the run is started against the saved lesson. If starting the
   * crew fails the lesson still exists — the teacher retries the run,
   * they don't lose the lesson.
   */
  async function handleAddLesson(event: FormEvent<HTMLFormElement>, sectionId: string) {
    event.preventDefault()
    const draft = draftFor(sectionId)
    const title = draft.title.trim()
    const videoUrl = draft.videoUrl.trim()
    if (!title) return

    const useAgents = draft.mode === 'agents'
    if (useAgents && !videoUrl) {
      setLessonErrorSectionId(sectionId)
      showToast('الوكلاء محتاجين رابط فيديو يشتغلوا عليه', 'error')
      return
    }

    setBusyLessonSectionId(sectionId)
    setLessonErrorSectionId(null)
    try {
      const lesson = await createLesson(sectionId, {
        title,
        videoUrl: videoUrl || null,
        useAgents,
      })
      setLessonDrafts((current) => ({ ...current, [sectionId]: EMPTY_LESSON_DRAFT }))
      onChange()

      if (useAgents) {
        const crew = crewFor(sectionId)
        const run = await agentRuns.start(lesson.id, {
          handoutEnabled: crew.handout,
          quizEnabled: crew.quiz,
          notifierEnabled: crew.notifier,
        })
        setOpenRunId(run.id)
        showToast('الفريق بدأ شغله على الدرس', 'success')
      }
    } catch {
      setLessonErrorSectionId(sectionId)
    } finally {
      setBusyLessonSectionId(null)
    }
  }

  /** Runs the crew over a lesson that already exists. */
  async function handleStartAgents(lesson: CourseLesson) {
    if (!lesson.videoUrl) {
      showToast('الدرس محتاج رابط فيديو قبل ما تشغّل الوكلاء', 'error')
      return
    }

    setBusyEntityId(lesson.id)
    try {
      const run = await agentRuns.start(lesson.id)
      setOpenRunId(run.id)
      showToast('الفريق بدأ شغله على الدرس', 'success')
    } catch {
      showToast('تعذر تشغيل الوكلاء، حاول مرة أخرى', 'error')
    } finally {
      setBusyEntityId(null)
    }
  }

  async function toggleSectionStatus(section: CourseSection) {
    setBusyEntityId(section.id)
    setActionError(null)
    try {
      await updateSection(section.id, {
        status: section.status === 'published' ? 'draft' : 'published',
      })
      onChange()
    } catch {
      setActionError('تعذر تحديث حالة القسم')
    } finally {
      setBusyEntityId(null)
    }
  }


  async function handleDeleteSection(sectionId: string) {
    setDeleteTarget({ type: 'section', id: sectionId })
  }

  async function handleDeleteLesson(lessonId: string) {
    setDeleteTarget({ type: 'lesson', id: lessonId })
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || isDeleting) return

    setIsDeleting(true)
    setBusyEntityId(deleteTarget.id)
    setActionError(null)

    try {
      if (deleteTarget.type === 'section') {
        await deleteSection(deleteTarget.id)
        showToast('تم حذف القسم بنجاح', 'success')
      } else {
        await deleteLesson(deleteTarget.id)
        showToast('تم حذف الدرس بنجاح', 'success')
      }
      setDeleteTarget(null)
      onChange()
    } catch {
      showToast(
        deleteTarget.type === 'section'
          ? 'حدث خطأ أثناء حذف القسم. حاول مرة أخرى.'
          : 'حدث خطأ أثناء حذف الدرس. حاول مرة أخرى.',
        'error',
      )
      setActionError(deleteTarget.type === 'section' ? 'تعذر حذف القسم' : 'تعذر حذف الدرس')
    } finally {
      setIsDeleting(false)
      setBusyEntityId(null)
    }
  }

  function startEditingLesson(lesson: CourseLesson) {
    setEditingLessonId(lesson.id)
    setLessonEditDraft({
      title: lesson.title,
      videoUrl: lesson.videoUrl ?? '',
    })
    setActionError(null)
  }

  function cancelEditingLesson() {
    setEditingLessonId(null)
    setLessonEditDraft(EMPTY_LESSON_EDIT_DRAFT)
  }

  async function handleUpdateLesson(event: FormEvent<HTMLFormElement>, lessonId: string) {
    event.preventDefault()
    const title = lessonEditDraft.title.trim()
    if (!title) return

    setBusyEntityId(lessonId)
    setActionError(null)
    try {
      await updateLesson(lessonId, {
        title,
        videoUrl: lessonEditDraft.videoUrl.trim() || null,
      })
      cancelEditingLesson()
      onChange()
    } catch {
      setActionError('تعذر حفظ تعديلات الدرس')
    } finally {
      setBusyEntityId(null)
    }
  }

  async function toggleLessonStatus(lesson: { id: string; status: 'draft' | 'published' }) {
    setBusyEntityId(lesson.id)
    setActionError(null)
    try {
      await updateLesson(lesson.id, {
        status: lesson.status === 'published' ? 'draft' : 'published',
      })
      onChange()
    } catch {
      setActionError('تعذر تحديث حالة الدرس')
    } finally {
      setBusyEntityId(null)
    }
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>إدارة المحتوى</h2>
      </div>

      <form onSubmit={(event) => void handleAddSection(event)} className="actions section">
        <input
          className="field"
          style={{ flex: 1, minWidth: 200 }}
          value={newSectionTitle}
          onChange={(event) => setNewSectionTitle(event.target.value)}
          placeholder="اسم القسم الجديد"
          maxLength={200}
        />
        <button type="submit" className="btn" disabled={!newSectionTitle.trim() || isAddingSection}>
          <span className="ms">add</span>
          إضافة قسم
        </button>
      </form>
      {sectionError && (
        <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, marginTop: -14, marginBottom: 14 }}>
          {sectionError}
        </p>
      )}
      {actionError && (
        <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, marginBottom: 14 }}>
          {actionError}
        </p>
      )}

      {course.sections.length === 0 && (
        <p className="subtitle">لسه مفيش أقسام — ابدأ بإضافة قسم من فوق</p>
      )}

      {course.sections.map((section) => {
        const draft = draftFor(section.id)
        return (
          <div key={section.id} className="card section" style={{ gap: 16 }}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{section.title}</h3>
              <div className="actions" style={{ gap: 6 }}>
                <span className={`chip${section.status === 'published' ? ' green' : ' outline'}`}>
                  {section.status === 'published' ? 'منشور' : 'مسودة'}
                </span>
                <button
                  type="button"
                  className="btn text"
                  disabled={busyEntityId === section.id}
                  onClick={() => void toggleSectionStatus(section)}
                >
                  {section.status === 'published' ? 'إخفاء' : 'نشر'}
                </button>
                <button
                  type="button"
                  className="btn text"
                  disabled={busyEntityId === section.id}
                  onClick={() => void handleDeleteSection(section.id)}
                  style={{ color: 'var(--error)' }}
                  aria-label={`حذف قسم ${section.title}`}
                >
                  <span className="ms sm">delete</span>
                </button>
              </div>
            </div>

            {section.lessons.length === 0 ? (
              <p className="subtitle" style={{ marginBottom: 0 }}>
                لا يوجد دروس في هذا القسم بعد
              </p>
            ) : (
              <div className="list">
                {section.lessons.map((lesson) => {
                  const isEditing = editingLessonId === lesson.id

                  return (
                    <div key={lesson.id} className="list-item">
                      <span className="lead">
                        <span className="ms">play_circle</span>
                      </span>
                      {isEditing ? (
                        <form
                          onSubmit={(event) => void handleUpdateLesson(event, lesson.id)}
                          className="body"
                          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                        >
                          <input
                            className="field"
                            value={lessonEditDraft.title}
                            onChange={(event) =>
                              setLessonEditDraft((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                            placeholder="اسم الدرس"
                            maxLength={200}
                          />
                          <textarea
                            className="field"
                            rows={3}
                            value={lessonEditDraft.videoUrl}
                            onChange={(event) =>
                              setLessonEditDraft((current) => ({
                                ...current,
                                videoUrl: event.target.value,
                              }))
                            }
                            placeholder="رابط الفيديو أو كود embed من Bunny.net (اختياري)"
                          />
                          <span className="actions" style={{ gap: 6 }}>
                            <button
                              type="submit"
                              className="btn tonal"
                              disabled={!lessonEditDraft.title.trim() || busyEntityId === lesson.id}
                            >
                              <span className="ms sm">save</span>
                              حفظ
                            </button>
                            <button
                              type="button"
                              className="btn text"
                              disabled={busyEntityId === lesson.id}
                              onClick={cancelEditingLesson}
                            >
                              إلغاء
                            </button>
                          </span>
                        </form>
                      ) : (
                        <>
                          <span className="body">
                            <span className="t">{lesson.title}</span>
                            <span className="s">{lesson.videoUrl ?? 'بدون رابط فيديو'}</span>
                          </span>
                          <span className="end">
                            <span className={`chip${lesson.status === 'published' ? ' green' : ' outline'}`}>
                              {lesson.status === 'published' ? 'منشور' : 'مسودة'}
                            </span>
                            {/* Publish state alone is misleading: a
                                "منشور" lesson whose video hasn't cleared
                                moderation is still invisible to students,
                                which looked like the lesson silently
                                vanished. Show the review state next to it. */}
                            {lesson.videoModerationStatus === 'pending' && (
                              <span className="chip outline" title="لن يظهر للطلاب حتى يتم اعتماده">
                                <span className="ms sm">hourglass_top</span>
                                قيد المراجعة
                              </span>
                            )}
                            {lesson.videoModerationStatus === 'rejected' && (
                              <span
                                className="chip red"
                                title={lesson.videoModerationReason ?? 'تم رفض الفيديو بعد مراجعته'}
                              >
                                <span className="ms sm">block</span>
                                مرفوض
                              </span>
                            )}
                            {/* The crew's state belongs next to the
                                lesson it's working on — the teacher
                                shouldn't have to remember which lessons
                                they handed to agents. */}
                            {(() => {
                              const run = latestRunFor(lesson.id)
                              if (!run) {
                                return (
                                  <button
                                    type="button"
                                    className="btn text"
                                    disabled={busyEntityId === lesson.id || !lesson.videoUrl}
                                    title={
                                      lesson.videoUrl
                                        ? 'شغّل فريق الوكلاء على الدرس ده'
                                        : 'محتاج رابط فيديو الأول'
                                    }
                                    onClick={() => void handleStartAgents(lesson)}
                                  >
                                    <span className="ms sm">smart_toy</span>
                                    شغّل الوكلاء
                                  </button>
                                )
                              }

                              const runStatus = AGENT_RUN_STATUS[run.status]
                              return (
                                <button
                                  type="button"
                                  className={`chip ${runStatus.chip}`}
                                  style={{ border: 'none', cursor: 'pointer' }}
                                  onClick={() => setOpenRunId(run.id)}
                                >
                                  <span className="ms sm">{runStatus.icon}</span>
                                  {runStatus.label}
                                  {run.status === 'running' && ` ${run.progress}%`}
                                </button>
                              )
                            })()}
                            <button
                              type="button"
                              className="btn text"
                              disabled={busyEntityId === lesson.id}
                              onClick={() => startEditingLesson(lesson)}
                            >
                              <span className="ms sm">edit</span>
                              تعديل
                            </button>
                            <button
                              type="button"
                              className="btn text"
                              disabled={busyEntityId === lesson.id}
                              onClick={() => void toggleLessonStatus(lesson)}
                            >
                              {lesson.status === 'published' ? 'إخفاء' : 'نشر'}
                            </button>
                            <button
                              type="button"
                              className="btn text"
                              disabled={busyEntityId === lesson.id}
                              onClick={() => void handleDeleteLesson(lesson.id)}
                              style={{ color: 'var(--error)' }}
                              aria-label={`حذف درس ${lesson.title}`}
                            >
                              <span className="ms sm">delete</span>
                            </button>
                          </span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <form
              onSubmit={(event) => void handleAddLesson(event, section.id)}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div className="actions" style={{ flexWrap: 'wrap' }}>
                <input
                  className="field"
                  style={{ flex: 2, minWidth: 160 }}
                  value={draft.title}
                  onChange={(event) =>
                    setLessonDrafts((current) => ({
                      ...current,
                      [section.id]: { ...draftFor(section.id), title: event.target.value },
                    }))
                  }
                  placeholder="اسم الدرس"
                  maxLength={200}
                />
                <textarea
                  className="field"
                  style={{ flex: 3, minWidth: 200 }}
                  rows={3}
                  value={draft.videoUrl}
                  onChange={(event) =>
                    setLessonDrafts((current) => ({
                      ...current,
                      [section.id]: { ...draftFor(section.id), videoUrl: event.target.value },
                    }))
                  }
                  placeholder={
                    draft.mode === 'agents'
                      ? 'رابط الفيديو (مطلوب عشان الوكلاء يشتغلوا)'
                      : 'رابط الفيديو أو كود embed من Bunny.net (اختياري)'
                  }
                />
              </div>

              <div
                className="actions"
                style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}
              >
                <div
                  className="agent-mode-switch"
                  role="radiogroup"
                  aria-label="طريقة رفع الدرس"
                >
                  {(
                    [
                      { value: 'manual', label: 'رفع عادي', icon: 'upload_file' },
                      { value: 'agents', label: 'وكلاء ذكيون', icon: 'smart_toy' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={draft.mode === option.value}
                      className={draft.mode === option.value ? 'active' : ''}
                      onClick={() =>
                        setLessonDrafts((current) => ({
                          ...current,
                          [section.id]: { ...draftFor(section.id), mode: option.value },
                        }))
                      }
                    >
                      <span className="ms sm">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn tonal"
                  disabled={!draft.title.trim() || busyLessonSectionId === section.id}
                >
                  <span className="ms">add</span>
                  {draft.mode === 'agents' ? 'أضف وشغّل الفريق' : 'إضافة درس'}
                </button>
              </div>

              {draft.mode === 'agents' ? (
                <AgentCrewPicker
                  value={crewFor(section.id)}
                  disabled={busyLessonSectionId === section.id}
                  onChange={(next) =>
                    setCrewChoices((current) => ({ ...current, [section.id]: next }))
                  }
                />
              ) : (
                <p className="meta" style={{ margin: 0 }}>
                  الدرس هيتحفظ وهيتفهرس للمساعد الذكي بالطريقة المعتادة.
                </p>
              )}
            </form>
            {lessonErrorSectionId === section.id && (
              <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, marginTop: -10 }}>
                تعذر إضافة الدرس، حاول مرة أخرى
              </p>
            )}
          </div>
        )
      })}

      {openRunId && (
        <AgentRunPanel
          runId={openRunId}
          onClose={() => {
            setOpenRunId(null)
            agentRuns.refetch()
            onChange()
          }}
        />
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteTarget?.type === 'section' ? 'حذف القسم' : 'حذف الدرس'}
        message={
          deleteTarget?.type === 'section'
            ? 'حذف القسم سيؤدي إلى حذف كل الدروس الموجودة بداخله. هل أنت متأكد؟'
            : 'هل أنت متأكد من حذف هذا الدرس نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.'
        }
        confirmLabel={deleteTarget?.type === 'section' ? 'حذف القسم' : 'حذف الدرس'}
        cancelLabel="إلغاء"
        isLoading={isDeleting}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
