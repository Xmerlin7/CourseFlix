import { Link } from 'react-router'
import { CourseThumb } from '../../courses/components/CourseThumb'
import type { StudentCommunitySummaryItem } from '../../student/types/student.types'

export function formatActivityTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'أمس'
  }

  const daysSince = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (daysSince >= 0 && daysSince < 7) {
    return date.toLocaleDateString('ar-EG', { weekday: 'long' })
  }

  return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
}

export interface CommunityCourseRowProps {
  courseId: string
  title: string
  to: string
  coverImageUrl?: string | null
  gradeLevel?: string | null
  summary?: StudentCommunitySummaryItem
  isUnavailable?: boolean
}

export function CommunityCourseRow({
  title,
  to,
  coverImageUrl,
  gradeLevel,
  summary,
  isUnavailable = false,
}: CommunityCourseRowProps) {
  if (isUnavailable) {
    return (
      <div className="community-row community-row--locked" role="group" aria-label="الدورة غير متاحة">
        <div className="community-row-avatar community-row-avatar--locked">
          <span className="ms" aria-hidden="true">lock</span>
        </div>

        <div className="community-row-main">
          <div className="community-row-line1">
            <span className="community-row-title">الدورة غير متاحة</span>
          </div>
          <div className="community-row-line3">
            <span className="community-row-preview">لا يمكنك الوصول إلى مجتمع هذه الدورة حاليًا</span>
          </div>
        </div>
      </div>
    )
  }

  const unreadCount = summary?.unreadCount ?? 0
  const isUnread = unreadCount > 0
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <Link
      to={to}
      className={`community-row${isUnread ? ' unread' : ''}`}
    >
      <div className="community-row-avatar">
        <CourseThumb coverImageUrl={coverImageUrl ?? null} alt={title} />
      </div>

      <div className="community-row-main">
        {/* Line 1: Course title + timestamp */}
        <div className="community-row-line1">
          <span className="community-row-title">{title}</span>
          {summary?.lastActivityAt && (
            <span className="community-row-time">{formatActivityTime(summary.lastActivityAt)}</span>
          )}
        </div>

        {/* Line 2: Grade level + unread count badge */}
        <div className="community-row-line2">
          <span className="community-row-grade">{gradeLevel ?? ''}</span>
          {isUnread && <span className="community-row-badge">{badgeLabel}</span>}
        </div>

        {/* Line 3: Latest message preview */}
        {summary?.preview && (
          <div className="community-row-line3">
            <span className="community-row-preview">{summary.preview}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
