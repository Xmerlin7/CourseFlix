import type { DiscussionReply } from '../types/community.types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

function roleLabel(role: DiscussionReply['author']['role']): string | null {
  if (role === 'teacher') return 'المدرس'
  if (role === 'assistant') return 'مساعد المدرس'
  return null
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
  const isTeacherReply = reply.author.role === 'teacher' || reply.author.role === 'assistant'
  const authorRole = roleLabel(reply.author.role)

  return (
    <div
      className={`discussion-reply-row${reply.isUnread ? ' unread' : ''}${reply.isAccepted ? ' discussion-reply-row--accepted' : ''}${isTeacherReply ? ' discussion-reply-row--teacher' : ''}${isMe ? ' discussion-reply-row--me' : ' discussion-reply-row--other'}`}
    >
      {!isMe && (
        <div className="discussion-reply-avatar-col">
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
        </div>
      )}

      <div className="discussion-reply-bubble">
        <div className="discussion-reply-header">
          <div className="discussion-reply-author">
            {reply.isUnread && <span className="unread-dot" aria-label="غير مقروء" />}
            <span className="discussion-reply-author-name">{reply.author.fullName}</span>
            {authorRole && (
              <span className="chip sm primary discussion-reply-role-chip">{authorRole}</span>
            )}
          </div>

          <div className="discussion-reply-badge-action">
            {reply.isAccepted ? (
              <>
                <span className="chip green sm">
                  <span className="ms sm" aria-hidden="true">check_circle</span>
                  إجابة مقبولة
                </span>
                {canAccept && onUnaccept && (
                  <button
                    type="button"
                    className="btn outline sm"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => onUnaccept(reply.id)}
                  >
                    إلغاء الاعتماد
                  </button>
                )}
              </>
            ) : (
              canAccept && onAccept && (
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
        </div>

        <p className="discussion-reply-body">{reply.body}</p>

        <div className="discussion-reply-footer">
          <span className="discussion-reply-time">
            <span className="ms sm" aria-hidden="true">schedule</span>
            {formatDate(reply.createdAt)}
          </span>
        </div>
      </div>

      {isMe && (
        <div className="discussion-reply-avatar-col">
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
        </div>
      )}
    </div>
  )
}

