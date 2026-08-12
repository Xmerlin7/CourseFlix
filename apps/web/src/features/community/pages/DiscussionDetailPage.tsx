import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { showToast } from '../../../shared/components/Toast'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  acceptAnswer,
  createReply,
  toggleHelpful,
  toggleThreadPin,
  unacceptAnswer,
} from '../api/community.api'
import { useDiscussion } from '../hooks/useDiscussion'
import type { DiscussionReply } from '../types/community.types'
import { DiscussionDetailSkeleton } from '../components/DiscussionDetailSkeleton'

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
    <div>
      <Link to={coursePath} className="meta-link">
        <span className="ms">arrow_back</span>
        الرجوع للمجتمع
      </Link>

      <div className="card" style={{ gap: 10, marginTop: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {data.isPinned && (
              <span className="ms" style={{ color: 'var(--primary)' }} aria-label="مثبت">
                push_pin
              </span>
            )}
            {data.title}
          </h1>
          <span className={`chip${data.isAnswered ? ' green' : ''}`}>
            {data.isAnswered ? 'تمت الإجابة' : 'بدون إجابة'}
          </span>
        </div>

        <span className="meta">
          {data.author.fullName} · {formatDate(data.createdAt)}
        </span>

        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{data.body}</p>

        {data.attachments.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.attachments.map((file) => (
              <span key={file.id} className="chip outline">
                <span className="ms" style={{ fontSize: 14 }}>
                  attach_file
                </span>
                {file.fileName}
              </span>
            ))}
          </div>
        )}

        {data.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.tags.map((tag) => (
              <span key={tag} className="chip outline">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <button
            type="button"
            className={`btn outline${data.isHelpfulByMe ? ' active' : ''}`}
            onClick={handleToggleHelpful}
            disabled={isTogglingHelpful}
          >
            <span className="ms">thumb_up</span>
            مفيد ({data.helpfulCount})
          </button>
          {data.canPin && (
            <button type="button" className="btn outline" onClick={handleTogglePin}>
              <span className="ms">push_pin</span>
              {data.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
            </button>
          )}
        </div>
      </div>

      <h2>الردود ({data.replies.length})</h2>

      {data.replies.length === 0 ? (
        <p className="subtitle">لا يوجد ردود بعد. كن أول من يرد.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {data.replies.map((reply) => (
            <div
              key={reply.id}
              className={`card${reply.isAccepted ? ' announcement-pinned' : ''}`}
              style={{ gap: 6 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {reply.author.fullName}
                  {roleLabel(reply.author.role) && (
                    <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                      <span className="ms" style={{ fontSize: 13 }}>
                        verified
                      </span>
                      {roleLabel(reply.author.role)}
                    </span>
                  )}
                  {' · '}
                  {formatDate(reply.createdAt)}
                </span>

                {reply.isAccepted ? (
                  <span className="chip green">
                    <span className="ms">check_circle</span>
                    إجابة مقبولة
                  </span>
                ) : (
                  data.canAccept && (
                    <button type="button" className="btn outline" onClick={() => handleAccept(reply.id)}>
                      اعتماد كإجابة
                    </button>
                  )
                )}
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      {data.canAccept && data.isAnswered && (
        <button type="button" className="btn outline" onClick={handleUnaccept} style={{ marginBottom: 20 }}>
          التراجع عن الإجابة المعتمدة
        </button>
      )}

      <form onSubmit={handleReply} className="card" style={{ gap: 10 }}>
        <div className="tf" style={{ marginBottom: 0 }}>
          <label htmlFor="reply-body">اكتب ردًا</label>
          <textarea
            id="reply-body"
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            rows={3}
            maxLength={10000}
            disabled={isReplying}
            required
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn primary" disabled={isReplying}>
            {isReplying && <span className="ms spin">progress_activity</span>}
            {isReplying ? 'جارٍ الإرسال...' : 'إرسال الرد'}
          </button>
        </div>
      </form>
    </div>
  )
}
