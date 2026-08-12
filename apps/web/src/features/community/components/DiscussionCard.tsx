import { Link } from 'react-router'
import type { DiscussionThreadListItem } from '../types/community.types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

interface DiscussionCardProps {
  thread: DiscussionThreadListItem
  to: string
}

export function DiscussionCard({ thread, to }: DiscussionCardProps) {
  const isTeacher = thread.author.role === 'teacher' || thread.author.role === 'assistant'

  return (
    <Link to={to} className="card support-ticket-card lift discussion-card">
      <div className="support-card-top">
        <div className="support-card-meta">
          <span className={`chip ${thread.isAnswered ? 'green' : 'outline'} sm`}>
            <span className="ms sm" aria-hidden="true">
              {thread.isAnswered ? 'check_circle' : 'help'}
            </span>
            {thread.isAnswered ? 'تمت الإجابة' : 'بدون إجابة'}
          </span>
          {thread.isPinned && (
            <span className="chip outline sm">
              <span className="ms sm" style={{ color: 'var(--primary)' }} aria-hidden="true">
                push_pin
              </span>
              مثبت
            </span>
          )}
        </div>
        <div className="discussion-author-badge">
          <span className="ms sm" aria-hidden="true">
            {isTeacher ? 'verified_user' : 'account_circle'}
          </span>
          <span>{thread.author.fullName}</span>
          {isTeacher && <span className="chip sm primary">المدرس</span>}
        </div>
      </div>

      <h3 className="support-card-title">{thread.title}</h3>

      {thread.tags.length > 0 && (
        <div className="discussion-card-tags" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {thread.tags.map((tag) => (
            <span key={tag} className="chip outline sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="support-card-footer">
        <div className="support-card-info">
          <span className="support-card-info-item">
            <span className="ms sm" aria-hidden="true">forum</span>
            {thread.replyCount} {thread.replyCount === 1 ? 'رد' : 'ردود'}
          </span>
          {thread.helpfulCount > 0 && (
            <span className="support-card-info-item">
              <span className="ms sm" aria-hidden="true">thumb_up</span>
              {thread.helpfulCount} مفيد
            </span>
          )}
          <span className="support-card-info-item">
            <span className="ms sm" aria-hidden="true">schedule</span>
            {formatDate(thread.createdAt)}
          </span>
        </div>
        <span className="ms support-card-arrow" aria-hidden="true">
          arrow_forward
        </span>
      </div>
    </Link>
  )
}

