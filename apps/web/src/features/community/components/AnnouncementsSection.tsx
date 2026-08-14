import { useState } from 'react'
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

interface ParsedAnnouncement {
  isStructured: boolean
  studentName?: string
  metaItems: { label: string; value: string }[]
  rankHighlight?: {
    rank: string
    title: string
    totalSubtitle?: string
  }
  remainingText: string
}

const KNOWN_META_KEYS = [
  'اسم الطالب',
  'الطالب',
  'حالة الطلب',
  'حالة الطالب',
  'الحالة',
  'نوع التعليم',
  'الشعبة',
  'رقم الجلوس',
  'الجلوس',
  'المدرسة',
  'الدرجة',
  'النسبة',
  'المحافظة',
  'الفرقة',
  'المجموع',
]

function parseAnnouncementContent(rawText: string): ParsedAnnouncement {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
  const metaItems: { label: string; value: string }[] = []
  let studentName: string | undefined
  let rankHighlight: { rank: string; title: string; totalSubtitle?: string } | undefined
  const otherLines: string[] = []

  for (const line of lines) {
    // Check for rank patterns like: "#200,908" or "ترتيبك العام على الجمهورية: #200,908 من 914,945 طالب"
    const rankMatch = line.match(/(?:ترتيبك\s*(?:العام)?(?:\s*على\s*الجمهورية)?[:\s]*)?(#[\d,]+|المركز\s*[\d,]+)(?:\s*من\s*([\d,]+(?:\s*طالب)?))?/i)
    if (rankMatch && (rankMatch[1].startsWith('#') || line.includes('ترتيب') || line.includes('الجمهورية'))) {
      const rank = rankMatch[1].startsWith('#') ? rankMatch[1] : `#${rankMatch[1].replace(/\D+/g, '')}`
      const totalSubtitle = rankMatch[2] ? `من ${rankMatch[2].includes('طالب') ? rankMatch[2] : `${rankMatch[2]} طالب`}` : undefined
      rankHighlight = {
        rank,
        title: line.includes('الجمهورية') ? 'ترتيبك العام على الجمهورية' : 'الترتيب العام',
        totalSubtitle,
      }
      continue
    }

    // Check for "من 914,945 طالب" standing alone as next line after a rank
    if (rankHighlight && !rankHighlight.totalSubtitle && line.startsWith('من ') && line.includes('طالب')) {
      rankHighlight.totalSubtitle = line
      continue
    }

    // Check for known key: value metadata patterns (e.g. "اسم الطالب: أحمد", "الشعبة: علمي علوم")
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0 && colonIndex < 35) {
      const rawLabel = line.substring(0, colonIndex).trim()
      const rawVal = line.substring(colonIndex + 1).trim()

      const isKnownKey = KNOWN_META_KEYS.some((k) => rawLabel === k || rawLabel.includes(k))

      if (isKnownKey && rawVal) {
        if (rawLabel.includes('اسم الطالب') || rawLabel === 'الطالب') {
          studentName = rawVal
        } else {
          metaItems.push({ label: rawLabel, value: rawVal })
        }
        continue
      }
    }

    otherLines.push(line)
  }

  // Sort metadata according to defined hierarchy
  metaItems.sort((a, b) => {
    const idxA = KNOWN_META_KEYS.findIndex((h) => a.label.includes(h))
    const idxB = KNOWN_META_KEYS.findIndex((h) => b.label.includes(h))
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
  })

  const isStructured = Boolean(studentName || metaItems.length > 0 || rankHighlight)

  return {
    isStructured,
    studentName,
    metaItems,
    rankHighlight,
    remainingText: otherLines.join('\n'),
  }
}

interface AnnouncementsSectionProps {
  courseId: string
  canManage: boolean
}

export function AnnouncementsSection({ courseId, canManage }: AnnouncementsSectionProps) {
  const { data, isLoading, error, refetch } = useAnnouncements(courseId)
  const [isComposing, setIsComposing] = useState(false)
  const [content, setContent] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    <section className="section announcements-wrapper" aria-label="إعلانات الدورة">
      <div className="announcements-head-card">
        <h2 className="announcements-head-title">
          <span className="announcements-head-icon" aria-hidden="true">
            <span className="ms">campaign</span>
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
        <form className="announcement-compose-card" onSubmit={handleCreate}>
          <div className="tf" style={{ marginBottom: 0 }}>
            <label htmlFor="new-announcement">نص الإعلان</label>
            <textarea
              id="new-announcement"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="اكتب الإعلان هنا..."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
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
  const parsed = parseAnnouncementContent(announcement.content)

  return (
    <div className={`announcement-card-modern${announcement.isPinned ? ' is-pinned' : ''}`}>
      <div className="announcement-top-bar">
        <div className="announcement-meta-left">
          {announcement.isPinned && (
            <span className="announcement-pin-badge">
              <span className="ms" aria-hidden="true">push_pin</span>
              مثبت
            </span>
          )}
          <span className="announcement-date-chip">
            <span className="ms" aria-hidden="true">schedule</span>
            {formatDate(announcement.createdAt)}
          </span>
        </div>

        {announcement.canManage && (
          <div className="announcement-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={onTogglePin}
              title={announcement.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
              aria-label={announcement.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
            >
              <span className="ms">{announcement.isPinned ? 'keep_off' : 'push_pin'}</span>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={onStartEdit}
              title="تعديل"
              aria-label="تعديل"
            >
              <span className="ms">edit</span>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={onDelete}
              title="حذف"
              aria-label="حذف"
            >
              <span className="ms">delete</span>
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="announcement-edit-box">
          <textarea
            value={editContent}
            onChange={(event) => onEditChange(event.target.value)}
            rows={3}
            disabled={isSubmitting}
            className="tf"
            style={{ width: '100%', marginBottom: 0 }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {parsed.studentName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ms" style={{ color: 'var(--primary)', fontSize: 20 }}>person</span>
              <strong style={{ fontSize: 16, color: 'var(--on-surface)' }}>{parsed.studentName}</strong>
            </div>
          )}

          {parsed.metaItems.length > 0 && (
            <div className="announcement-info-grid">
              {parsed.metaItems.map((item, idx) => (
                <div key={idx} className="announcement-info-item">
                  <span className="announcement-info-label">{item.label}</span>
                  <span className="announcement-info-value">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {parsed.rankHighlight && (
            <div className="announcement-hero-stat">
              <div className="announcement-hero-stat-left">
                <div className="announcement-hero-icon-circle" aria-hidden="true">
                  <span className="ms">workspace_premium</span>
                </div>
                <div className="announcement-hero-text">
                  <span className="announcement-hero-title">{parsed.rankHighlight.title}</span>
                  {parsed.rankHighlight.totalSubtitle && (
                    <span className="announcement-hero-subtitle">{parsed.rankHighlight.totalSubtitle}</span>
                  )}
                </div>
              </div>

              <div className="announcement-hero-rank-display">
                <span className="announcement-hero-rank-number">{parsed.rankHighlight.rank}</span>
                {parsed.rankHighlight.totalSubtitle && (
                  <span className="announcement-hero-rank-total">{parsed.rankHighlight.totalSubtitle}</span>
                )}
              </div>
            </div>
          )}

          {parsed.remainingText && (
            <p className="announcement-body-text">{parsed.remainingText}</p>
          )}
        </div>
      )}

      {announcement.attachments.length > 0 && (
        <div className="announcement-attachments" style={{ marginTop: 4 }}>
          <AttachmentPreviewList attachments={announcement.attachments} layout="vertical" />
        </div>
      )}
    </div>
  )
}
