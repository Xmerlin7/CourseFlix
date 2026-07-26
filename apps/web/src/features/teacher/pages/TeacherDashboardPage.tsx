import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'

export function TeacherDashboardPage() {
  const { data, isLoading, error } = useTeacherDashboard()

  if (isLoading) {
    return <LoadingState variant="cards" />
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
    <div className="flex flex-col gap-6 p-4 sm:p-6" dir="rtl">
      <PageHeader title="لوحة المعلم" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">دوراتي</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.stats.ownedCourseCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">دورات منشورة</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.stats.publishedCourseCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">الطلاب المسجّلين</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.stats.enrolledStudentCount}
          </p>
        </div>
      </div>

      {data.recentCourses.length === 0 ? (
        <EmptyState
          variant="courses"
          title="لسه معندكش كورسات"
          message="الكورسات اللي بتديرها هتظهر هنا"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.recentCourses.map((course) => (
            <li key={course.id}>
              <Link
                to={`/teacher/courses/${course.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm transition-shadow hover:shadow-md dark:border-gray-700"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {course.title}
                </span>
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {course.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
