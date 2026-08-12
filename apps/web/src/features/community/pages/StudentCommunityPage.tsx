import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
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

  return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
}

export function StudentCommunityPage() {
  const { data: enrollments, isLoading, error, refetch } = useStudentEnrollments()
  const { data: summaries } = useStudentCommunitySummary()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  if (isLoading) return <StudentCommunitySkeleton />

  const summaryByCourseId = new Map(summaries.map((item) => [item.courseId, item]))

  const courses = (enrollments ?? [])
    .filter((enrollment) => enrollment.status === 'active' || enrollment.status === 'completed')
    // Most recently active course first, like a real conversation list —
    // courses with no community activity yet keep their enrollment order.
    .sort((a, b) => {
      const aTime = summaryByCourseId.get(a.courseId)?.lastActivityAt
      const bTime = summaryByCourseId.get(b.courseId)?.lastActivityAt
      if (aTime && bTime) return bTime.localeCompare(aTime)
      if (aTime) return -1
      if (bTime) return 1
      return 0
    })

  const query = search.trim().toLowerCase()
  const filteredCourses = query
    ? courses.filter((enrollment) => (enrollment.courseTitle ?? '').toLowerCase().includes(query))
    : courses

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
        <EmptyState
          variant="courses"
          title="لا توجد دورات بعد"
          message="انضم إلى دورة لبدء المشاركة في المجتمع"
          actionLabel="استكشف الدورات"
          onAction={() => navigate(ROUTE_PATHS.STUDENT.BROWSE)}
          fullPage
        />
      ) : (
        <>
          <div className="community-search">
            <span className="ms" aria-hidden="true">search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث عن دورة..."
              aria-label="ابحث عن دورة"
            />
          </div>

          {filteredCourses.length === 0 ? (
            <p className="community-no-results">مفيش دورات مطابقة لبحثك.</p>
          ) : (
            <div className="community-list">
              {filteredCourses.map((enrollment) =>
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

  return (
    <Link to={buildCommunityPath(enrollment.courseId)} className="community-row">
      <div className="community-row-avatar">
        <CourseThumb coverImageUrl={enrollment.coverImageUrl} alt={enrollment.courseTitle ?? ''} />
      </div>

      <div className="community-row-main">
        <div className="community-row-top">
          <span className="community-row-title">{enrollment.courseTitle}</span>
          {summary?.lastActivityAt && (
            <span className="community-row-time">{formatActivityTime(summary.lastActivityAt)}</span>
          )}
        </div>

        <div className="community-row-bottom">
          <span className="community-row-preview">
            {enrollment.gradeLevel && (
              <>
                <span className="community-row-grade">{enrollment.gradeLevel}</span>
                {summary?.preview && <span className="community-row-sep">·</span>}
              </>
            )}
            {summary?.preview ?? 'لا يوجد نشاط بعد'}
          </span>
          {unreadCount > 0 && <span className="community-row-badge">{unreadCount}</span>}
        </div>
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
        <div className="community-row-top">
          <span className="community-row-title">الدورة غير متاحة</span>
        </div>
        <div className="community-row-bottom">
          <span className="community-row-preview">لا يمكنك الوصول إلى مجتمع هذه الدورة حاليًا</span>
        </div>
      </div>
    </div>
  )
}
