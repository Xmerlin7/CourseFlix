import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { useStudentEnrollments } from '../../student/hooks/useStudentEnrollments'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { StudentCommunitySkeleton } from '../components/StudentCommunitySkeleton'

function buildCommunityPath(courseId: string): string {
  return ROUTE_PATHS.STUDENT.COMMUNITY_COURSE.replace(':courseId', courseId)
}

export function StudentCommunityPage() {
  const { data: enrollments, isLoading, error, refetch } = useStudentEnrollments()

  if (isLoading) return <StudentCommunitySkeleton />

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1 className="page-title">المجتمع</h1>
        <p className="community-page-subtitle">تواصل مع مدرسك وزملائك داخل كل دورة</p>
      </div>

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="لا توجد دورات متاحة"
          message="اشترك في دورة للانضمام إلى مجتمعها."
        />
      ) : (
        <div className="community-courses-list">
          {enrollments
            .filter((e) => e.status === 'active' || e.status === 'completed')
            .map((enrollment) => (
              <Link
                key={enrollment.courseId}
                to={buildCommunityPath(enrollment.courseId)}
                className="card community-course-card lift"
              >
                <div className="community-course-thumb">
                  <CourseThumb
                    coverImageUrl={enrollment.coverImageUrl}
                    alt={enrollment.courseTitle ?? ''}
                  />
                </div>

                <div className="community-course-info">
                  <h2 className="community-course-title">
                    {enrollment.courseTitle ?? 'دورة غير متاحة'}
                  </h2>
                  {enrollment.gradeLevel && (
                    <span className="chip outline sm">{enrollment.gradeLevel}</span>
                  )}
                </div>

                <span className="ms community-course-arrow" aria-hidden="true">
                  arrow_back_ios
                </span>
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
