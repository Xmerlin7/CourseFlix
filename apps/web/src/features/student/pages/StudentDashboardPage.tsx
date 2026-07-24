import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

// NOTE: markup here is intentionally minimal/unstyled — Elgendy owns the
// visual design system (shared shell/components). This wires real data
// and real states; visual polish happens once his shared components take
// props (they're currently all no-arg TODO stubs).
export function StudentDashboardPage() {
  const { data, isLoading, error } = useStudentDashboard()

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    if (error.status === 403) {
      return <ForbiddenState />
    }
    return <ErrorState />
  }

  if (!data) {
    return <EmptyState />
  }

  return (
    <div>
      <PageHeader title="Dashboard" />

      <section>
        <p>Enrolled courses: {data.stats.enrolledCoursesCount}</p>
        <p>Active courses: {data.stats.activeCoursesCount}</p>
      </section>

      <section>
        {/* Sprint 1 boundary: progress tracking isn't implemented yet. */}
        <p>Overall progress: not available yet</p>
        <p>Continue learning: not started yet</p>
      </section>

      {data.recentCourses.length === 0 ? (
        <EmptyState />
      ) : (
        <ul>
          {data.recentCourses.map((course) => (
            <li key={course.courseId}>
              Course {course.courseId} — {course.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}