import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { COURSE_STATUS } from '../../../shared/lib/status-labels'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { useTeacherCourses } from '../hooks/useTeacherCourses'
import type { CourseStatus } from '../../courses/types/course.types'

const STATUS_OPTIONS: Array<{ label: string; value: CourseStatus | '' }> = [
  { label: 'الكل', value: '' },
  { label: 'مسودة', value: 'draft' },
  { label: 'منشورة', value: 'published' },
  { label: 'مؤرشفة', value: 'archived' },
]

export function TeacherCoursesPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<CourseStatus | ''>('')
  const { data, isLoading, error, refetch } = useTeacherCourses({
    status: status || undefined,
  })

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            دوراتي
          </h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            الدورات اللي بتديرها
          </p>
        </div>
        <Link to={ROUTE_PATHS.TEACHER.COURSE_CREATE} className="btn">
          <span className="ms">add</span>
          دورة جديدة
        </Link>
      </div>

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
          actionLabel="إنشاء أول دورة"
          onAction={() => navigate(ROUTE_PATHS.TEACHER.COURSE_CREATE)}
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
                  <CourseThumb coverImageUrl={course.coverImageUrl} alt={course.title} />

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
