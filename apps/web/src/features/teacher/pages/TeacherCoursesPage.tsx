import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { COURSE_STATUS } from '../../../shared/lib/status-labels'
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
    <>
      <h1 className="page-title">دوراتي</h1>
      <p className="subtitle">الدورات اللي بتديرها</p>

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
          title="لسه معندكش دورات"
          message="الدورات اللي بتديرها هتظهر هنا"
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="grid-3">
          {data.map((course) => {
            const courseStatus = COURSE_STATUS[course.status]

            return (
              <Link
                key={course.id}
                to={`/teacher/courses/${course.id}`}
                className="card lift course-card"
              >
                <div className="row">
                  <div className="thumb" aria-hidden="true">
                    <i className="t1" />
                    <i className="t2" />
                    <i className="t3" />
                  </div>

                  <div className="info">
                    <h3>{course.title}</h3>
                    {course.gradeLevel && <p className="meta">{course.gradeLevel}</p>}
                    <div className="actions">
                      <span className={`chip ${courseStatus.chip}`}>{courseStatus.label}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
