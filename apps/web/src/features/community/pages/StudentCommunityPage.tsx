import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { useStudentEnrollments } from '../../student/hooks/useStudentEnrollments'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { StudentCommunitySkeleton } from '../components/StudentCommunitySkeleton'
import type { StudentEnrollment } from '../../student/types/student.types'

function buildCommunityPath(courseId: string): string {
  return ROUTE_PATHS.STUDENT.COMMUNITY_COURSE.replace(':courseId', courseId)
}

export function StudentCommunityPage() {
  const { data: enrollments, isLoading, error, refetch } = useStudentEnrollments()

  if (isLoading) return <StudentCommunitySkeleton />

  const courses = (enrollments ?? []).filter(
    (enrollment) => enrollment.status === 'active' || enrollment.status === 'completed',
  )

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1 className="page-title">المجتمع</h1>
        <p className="community-page-subtitle">
          تواصل مع زملائك ومدرسك وشارك الأسئلة والمناقشات داخل دوراتك.
        </p>
      </div>

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : courses.length === 0 ? (
        <EmptyState
          variant="courses"
          title="لا توجد دورات متاحة"
          message="اشترك في دورة للانضمام إلى مجتمعها."
          fullPage
        />
      ) : (
        <div className="community-section">
          <div className="section-head">
            <h2>دوراتك</h2>
            <span className="meta">{courses.length} دورة</span>
          </div>

          <div className="grid-3 course-browse-grid community-course-grid">
            {courses.map((enrollment) =>
              enrollment.courseTitle ? (
                <CommunityCourseCard key={enrollment.courseId} enrollment={enrollment} />
              ) : (
                <CommunityCourseUnavailableCard key={enrollment.courseId} />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CommunityCourseCard({ enrollment }: { enrollment: StudentEnrollment }) {
  return (
    <Link
      to={buildCommunityPath(enrollment.courseId)}
      className="card lift course-browse-card community-course-card"
    >
      <div className="course-card-thumb-wrapper">
        <CourseThumb coverImageUrl={enrollment.coverImageUrl} alt={enrollment.courseTitle ?? ''} />
      </div>

      <div className="course-card-body">
        <h3 className="course-card-title" title={enrollment.courseTitle}>
          {enrollment.courseTitle}
        </h3>
        {enrollment.gradeLevel && <p className="community-course-grade">{enrollment.gradeLevel}</p>}

        <div className="course-card-footer community-course-footer">
          <span className="community-course-cta">
            دخول المجتمع
            <span className="ms sm" aria-hidden="true">chevron_left</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

// A soft-deleted course still has an enrollment row (see StudentEnrollment's
// courseTitle doc comment) — shown as a locked, non-clickable card instead
// of a normal card with a blank/fallback title, so the student can tell at
// a glance this one can't be entered rather than hitting a dead link.
function CommunityCourseUnavailableCard() {
  return (
    <div
      className="card course-browse-card community-course-card community-course-card--locked"
      role="group"
      aria-label="الدورة غير متاحة"
    >
      <div className="course-card-thumb-wrapper community-course-locked-thumb">
        <span className="ms" aria-hidden="true">lock</span>
      </div>

      <div className="course-card-body">
        <h3 className="course-card-title">الدورة غير متاحة</h3>
        <p className="community-course-grade">لا يمكنك الوصول إلى مجتمع هذه الدورة حاليًا</p>
      </div>
    </div>
  )
}
