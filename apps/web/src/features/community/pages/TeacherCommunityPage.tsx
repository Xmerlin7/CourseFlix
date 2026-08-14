import { useCallback } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses'
import { useStudentCommunitySummary } from '../../student/hooks/useStudentCommunitySummary'
import type { StudentCommunitySummaryItem } from '../../student/types/student.types'
import type { TeacherCourse } from '../../teacher/types/teacher.types'
import { StudentCommunitySkeleton } from '../components/StudentCommunitySkeleton'

const PAGE_SIZE = 10

function buildCommunityPath(courseId: string): string {
  return ROUTE_PATHS.TEACHER.COMMUNITY_COURSE.replace(':courseId', courseId)
}

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

export function TeacherCommunityPage() {
  const { data: coursesData, isLoading, error, refetch } = useTeacherCourses()
  const { data: summaries } = useStudentCommunitySummary()

  const toHaystack = useCallback((course: TeacherCourse) => course.title, [])

  const summaryByCourseId = new Map((summaries ?? []).map((item) => [item.courseId, item]))

  const sortedCourses = (coursesData ?? [])
    .sort((a, b) => {
      const aSum = summaryByCourseId.get(a.id)
      const bSum = summaryByCourseId.get(b.id)
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

  const list = usePaginatedList(sortedCourses, toHaystack, PAGE_SIZE)

  if (isLoading) return <StudentCommunitySkeleton />

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1 className="page-title">المجتمع</h1>
        <p className="community-page-subtitle">
          تابع مناقشات دوراتك وانشر الإعلانات من مكان واحد
        </p>
      </div>

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : sortedCourses.length === 0 ? (
        <div className="community-empty">
          <span className="ms" aria-hidden="true">groups</span>
          <p className="community-empty-title">لا توجد مجتمعات متاحة</p>
          <p className="community-empty-message">أنشئ دورة أو انشرها ليظهر مجتمعها هنا</p>
        </div>
      ) : (
        <>
          <SearchField
            id="teacher-community-search"
            label="بحث عن دورة"
            placeholder="ابحث باسم الدورة..."
            value={list.query}
            onChange={list.search}
          />

          {list.pageItems.length === 0 ? (
            <p className="community-no-results">مفيش دورات مطابقة لبحثك.</p>
          ) : (
            <div className="community-list">
              {list.pageItems.map((course) => (
                <TeacherCommunityCourseRow
                  key={course.id}
                  course={course}
                  summary={summaryByCourseId.get(course.id)}
                />
              ))}
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

function TeacherCommunityCourseRow({
  course,
  summary,
}: {
  course: TeacherCourse
  summary?: StudentCommunitySummaryItem
}) {
  const unreadCount = summary?.unreadCount ?? 0
  const isUnread = unreadCount > 0
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <Link
      to={buildCommunityPath(course.id)}
      className={`community-row${isUnread ? ' unread' : ''}`}
    >
      <div className="community-row-avatar">
        <CourseThumb coverImageUrl={course.coverImageUrl} alt={course.title} />
      </div>

      <div className="community-row-main">
        {/* Line 1: course name + timestamp */}
        <div className="community-row-line1">
          <span className="community-row-title">{course.title}</span>
          {summary?.lastActivityAt ? (
            <span className="community-row-time">{formatActivityTime(summary.lastActivityAt)}</span>
          ) : (
            <span className="community-row-time">
              {course.status === 'published' ? 'منشورة' : 'مسودة'}
            </span>
          )}
        </div>

        {/* Line 2: grade + unread badge */}
        <div className="community-row-line2">
          <span className="community-row-grade">{course.gradeLevel ?? ''}</span>
          {isUnread && <span className="community-row-badge">{badgeLabel}</span>}
        </div>

        {/* Line 3: latest message preview */}
        <div className="community-row-line3">
          <span className="community-row-preview">
            {summary?.preview ?? 'افتح المناقشات والإعلانات الخاصة بالدورة'}
          </span>
        </div>
      </div>
    </Link>
  )
}
