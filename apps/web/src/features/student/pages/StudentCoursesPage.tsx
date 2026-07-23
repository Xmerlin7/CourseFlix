import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { StudentCourseCard } from '../components/StudentCourseCard'
import { useStudentEnrollments } from '../hooks/useStudentEnrollments'
import type { EnrollmentStatus } from '../types/student.types'

const STATUS_OPTIONS: Array<{ label: string; value: EnrollmentStatus | '' }> = [
  { label: 'الكل', value: '' },
  { label: 'نشط', value: 'active' },
  { label: 'موقوف', value: 'suspended' },
  { label: 'مكتمل', value: 'completed' },
]

export function StudentCoursesPage() {
  const [status, setStatus] = useState<EnrollmentStatus | ''>('')
  const { data, isLoading, error, refetch } = useStudentEnrollments({
    status: status || undefined,
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader>
        <h1>كورساتي</h1>
      </PageHeader>

      <label className="flex flex-col gap-1 text-sm sm:w-48">
        <span className="text-gray-600 dark:text-gray-400">الحالة</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as EnrollmentStatus | '')}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {/* gradeLevel filter intentionally left out of the UI: the API can't
          apply it yet (courses has no grade_level column — see
          enrollments.service.ts TODO). No point shipping a control that
          silently does nothing. */}

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
          title="لسه مفيش كورسات هنا"
          message="لما تنضم لكورس هيظهر هنا"
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((enrollment) => (
            <StudentCourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  )
}