import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { showToast } from '../../../shared/components/Toast'
import { sanitizeFilename } from '../../../shared/utils/sanitizeFilename'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  acceptAnswer,
  createReply,
  toggleHelpful,
  toggleThreadPin,
  unacceptAnswer,
} from '../api/community.api'
import { DiscussionDetailSkeleton } from '../components/DiscussionDetailSkeleton'
import { useDiscussion } from '../hooks/useDiscussion'
import type { DiscussionReply } from '../types/community.types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

function roleLabel(role: DiscussionReply['author']['role']): string | null {
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

  if (isLoading) return <DiscussionDetailSkeleton />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
    if (error.status === 404) return <NotFoundState />
    return <ErrorState onRetry={refetch} />
  }

  if (!data) return <NotFoundState />

  const coursePath =
    user?.role === 'student' ? `/student/courses/${data.courseId}` : `/teacher/courses/${data.courseId}`

  async function handleReply(event: React.FormEvent) {
    event.preventDefault()
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
    <div style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to={coursePath} className="btn tonal sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="ms sm" aria-hidden="true">arrow_forward</span>
          العودة للمجتمع
        </Link>
      </div>

      <div className="card discussion-question-card" style={{ gap: 10, marginBottom: 20 }}>
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
              <span className="ms sm" aria-hidden="true">account_circle</span>
            )}
            <span>{data.author.fullName}</span>
            {data.author.role === 'teacher' && <span className="chip sm primary">المدرس</span>}
          </div>
        </div>

        <h1 className="page-title" style={{ fontSize: 21, margin: 0, overflowWrap: 'anywhere' }}>
          {data.title}
        </h1>

        <div className="support-card-info" style={{ fontSize: 12.5, color: 'var(--on-surface-variant)' }}>
          <span className="support-card-info-item">
            <span className="ms sm" aria-hidden="true">schedule</span>
            {formatDate(data.createdAt)}
          </span>
        </div>

        <p className="discussion-body-text">{data.body}</p>

        {data.attachments.length > 0 && (
          <div className="discussion-attachments-list">
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
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.tags.map((tag) => (
              <span key={tag} className="chip outline sm">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="discussion-question-actions">
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

      <div className="section-head" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>الردود ({data.replies.length})</h2>
      </div>

      {data.replies.length === 0 ? (
        <EmptyState
          title="لا توجد ردود بعد"
          message="كن أول من يجيب على هذا السؤال."
        />
      ) : (
        <div className="discussion-reply-list">
          {data.replies.map((reply) => {
            const isTeacherReply = reply.author.role === 'teacher' || reply.author.role === 'assistant'
            return (
              <div
                key={reply.id}
                className={`discussion-reply-row${reply.isAccepted ? ' discussion-reply-row--accepted' : ''}${isTeacherReply ? ' discussion-reply-row--teacher' : ''}`}
              >
                <div className="discussion-reply-header">
                  <div className="discussion-reply-author">
                    {reply.author.avatarUrl ? (
                      <span className="avatar discussion-reply-avatar">
                        <img src={reply.author.avatarUrl} alt="" />
                      </span>
                    ) : (
                      <span className="discussion-reply-avatar-placeholder">
                        <span className="ms sm" aria-hidden="true">
                          {isTeacherReply ? 'verified_user' : 'account_circle'}
                        </span>
                      </span>
                    )}
                    <span className="discussion-reply-author-name">{reply.author.fullName}</span>
                    {roleLabel(reply.author.role) && (
                      <span className="chip sm primary discussion-reply-role-chip">{roleLabel(reply.author.role)}</span>
                    )}
                    <span className="discussion-reply-time">
                      <span className="ms sm" aria-hidden="true">schedule</span>
                      {formatDate(reply.createdAt)}
                    </span>
                  </div>

                  <div className="discussion-reply-badge-action">
                    {reply.isAccepted ? (
                      <span className="chip green sm">
                        <span className="ms sm" aria-hidden="true">check_circle</span>
                        إجابة مقبولة
                      </span>
                    ) : (
                      data.canAccept && (
                        <button type="button" className="btn outline sm" onClick={() => handleAccept(reply.id)}>
                          اعتماد كإجابة
                        </button>
                      )
                    )}
                  </div>
                </div>

                <p className="discussion-reply-body">{reply.body}</p>
              </div>
            )
          })}
        </div>
      )}

      {data.canAccept && data.isAnswered && (
        <div style={{ marginBottom: 24 }}>
          <button type="button" className="btn outline sm" onClick={handleUnaccept}>
            التراجع عن الإجابة المعتمدة
          </button>
        </div>
      )}

      <form onSubmit={handleReply} className="card discussion-reply-composer" style={{ gap: 12 }}>
        <div className="tf" style={{ marginBottom: 0 }}>
          <label htmlFor="reply-body" style={{ fontWeight: 600, fontSize: 14 }}>اكتب ردًا...</label>
          <textarea
            id="reply-body"
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            placeholder="اكتب توضيحك أو إجابتك هنا..."
            rows={3}
            maxLength={10000}
            disabled={isReplying}
            required
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn primary" disabled={isReplying || !replyBody.trim()}>
            {isReplying && <span className="ms spin" aria-hidden="true">progress_activity</span>}
            {isReplying ? 'جارٍ الإرسال...' : 'إرسال الرد'}
          </button>
        </div>
      </form>
    </div>
  )
}

