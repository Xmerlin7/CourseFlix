import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { ApiError } from '../../../shared/api/api-error'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { deleteTeacherCourse, updateTeacherCourse } from '../api/teacher.api'
import type { TeacherCourse } from '../types/teacher.types'

interface TeacherCourseFormProps {
  course: TeacherCourse
  onSaved?: (course: TeacherCourse) => void
}

export function TeacherCourseForm({ course, onSaved }: TeacherCourseFormProps) {
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(course.coverImageUrl ?? '')
  const [gradeLevel, setGradeLevel] = useState(course.gradeLevel ?? '')
  // Shown to the teacher in whole EGP, converted to minor units (1/100
  // EGP) only at submit — `order_items.price_minor`'s unit, not a unit
  // a teacher should have to think in.
  const [priceEgp, setPriceEgp] = useState(
    course.priceMinor != null ? String(course.priceMinor / 100) : '',
  )
  const [status, setStatus] = useState<'draft' | 'published'>(
    course.status === 'archived' ? 'draft' : course.status,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const updated = await updateTeacherCourse(course.id, {
        title,
        description: description || null,
        coverImageUrl: coverImageUrl || null,
        gradeLevel: gradeLevel || null,
        status,
        priceMinor: priceEgp.trim() === '' ? null : Math.round(Number(priceEgp) * 100),
      })
      setSavedAt(Date.now())
      onSaved?.(updated)
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError('البيانات المدخلة غير صحيحة، راجع الحقول وحاول مرة أخرى')
      } else {
        setError('تعذر حفظ التعديلات، حاول مرة أخرى')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    if (isDeleting) return

    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteTeacherCourse(course.id)
      setShowDeleteModal(false)
      showToast('تم حذف الدورة بنجاح', 'success')
      navigate(ROUTE_PATHS.TEACHER.COURSES, { replace: true })
    } catch {
      setShowDeleteModal(false)
      setDeleteError('تعذر حذف الدورة، حاول مرة أخرى')
      showToast('حدث خطأ أثناء حذف الدورة. حاول مرة أخرى.', 'error')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <form onSubmit={(event) => void handleSubmit(event)} className="card">
        <h3>تعديل بيانات الدورة</h3>

        <div className="tf">
          <label htmlFor="course-title">العنوان</label>
          <input
            id="course-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={150}
            required
          />
        </div>

        <div className="tf">
          <label htmlFor="course-description">الوصف</label>
          <textarea
            id="course-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
            rows={4}
          />
        </div>

        <div className="tf">
          <label htmlFor="course-cover">رابط صورة الغلاف</label>
          <input
            id="course-cover"
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
            type="url"
            placeholder="الصق رابط صورة الغلاف"
          />
        </div>

        <div className="tf">
          <label htmlFor="course-grade">الصف الدراسي</label>
          <input
            id="course-grade"
            value={gradeLevel}
            onChange={(event) => setGradeLevel(event.target.value)}
            maxLength={100}
          />
        </div>

        <div className="tf">
          <label htmlFor="course-price">سعر الدورة (جنيه)</label>
          <input
            id="course-price"
            type="number"
            min={0}
            step={1}
            inputMode="decimal"
            value={priceEgp}
            onChange={(event) => setPriceEgp(event.target.value)}
            placeholder="السعر الافتراضي للمنصة"
          />
          <span className="meta">سيبه فاضي عشان يستخدم السعر الافتراضي للمنصة.</span>
        </div>

        <div className="tf">
          <label htmlFor="course-status">الحالة</label>
          <select
            id="course-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}
          >
            <option value="draft">مسودة</option>
            <option value="published">منشورة</option>
          </select>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
            {error}
          </p>
        )}

        {savedAt && !error && (
          <p role="status" style={{ color: 'var(--on-success-container)', fontSize: 13.5, fontWeight: 600 }}>
            تم حفظ التعديلات بنجاح
          </p>
        )}

        {deleteError && (
          <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
            {deleteError}
          </p>
        )}

        <div className="actions">
          <button type="submit" disabled={isSaving} className="btn">
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setShowDeleteModal(true)}
            className="btn text"
            style={{ color: 'var(--error)' }}
          >
            <span className="ms sm">delete</span>
            {isDeleting ? 'جارٍ الحذف...' : 'حذف الدورة'}
          </button>
        </div>
      </form>

      <ConfirmModal
        open={showDeleteModal}
        title="حذف الدورة"
        message="هل أنت متأكد من حذف هذه الدورة نهائيًا مع كل الأقسام والدروس؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف الدورة"
        cancelLabel="إلغاء"
        isLoading={isDeleting}
        variant="danger"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  )
}
