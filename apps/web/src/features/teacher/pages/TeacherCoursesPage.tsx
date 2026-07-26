import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useTeacherCourses } from '../hooks/useTeacherCourses'
import type { CourseStatus } from '../../courses/types/course.types'

const STATUS_OPTIONS: Array<{ label: string; value: CourseStatus | '' }> = [
  { label: 'الكل', value: '' },
  { label: 'مسودة', value: 'draft' },
  { label: 'منشورة', value: 'published' },
  { label: 'مؤرشفة', value: 'archived' },
]

export function TeacherCoursesPage() {
  const [status, setStatus] = useState<CourseStatus | ''>('')
  const { data, isLoading, error, refetch } = useTeacherCourses({
    status: status || undefined,
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6" dir="rtl">
      <PageHeader title="كورساتي" />

      <label className="flex flex-col gap-1 text-sm sm:w-48">
        <span className="text-gray-600 dark:text-gray-400">الحالة</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as CourseStatus | '')}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {isLoading && <LoadingState variant="cards" />}

      {!isLoading && error && (
        error.status === 403 ? (
          <ForbiddenState />
        ) : (
          <ErrorState onRetry={refetch} />
        )
      )}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          variant="courses"
          title="لسه معندكش كورسات"
          message="الكورسات اللي بتديرها هتظهر هنا"
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((course) => (
            <Link
              key={course.id}
              to={`/teacher/courses/${course.id}`}
              className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {course.title}
              </h3>

              {course.gradeLevel && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {course.gradeLevel}
                </p>
              )}

              <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-primary">
                {course.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
