import '../../support/components/SupportChat.css'
import type { DiscussionReply } from '../types/community.types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

function roleTag(reply: DiscussionReply): { label: string; className: string } | null {
  if (reply.author.role === 'teacher') return { label: 'المدرس', className: 'support-tag' }
  if (reply.author.role === 'assistant') return { label: 'مساعد المدرس', className: 'support-tag' }
  return { label: 'الطالب', className: 'student-tag' }
}

export interface DiscussionReplyRowProps {
  reply: DiscussionReply
  canAccept?: boolean
  isMe?: boolean
  onAccept?: (replyId: string) => void
  onUnaccept?: (replyId: string) => void
}

export function DiscussionReplyRow({
  reply,
  canAccept = false,
  isMe = false,
  onAccept,
  onUnaccept,
}: DiscussionReplyRowProps) {
  const variant = isMe ? 'student' : 'support'
  const tag = roleTag(reply)
  const isTeacherReply = reply.author.role === 'teacher' || reply.author.role === 'assistant'

  return (
    <div className={`chat-msg-group from-${variant}`}>
      <div className="chat-msg-group-label">
        {reply.isUnread && <span className="unread-dot" aria-label="غير مقروء" />}
        <span className="chat-msg-avatar" aria-hidden="true">
          {reply.author.avatarUrl ? (
            <img src={reply.author.avatarUrl} alt="" />
          ) : (
            <span className="ms">{isTeacherReply ? 'verified_user' : 'person'}</span>
          )}
        </span>
        <span className="chat-msg-author-name">{reply.author.fullName}</span>
        {tag && <span className={`chat-role-tag ${tag.className}`}>{tag.label}</span>}
        {reply.isAccepted && (
          <span className="chip green sm">
            <span className="ms sm" aria-hidden="true">
              check_circle
            </span>
            إجابة مقبولة
          </span>
        )}
        {reply.isAccepted ? (
          canAccept &&
          onUnaccept && (
            <button
              type="button"
              className="btn outline sm"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => onUnaccept(reply.id)}
            >
              إلغاء الاعتماد
            </button>
          )
        ) : (
          canAccept &&
          onAccept && (
            <button
              type="button"
              className="btn outline sm"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => onAccept(reply.id)}
            >
              اعتماد كإجابة
            </button>
          )
        )}
      </div>
      <div className={`chat-msg from-${variant}${reply.isUnread ? ' is-unread' : ''}`}>
        <p>{reply.body}</p>
        <div className="chat-msg-meta">
          <span className="chat-msg-time">{formatDate(reply.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
