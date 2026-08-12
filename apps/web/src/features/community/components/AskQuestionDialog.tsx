import { useEffect, useRef, useState } from 'react'
import { AttachmentPicker } from '../../../shared/components/AttachmentPicker'
import { ApiError } from '../../../shared/api/api-error'

interface AskQuestionDialogProps {
  open: boolean
  isSubmitting: boolean
  onSubmit: (input: { title: string; body: string; tags: string[]; attachment: File | null }) => Promise<void>
  onClose: () => void
}

const MAX_TAGS = 5

export function AskQuestionDialog({ open, isSubmitting, onSubmit, onClose }: AskQuestionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
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
    setTitle('')
    setBody('')
    setTagInput('')
    setTags([])
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

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, '')
    if (!tag || tags.length >= MAX_TAGS || tags.includes(tag)) {
      setTagInput('')
      return
    }
    setTags((current) => [...current, tag])
    setTagInput('')
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('العنوان والتفاصيل مطلوبين.')
      return
    }
    setError(null)
    try {
      await onSubmit({ title: title.trim(), body: body.trim(), tags, attachment })
      resetAndClose()
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.details === 'object' && err.details && 'message' in err.details
          ? String((err.details as { message: unknown }).message)
          : 'تعذر نشر السؤال، حاول مرة أخرى.',
      )
    }
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="form-dialog"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby="ask-question-title"
    >
      <form className="form-dialog-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="form-dialog-head">
          <h2 id="ask-question-title">اسأل سؤال جديد</h2>
          <button type="button" className="icon-btn" onClick={resetAndClose} disabled={isSubmitting} aria-label="إغلاق">
            <span className="ms">close</span>
          </button>
        </div>

        <div className="tf">
          <label htmlFor="question-title">عنوان السؤال</label>
          <input
            id="question-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSubmitting}
            maxLength={200}
            required
          />
        </div>

        <div className="tf">
          <label htmlFor="question-body">تفاصيل السؤال</label>
          <textarea
            id="question-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={isSubmitting}
            rows={5}
            maxLength={10000}
            required
          />
        </div>

        <div className="tf">
          <label htmlFor="question-tags">الوسوم (اختياري)</label>
          <input
            id="question-tags"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            disabled={isSubmitting || tags.length >= MAX_TAGS}
            placeholder="اكتب وسم واضغط Enter"
          />
        </div>

        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <span key={tag} className="chip outline">
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((current) => current.filter((t) => t !== tag))}
                  disabled={isSubmitting}
                  aria-label={`إزالة وسم ${tag}`}
                  style={{ marginInlineStart: 4 }}
                >
                  <span className="ms" style={{ fontSize: 14 }}>
                    close
                  </span>
                </button>
              </span>
            ))}
          </div>
        )}

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
            {isSubmitting ? 'جارٍ النشر...' : 'نشر السؤال'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
