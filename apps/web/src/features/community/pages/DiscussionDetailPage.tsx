import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { showToast } from '../../../shared/components/Toast'
import { sanitizeFilename } from '../../../shared/utils/sanitizeFilename'
import { useAuth } from '../../auth/hooks/useAuth'
import { emitUnreadCountChanged } from '../../notifications/utils/notificationEvents'
import {
  acceptAnswer,
  createReply,
  toggleHelpful,
  toggleThreadPin,
  unacceptAnswer,
} from '../api/community.api'
import { DiscussionDetailSkeleton } from '../components/DiscussionDetailSkeleton'
import { DiscussionReplyComposer } from '../components/DiscussionReplyComposer'
import { DiscussionReplyRow } from '../components/DiscussionReplyRow'
import { useDiscussion } from '../hooks/useDiscussion'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

function roleLabel(role: 'student' | 'teacher' | 'assistant' | 'admin'): string | null {
  if (role === 'teacher') return 'المدرس'
  if (role === 'assistant') return 'مساعد المدرس'
  return null
}

export function DiscussionDetailPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const { user } = useAuth()
  const { data, isLoading, error, refetch, setData } = useDiscussion(threadId ?? '')
  const [replyBody, setReplyBody] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [isTogglingHelpful, setIsTogglingHelpful] = useState(false)

  useEffect(() => {
    if (data) {
      emitUnreadCountChanged()
    }
  }, [data?.id])

  if (isLoading) return <DiscussionDetailSkeleton />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
    if (error.status === 404) return <NotFoundState />
    return <ErrorState onRetry={refetch} />
  }

  if (!data) return <NotFoundState />

  const coursePath =
    user?.role === 'student' ? `/student/courses/${data.courseId}` : `/teacher/courses/${data.courseId}`

  const authorRole = roleLabel(data.author.role)

  async function handleReply() {
    if (!replyBody.trim() || !threadId) return
    setIsReplying(true)
    try {
      await createReply(threadId, replyBody.trim())
      setReplyBody('')
      refetch()
    } catch {
      showToast('تعذر إرسال الرد', 'error')
    } finally {
      setIsReplying(false)
    }
  }

  async function handleToggleHelpful() {
    if (!threadId) return
    setIsTogglingHelpful(true)
    try {
      const result = await toggleHelpful(threadId)
      if (data) {
        setData({ ...data, isHelpfulByMe: result.isHelpfulByMe, helpfulCount: result.helpfulCount })
      }
    } catch {
      showToast('تعذر تحديث الإعجاب', 'error')
    } finally {
      setIsTogglingHelpful(false)
    }
  }

  async function handleAccept(replyId: string) {
    if (!threadId) return
    try {
      await acceptAnswer(threadId, replyId)
      showToast('تم اعتماد الإجابة', 'success')
      refetch()
    } catch {
      showToast('تعذر اعتماد الإجابة', 'error')
    }
  }

  async function handleUnaccept() {
    if (!threadId) return
    try {
      await unacceptAnswer(threadId)
      refetch()
    } catch {
      showToast('تعذر التراجع عن الاعتماد', 'error')
    }
  }

  async function handleTogglePin() {
    if (!threadId) return
    try {
      await toggleThreadPin(threadId)
      refetch()
    } catch {
      showToast('تعذر تحديث التثبيت', 'error')
    }
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 10 }}>
        <Link to={coursePath} className="btn tonal sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="ms sm" aria-hidden="true">arrow_forward</span>
          العودة للمجتمع
        </Link>
      </div>

      <div className="card discussion-question-card" style={{ gap: 8, marginBottom: 16 }}>
        <div className="support-card-top" style={{ alignItems: 'center' }}>
          <div className="support-card-meta">
            <span className={`chip ${data.isAnswered ? 'green' : 'outline'} sm`}>
              <span className="ms sm" aria-hidden="true">
                {data.isAnswered ? 'check_circle' : 'help'}
              </span>
              {data.isAnswered ? 'تمت الإجابة' : 'بدون إجابة'}
            </span>
            {data.isPinned && (
              <span className="chip outline sm">
                <span className="ms sm" style={{ color: 'var(--primary)' }} aria-hidden="true">
                  push_pin
                </span>
                مثبت
              </span>
            )}
          </div>
          <div className="discussion-author-badge">
            {data.author.avatarUrl ? (
              <span className="avatar" style={{ width: 20, height: 20 }}>
                <img src={data.author.avatarUrl} alt="" />
              </span>
            ) : (
              <span className="ms sm" aria-hidden="true">
                {authorRole ? 'verified_user' : 'account_circle'}
              </span>
            )}
            <span>{data.author.fullName}</span>
            {authorRole && <span className="chip sm primary">{authorRole}</span>}
          </div>
        </div>

        <p className="discussion-body-text" style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, margin: '6px 0 8px', overflowWrap: 'anywhere' }}>
          {data.body || data.title}
        </p>

        <div className="support-card-info" style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4 }}>
          <span className="support-card-info-item">
            <span className="ms sm" aria-hidden="true">schedule</span>
            {formatDate(data.createdAt)}
          </span>
        </div>

        {data.attachments.length > 0 && (
          <div className="discussion-attachments-list" style={{ marginTop: 4 }}>
            {data.attachments.map((file) => {
              const cleanName = sanitizeFilename(file.fileName)
              return (
                <a
                  key={file.id}
                  href={`/api/v1/attachments/${file.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-card"
                >
                  <span className="ms" aria-hidden="true">file_present</span>
                  <span className="attachment-card-name">{cleanName}</span>
                  <span className="ms sm" style={{ marginInlineStart: 'auto' }} aria-hidden="true">download</span>
                </a>
              )
            })}
          </div>
        )}

        {data.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {data.tags.map((tag) => (
              <span key={tag} className="chip outline sm">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="discussion-question-actions" style={{ marginTop: 6 }}>
          <button
            type="button"
            className={`btn outline sm${data.isHelpfulByMe ? ' active' : ''}`}
            onClick={handleToggleHelpful}
            disabled={isTogglingHelpful}
          >
            <span className="ms sm" aria-hidden="true">thumb_up</span>
            مفيد ({data.helpfulCount})
          </button>
          {data.canPin && (
            <button type="button" className="btn outline sm" onClick={handleTogglePin}>
              <span className="ms sm" aria-hidden="true">push_pin</span>
              {data.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
            </button>
          )}
        </div>
      </div>

      <div className="section-head" style={{ marginBottom: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>الردود ({data.replies.length})</h2>
        {data.canAccept && data.isAnswered && (
          <button type="button" className="btn outline sm" onClick={handleUnaccept} style={{ fontSize: 12, padding: '4px 10px' }}>
            التراجع عن الإجابة المعتمدة
          </button>
        )}
      </div>

      {data.replies.length > 0 && (
        <div className="discussion-reply-list">
          {data.replies.map((reply) => (
            <DiscussionReplyRow
              key={reply.id}
              reply={reply}
              canAccept={data.canAccept}
              onAccept={handleAccept}
            />
          ))}
        </div>
      )}

      <DiscussionReplyComposer
        value={replyBody}
        onChange={setReplyBody}
        onSubmit={handleReply}
        isSubmitting={isReplying}
      />
    </div>
  )
}

