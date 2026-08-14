import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { ErrorState } from '../../../shared/components/ErrorState'
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses'
import { useStudentCommunitySummary } from '../../student/hooks/useStudentCommunitySummary'
import { StudentCommunitySkeleton } from '../components/StudentCommunitySkeleton'
import { CommunityCourseList, type CommunityCourseItem } from '../components/CommunityCourseList'

const PAGE_SIZE = 10

function buildCommunityPath(courseId: string): string {
  return ROUTE_PATHS.TEACHER.COMMUNITY_COURSE.replace(':courseId', courseId)
}

export function TeacherCommunityPage() {
  const { data: coursesData, isLoading, error, refetch } = useTeacherCourses()
  const { data: summaries } = useStudentCommunitySummary()

  const summaryByCourseId = new Map((summaries ?? []).map((item) => [item.courseId, item]))

  const courses: CommunityCourseItem[] = (coursesData ?? [])
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
    .map((course) => ({
      id: course.id,
      title: course.title,
      to: buildCommunityPath(course.id),
      coverImageUrl: course.coverImageUrl,
      gradeLevel: course.gradeLevel,
      summary: summaryByCourseId.get(course.id),
    }))

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
      ) : courses.length === 0 ? (
        <div className="community-empty">
          <span className="ms" aria-hidden="true">groups</span>
          <p className="community-empty-title">لا توجد مجتمعات متاحة</p>
          <p className="community-empty-message">أنشئ دورة أو انشرها ليظهر مجتمعها هنا</p>
        </div>
      ) : (
        <CommunityCourseList
          courses={courses}
          searchId="teacher-community-search"
          searchLabel="بحث عن دورة"
          searchPlaceholder="ابحث باسم الدورة..."
          noResultsMessage="مفيش دورات مطابقة لبحثك."
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  )
}
