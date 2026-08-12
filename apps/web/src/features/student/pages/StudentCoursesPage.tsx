import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { StudentCourseCard } from '../components/StudentCourseCard'
import { StudentCoursesSkeleton } from '../components/StudentCoursesSkeleton'
import { useStudentEnrollments } from '../hooks/useStudentEnrollments'
import type { EnrollmentStatus, StudentEnrollment } from '../types/student.types'

const STATUS_OPTIONS: Array<{ label: string; value: EnrollmentStatus | '' }> = [
  { label: 'الكل', value: '' },
  { label: 'نشط', value: 'active' },
  { label: 'موقوف', value: 'suspended' },
  { label: 'مكتمل', value: 'completed' },
]

/**
 * The course to feature in "استكمل التعلم" and pin first in the grid: an
 * active, started-but-unfinished course with somewhere to resume to. Among
 * several, the most recently active one wins — `lastActivityAt` is the
 * course's last completed-lesson timestamp (falling back to enrollment
 * date), the only recency signal the API can offer today.
 */
function pickActiveLearningCourse(enrollments: StudentEnrollment[]): StudentEnrollment | null {
  const eligible = enrollments.filter(
    (e) =>
      e.status === 'active' &&
      e.progressPercent > 0 &&
      e.progressPercent < 100 &&
      Boolean(e.currentLesson?.id),
  )

  if (eligible.length === 0) {
    return null
  }

  return [...eligible].sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
  )[0]
}

export function StudentCoursesPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<EnrollmentStatus | ''>('')
  const { data, isLoading, error, refetch } = useStudentEnrollments({
    status: status || undefined,
  })

  const activeLearningCourse = !isLoading && !error ? pickActiveLearningCourse(data) : null

  // Pin the active-learning course first; leave the rest of the API's
  // ordering (enrolled_at DESC) untouched otherwise — no shuffling.
  const orderedData = activeLearningCourse
    ? [activeLearningCourse, ...data.filter((e) => e.id !== activeLearningCourse.id)]
    : data

  return (
    <>
      <h1 className="page-title">دوراتي</h1>
      <p className="subtitle">كل الدورات اللي مسجّل فيها</p>

      {!isLoading && !error && activeLearningCourse && (
        <section className="continue-learning-section section" aria-label="استكمل التعلم">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 20 }}>استكمل التعلم</h2>
          </div>

          <div className="continue-learning-card card">
            <div className="continue-learning-info">
              <div className="continue-learning-header">
                <span className="continue-badge">
                  <span className="pulse-dot" aria-hidden="true" />
                  قيد التعلم الحالي
                </span>
                {activeLearningCourse.gradeLevel && (
                  <span className="continue-grade">{activeLearningCourse.gradeLevel}</span>
                )}
              </div>

              <h3 className="continue-course-title">
                {activeLearningCourse.courseTitle ?? 'دورة غير متاحة'}
              </h3>

              {activeLearningCourse.currentLesson?.title && (
                <p className="continue-last-lesson">
                  <strong>آخر درس:</strong> {activeLearningCourse.currentLesson.title}
                </p>
              )}

              <div className="continue-progress-block">
                <div className="progress-label-row">
                  <span>نسبة التقدم</span>
                  <span className="progress-value">{activeLearningCourse.progressPercent}%</span>
                </div>
                <div className="progress">
                  <div
                    className="bar"
                    style={{ width: `${Math.min(100, activeLearningCourse.progressPercent)}%` }}
                  />
                </div>
              </div>

              {activeLearningCourse.totalLessonsCount > 0 && (
                <span className="continue-lesson-count">
                  {activeLearningCourse.completedLessonsCount} من {activeLearningCourse.totalLessonsCount} درس مكتمل
                </span>
              )}
            </div>

            <div className="continue-learning-action">
              <Link
                to={`/student/lessons/${activeLearningCourse.currentLesson?.id}`}
                className="btn big continue-btn"
              >
                <span className="ms" aria-hidden="true">play_arrow</span>
                استكمل الآن
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Filter chips instead of a <select>: matches the ui5 reference and
          keeps every option one tap away on mobile.
          gradeLevel filtering is deliberately absent — the API can't apply
          it yet (see enrollments.service.ts), and a control that silently
          does nothing is worse than no control. */}
      <div className="actions section" role="group" aria-label="تصفية الدورات">
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

      {isLoading && <StudentCoursesSkeleton />}

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
          fullPage
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="grid-3 course-browse-grid">
          {orderedData.map((enrollment) => (
            <StudentCourseCard
              key={enrollment.id}
              enrollment={enrollment}
              isPrimaryActive={activeLearningCourse?.id === enrollment.id}
            />
          ))}
        </div>
      )}
    </>
  )
}
