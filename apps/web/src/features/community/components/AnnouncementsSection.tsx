import { useEffect, useState } from 'react'
import { AttachmentPicker } from '../../../shared/components/AttachmentPicker'
import { AttachmentPreviewList } from '../../../shared/components/AttachmentPreview'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { showToast } from '../../../shared/components/Toast'
import {
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPin,
  updateAnnouncement,
} from '../api/community.api'
import { useAnnouncements } from '../hooks/useAnnouncements'
import type { Announcement } from '../types/community.types'
import './AnnouncementsSection.css'
import { AnnouncementsSectionSkeleton } from './AnnouncementsSectionSkeleton'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

interface AnnouncementsSectionProps {
  courseId: string
  canManage: boolean
  /** Post to focus on (notification deep link). Scrolls it into view and
   *  flashes a highlight ring once the feed loads. */
  highlightPostId?: string
}

export function AnnouncementsSection({ courseId, canManage, highlightPostId }: AnnouncementsSectionProps) {
  const { data, isLoading, error, refetch } = useAnnouncements(courseId)
  const [isComposing, setIsComposing] = useState(false)
  const [content, setContent] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isLoading || !highlightPostId || data.length === 0) return
    const element = document.getElementById(`announcement-${highlightPostId}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [isLoading, highlightPostId, data])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!content.trim()) return
    setIsSubmitting(true)
    try {
      await createAnnouncement(courseId, content.trim(), attachment)
      setContent('')
      setAttachment(null)
      setIsComposing(false)
      showToast('تم نشر الإعلان', 'success')
      refetch()
    } catch {
      showToast('تعذر نشر الإعلان', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveEdit(postId: string) {
    if (!editContent.trim()) return
    setIsSubmitting(true)
    try {
      await updateAnnouncement(postId, editContent.trim())
      setEditingId(null)
      showToast('تم تحديث الإعلان', 'success')
      refetch()
    } catch {
      showToast('تعذر تحديث الإعلان', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!pendingDeleteId) return
    setIsSubmitting(true)
    try {
      await deleteAnnouncement(pendingDeleteId)
      setPendingDeleteId(null)
      showToast('تم حذف الإعلان', 'success')
      refetch()
    } catch {
      showToast('تعذر حذف الإعلان', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleTogglePin(postId: string) {
    try {
      await toggleAnnouncementPin(postId)
      refetch()
    } catch {
      showToast('تعذر تحديث التثبيت', 'error')
    }
  }

  if (isLoading) return <AnnouncementsSectionSkeleton />

  if (error) {
    return (
      <div style={{ marginBottom: 24 }}>
        <ErrorState onRetry={refetch} />
      </div>
    )
  }

  return (
    <section className="section" aria-label="إعلانات الدورة" style={{ marginBottom: 8 }}>
      <div className="section-head" style={{ flexWrap: 'wrap', gap: 10 }}>
        <h2>
          <span className="ms" style={{ verticalAlign: 'middle', marginInlineEnd: 6 }}>
            campaign
          </span>
          الإعلانات
        </h2>
        {canManage && !isComposing && (
          <button type="button" className="btn tonal" onClick={() => setIsComposing(true)}>
            <span className="ms">add</span>
            إعلان جديد
          </button>
        )}
      </div>

      {isComposing && (
        <form className="card" onSubmit={handleCreate} style={{ gap: 10, marginBottom: 16 }}>
          <div className="tf" style={{ marginBottom: 0 }}>
            <label htmlFor="new-announcement">نص الإعلان</label>
            <textarea
              id="new-announcement"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={3}
              maxLength={5000}
              disabled={isSubmitting}
              required
            />
          </div>
          <AttachmentPicker file={attachment} onChange={setAttachment} disabled={isSubmitting} />
          <div className="form-dialog-actions">
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                setIsComposing(false)
                setContent('')
                setAttachment(null)
              }}
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button type="submit" className="btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ النشر...' : 'نشر'}
            </button>
          </div>
        </form>
      )}

      {data.length === 0 ? (
        <EmptyState
          title="لا توجد إعلانات بعد"
          message="ستظهر إعلانات المدرس هنا عند نشرها"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {data.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isHighlighted={highlightPostId === announcement.id}
              isEditing={editingId === announcement.id}
              editContent={editContent}
              onStartEdit={() => {
                setEditingId(announcement.id)
                setEditContent(announcement.content)
              }}
              onEditChange={setEditContent}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => handleSaveEdit(announcement.id)}
              onDelete={() => setPendingDeleteId(announcement.id)}
              onTogglePin={() => handleTogglePin(announcement.id)}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="حذف الإعلان"
        message="هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </section>
  )
}

interface AnnouncementCardProps {
  announcement: Announcement
  isHighlighted?: boolean
  isEditing: boolean
  editContent: string
  onEditChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  isSubmitting: boolean
}

function AnnouncementCard({
  announcement,
  isHighlighted = false,
  isEditing,
  editContent,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onTogglePin,
  isSubmitting,
}: AnnouncementCardProps) {
  return (
    <div
      id={`announcement-${announcement.id}`}
      className={`card${announcement.isPinned ? ' announcement-pinned' : ''}${
        isHighlighted ? ' announcement-highlighted' : ''
      }`}
      style={{ gap: 8 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <span className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {announcement.isPinned && (
            <span className="ms" style={{ fontSize: 16, color: 'var(--primary)' }} aria-label="مثبت">
              push_pin
            </span>
          )}
          {formatDate(announcement.createdAt)}
        </span>
        {announcement.canManage && (
          <span style={{ display: 'flex', gap: 4 }}>
            <button type="button" className="icon-btn" onClick={onTogglePin} aria-label={announcement.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}>
              <span className="ms">{announcement.isPinned ? 'keep_off' : 'push_pin'}</span>
            </button>
            <button type="button" className="icon-btn" onClick={onStartEdit} aria-label="تعديل">
              <span className="ms">edit</span>
            </button>
            <button type="button" className="icon-btn" onClick={onDelete} aria-label="حذف">
              <span className="ms">delete</span>
            </button>
          </span>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={editContent}
            onChange={(event) => onEditChange(event.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          <div className="form-dialog-actions">
            <button type="button" className="btn outline" onClick={onCancelEdit} disabled={isSubmitting}>
              إلغاء
            </button>
            <button type="button" className="btn primary" onClick={onSaveEdit} disabled={isSubmitting}>
              حفظ
            </button>
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{announcement.content}</p>
      )}

      {announcement.attachments.length > 0 && (
        <div className="announcement-attachments" style={{ marginTop: 6 }}>
          <AttachmentPreviewList attachments={announcement.attachments} layout="vertical" />
        </div>
      )}
    </div>
  )
}
