import { useState, type FormEvent } from 'react'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
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

interface LessonDraft {
  title: string
  videoUrl: string
}

const EMPTY_LESSON_DRAFT: LessonDraft = { title: '', videoUrl: '' }

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
  const [lessonEditDraft, setLessonEditDraft] = useState<LessonDraft>(EMPTY_LESSON_DRAFT)

  const [busyEntityId, setBusyEntityId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'section' | 'lesson'
    id: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function draftFor(sectionId: string): LessonDraft {
    return lessonDrafts[sectionId] ?? EMPTY_LESSON_DRAFT
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

  async function handleAddLesson(event: FormEvent<HTMLFormElement>, sectionId: string) {
    event.preventDefault()
    const draft = draftFor(sectionId)
    const title = draft.title.trim()
    if (!title) return

    setBusyLessonSectionId(sectionId)
    setLessonErrorSectionId(null)
    try {
      await createLesson(sectionId, { title, videoUrl: draft.videoUrl.trim() || null })
      setLessonDrafts((current) => ({ ...current, [sectionId]: EMPTY_LESSON_DRAFT }))
      onChange()
    } catch {
      setLessonErrorSectionId(sectionId)
    } finally {
      setBusyLessonSectionId(null)
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
    setLessonEditDraft(EMPTY_LESSON_DRAFT)
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
              className="actions"
              style={{ flexWrap: 'wrap' }}
            >
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
                placeholder="رابط الفيديو أو كود embed من Bunny.net (اختياري)"
              />
              <button
                type="submit"
                className="btn tonal"
                disabled={!draft.title.trim() || busyLessonSectionId === section.id}
              >
                <span className="ms">add</span>
                إضافة درس
              </button>
            </form>
            {lessonErrorSectionId === section.id && (
              <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, marginTop: -10 }}>
                تعذر إضافة الدرس، حاول مرة أخرى
              </p>
            )}
          </div>
        )
      })}

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
