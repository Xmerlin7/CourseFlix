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
  return (
    <Link to={to} className="list-item discussion-card">
      <span className="lead">
        <span className="ms">{thread.isAnswered ? 'check_circle' : 'help'}</span>
      </span>
      <span className="body">
        <span className="t" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {thread.isPinned && (
            <span className="ms" style={{ fontSize: 16 }} aria-label="مثبت">
              push_pin
            </span>
          )}
          {thread.title}
        </span>
        <span className="s">
          {thread.author.fullName}
          {thread.author.role === 'teacher' || thread.author.role === 'assistant' ? (
            <span className="chip" style={{ marginInlineStart: 6, fontSize: 11, padding: '2px 8px' }}>
              المدرس
            </span>
          ) : null}
          {' · '}
          {formatDate(thread.createdAt)}
        </span>
        {thread.tags.length > 0 && (
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {thread.tags.map((tag) => (
              <span key={tag} className="chip outline" style={{ fontSize: 11, padding: '2px 8px' }}>
                #{tag}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span className={`chip${thread.isAnswered ? ' green' : ''}`}>
          {thread.isAnswered ? 'تمت الإجابة' : 'بدون إجابة'}
        </span>
        <span className="meta" style={{ display: 'flex', gap: 10 }}>
          <span>
            <span className="ms" style={{ fontSize: 14, verticalAlign: 'middle' }}>
              forum
            </span>{' '}
            {thread.replyCount}
          </span>
          <span>
            <span className="ms" style={{ fontSize: 14, verticalAlign: 'middle' }}>
              thumb_up
            </span>{' '}
            {thread.helpfulCount}
          </span>
        </span>
      </span>
    </Link>
  )
}
