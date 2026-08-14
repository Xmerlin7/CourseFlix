import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { ErrorState } from '../../../shared/components/ErrorState'
import { useStudentEnrollments } from '../../student/hooks/useStudentEnrollments'
import { useStudentCommunitySummary } from '../../student/hooks/useStudentCommunitySummary'
import { StudentCommunitySkeleton } from '../components/StudentCommunitySkeleton'
import { CommunityCourseList, type CommunityCourseItem } from '../components/CommunityCourseList'

function buildCommunityPath(courseId: string): string {
  return ROUTE_PATHS.STUDENT.COMMUNITY_COURSE.replace(':courseId', courseId)
}

const PAGE_SIZE = 10

export function StudentCommunityPage() {
  const { data: enrollments, isLoading, error, refetch } = useStudentEnrollments()
  const { data: summaries } = useStudentCommunitySummary()

  const summaryByCourseId = new Map(summaries.map((item) => [item.courseId, item]))

  const courses: CommunityCourseItem[] = (enrollments ?? [])
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
    .map((enrollment) => ({
      id: enrollment.courseId,
      title: enrollment.courseTitle ?? 'الدورة غير متاحة',
      to: buildCommunityPath(enrollment.courseId),
      coverImageUrl: enrollment.coverImageUrl,
      gradeLevel: enrollment.gradeLevel,
      summary: summaryByCourseId.get(enrollment.courseId),
      isUnavailable: !enrollment.courseTitle,
    }))

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
        <CommunityCourseList
          courses={courses}
          searchId="community-search"
          searchLabel="بحث عن دورة"
          searchPlaceholder="ابحث باسم الدورة..."
          noResultsMessage="مفيش دورات مطابقة لبحثك."
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  )
}
