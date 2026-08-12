import { useEffect, useRef, useState } from 'react'
import { AttachmentPicker } from '../../../shared/components/AttachmentPicker'
import { useStudentEnrollments } from '../../student/hooks/useStudentEnrollments'
import type { CreateTicketInput } from '../api/support.api'
import { SUPPORT_TICKET_CATEGORY_LABELS } from '../lib/support-status-labels'

interface CreateTicketDialogProps {
  open: boolean
  isSubmitting: boolean
  onSubmit: (input: CreateTicketInput) => Promise<void>
  onClose: () => void
}

const CATEGORIES: CreateTicketInput['category'][] = [
  'technical',
  'course',
  'payment',
  'account',
  'other',
]

export function CreateTicketDialog({ open, isSubmitting, onSubmit, onClose }: CreateTicketDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { data: enrollments } = useStudentEnrollments()

  const [category, setCategory] = useState<CreateTicketInput['category']>('technical')
  const [courseId, setCourseId] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  function resetAndClose() {
    if (isSubmitting) return
    setCategory('technical')
    setCourseId('')
    setSubject('')
    setDescription('')
    setAttachment(null)
    setError(null)
    onClose()
  }

  function handleCancel(event: React.SyntheticEvent) {
    event.preventDefault()
    resetAndClose()
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) resetAndClose()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!subject.trim() || !description.trim()) {
      setError('العنوان والوصف مطلوبين.')
      return
    }
    setError(null)
    try {
      await onSubmit({
        category,
        subject: subject.trim(),
        description: description.trim(),
        courseId: courseId || undefined,
        attachment,
      })
      resetAndClose()
    } catch {
      setError('تعذر إرسال الطلب، حاول مرة أخرى.')
    }
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="form-dialog"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby="create-ticket-title"
    >
      <form className="form-dialog-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="form-dialog-head">
          <h2 id="create-ticket-title">طلب دعم جديد</h2>
          <button type="button" className="icon-btn" onClick={resetAndClose} disabled={isSubmitting} aria-label="إغلاق">
            <span className="ms">close</span>
          </button>
        </div>

        <div className="tf">
          <label htmlFor="ticket-category">نوع المشكلة</label>
          <select
            id="ticket-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as CreateTicketInput['category'])}
            disabled={isSubmitting}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {SUPPORT_TICKET_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        {enrollments.length > 0 && (
          <div className="tf">
            <label htmlFor="ticket-course">الدورة المرتبطة (اختياري)</label>
            <select
              id="ticket-course"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">بدون دورة محددة</option>
              {enrollments.map((enrollment) => (
                <option key={enrollment.courseId} value={enrollment.courseId}>
                  {enrollment.courseTitle ?? enrollment.courseId}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="tf">
          <label htmlFor="ticket-subject">العنوان</label>
          <input
            id="ticket-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={isSubmitting}
            maxLength={200}
            required
          />
        </div>

        <div className="tf">
          <label htmlFor="ticket-description">وصف المشكلة</label>
          <textarea
            id="ticket-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSubmitting}
            rows={5}
            maxLength={10000}
            required
          />
        </div>

        <AttachmentPicker file={attachment} onChange={setAttachment} disabled={isSubmitting} label="إضافة صورة/ملف" />

        {error && (
          <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600, margin: 0 }}>
            {error}
          </p>
        )}

        <div className="form-dialog-actions">
          <button type="button" className="btn outline" onClick={resetAndClose} disabled={isSubmitting}>
            إلغاء
          </button>
          <button type="submit" className="btn primary" disabled={isSubmitting}>
            {isSubmitting && <span className="ms spin">progress_activity</span>}
            {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
