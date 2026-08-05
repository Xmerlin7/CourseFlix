import { useState } from 'react'
import { useNavigate } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
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
  const navigate = useNavigate()
  const [status, setStatus] = useState<EnrollmentStatus | ''>('')
  const { data, isLoading, error, refetch } = useStudentEnrollments({
    status: status || undefined,
  })

  return (
    <>
      <h1 className="page-title">دوراتي</h1>
      <p className="subtitle">كل الدورات اللي مسجّل فيها</p>

      {/* Filter chips instead of a <select>: matches the ui5 reference and
          keeps every option one tap away on mobile.
          gradeLevel filtering is deliberately absent — the API can't apply
          it yet (see enrollments.service.ts), and a control that silently
          does nothing is worse than no control. */}
      <div className="actions section">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(option.value)}
            className={`chip clickable outline${status === option.value ? ' selected' : ''}`}
            aria-pressed={status === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingState variant="cards" />}

      {!isLoading &&
        error &&
        (error.status === 403 ? <ForbiddenState /> : <ErrorState onRetry={refetch} />)}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          variant="courses"
          title="لسه مفيش دورات هنا"
          message="لما تنضم لدورة هتظهر هنا"
          actionLabel="استكشف الدورات"
          onAction={() => navigate('/student/browse')}
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="grid-3">
          {data.map((enrollment) => (
            <StudentCourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </>
  )
}
