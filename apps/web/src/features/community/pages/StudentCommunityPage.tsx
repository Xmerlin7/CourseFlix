import { useCallback } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { useStudentEnrollments } from '../../student/hooks/useStudentEnrollments'
import { useStudentCommunitySummary } from '../../student/hooks/useStudentCommunitySummary'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { StudentCommunitySkeleton } from '../components/StudentCommunitySkeleton'
import type {
  StudentCommunitySummaryItem,
  StudentEnrollment,
} from '../../student/types/student.types'

function buildCommunityPath(courseId: string): string {
  return ROUTE_PATHS.STUDENT.COMMUNITY_COURSE.replace(':courseId', courseId)
}

// WhatsApp-style relative stamp: time for today, "أمس" for yesterday, the
// weekday name within the last week, and a short date beyond that.
function formatActivityTime(iso: string): string {
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

const PAGE_SIZE = 10

export function StudentCommunityPage() {
  const { data: enrollments, isLoading, error, refetch } = useStudentEnrollments()
  const { data: summaries } = useStudentCommunitySummary()

  const toHaystack = useCallback(
    (enrollment: StudentEnrollment) => enrollment.courseTitle ?? '',
    [],
  )

  const summaryByCourseId = new Map(summaries.map((item) => [item.courseId, item]))

  const courses = (enrollments ?? [])
    .filter((enrollment) => enrollment.status === 'active' || enrollment.status === 'completed')
    // Ordering hierarchy:
    // 1. Courses with unread activity (highest unread count first)
    // 2. Courses with recent activity (most recent first)
    // 3. Inactive courses
    .sort((a, b) => {
      const aSum = summaryByCourseId.get(a.courseId)
      const bSum = summaryByCourseId.get(b.courseId)
      const aUnread = aSum?.unreadCount ?? 0
      const bUnread = bSum?.unreadCount ?? 0
      if (aUnread > 0 && bUnread === 0) return -1
      if (bUnread > 0 && aUnread === 0) return 1
      if (aUnread > 0 && bUnread > 0 && aUnread !== bUnread) {
        return bUnread - aUnread
      }
      const aTime = aSum?.lastActivityAt
      const bTime = bSum?.lastActivityAt
      if (aTime && bTime) return bTime.localeCompare(aTime)
      if (aTime) return -1
      if (bTime) return 1
      return 0
    })

  // Declared after `courses` because it paginates that list, but the
  // hook still has to run before the loading early-return below — React
  // forbids a conditional hook call.
  const list = usePaginatedList(courses, toHaystack, PAGE_SIZE)

  if (isLoading) return <StudentCommunitySkeleton />

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1 className="page-title">المجتمع</h1>
        <p className="community-page-subtitle">
          تواصل مع زملائك في كل دورة وشارك الأسئلة والمناقشات
        </p>
      </div>

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : courses.length === 0 ? (
        <div className="community-empty">
          <span className="ms" aria-hidden="true">groups</span>
          <p className="community-empty-title">لا توجد مجتمعات متاحة</p>
          <p className="community-empty-message">اشترك في دورة للانضمام إلى مجتمعها</p>
        </div>
      ) : (
        <>
          <SearchField
            id="community-search"
            label="بحث عن دورة"
            placeholder="ابحث باسم الدورة..."
            value={list.query}
            onChange={list.search}
          />

          {list.pageItems.length === 0 ? (
            <p className="community-no-results">مفيش دورات مطابقة لبحثك.</p>
          ) : (
            <div className="community-list">
              {list.pageItems.map((enrollment) =>
                enrollment.courseTitle ? (
                  <CommunityCourseRow
                    key={enrollment.courseId}
                    enrollment={enrollment}
                    summary={summaryByCourseId.get(enrollment.courseId)}
                  />
                ) : (
                  <CommunityCourseUnavailableRow key={enrollment.courseId} />
                ),
              )}
            </div>
          )}

          {list.hasPages && (
            <Pagination
              page={list.page}
              totalPages={list.totalPages}
              onPageChange={list.setPage}
              matchCount={list.matchCount}
              pageSize={PAGE_SIZE}
              itemLabel="دورة"
            />
          )}
        </>
      )}
    </div>
  )
}

function CommunityCourseRow({
  enrollment,
  summary,
}: {
  enrollment: StudentEnrollment
  summary?: StudentCommunitySummaryItem
}) {
  const unreadCount = summary?.unreadCount ?? 0
  const isUnread = unreadCount > 0
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <Link
      to={buildCommunityPath(enrollment.courseId)}
      className={`community-row${isUnread ? ' unread' : ''}`}
    >
      <div className="community-row-avatar">
        <CourseThumb coverImageUrl={enrollment.coverImageUrl} alt={enrollment.courseTitle ?? ''} />
      </div>

      <div className="community-row-main">
        {/* Line 1: course name + timestamp */}
        <div className="community-row-line1">
          <span className="community-row-title">{enrollment.courseTitle}</span>
          {summary?.lastActivityAt && (
            <span className="community-row-time">{formatActivityTime(summary.lastActivityAt)}</span>
          )}
        </div>

        {/* Line 2: grade + unread badge */}
        <div className="community-row-line2">
          <span className="community-row-grade">{enrollment.gradeLevel ?? ''}</span>
          {isUnread && <span className="community-row-badge">{badgeLabel}</span>}
        </div>

        {/* Line 3: latest message preview */}
        {summary?.preview && (
          <div className="community-row-line3">
            <span className="community-row-preview">{summary.preview}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

// A soft-deleted course still has an enrollment row (see StudentEnrollment's
// courseTitle doc comment) — shown as a locked, non-clickable row instead
// of a normal row with a blank/fallback title, so the student can tell at
// a glance this one can't be entered rather than hitting a dead link.
function CommunityCourseUnavailableRow() {
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
