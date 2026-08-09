import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
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

  // Find the primary in-progress active course (most recently active)
  const activeLearningCourse = !isLoading && !error
    ? data.find(
        (e) =>
          e.status === 'active' &&
          typeof e.progressPercent === 'number' &&
          e.progressPercent > 0 &&
          e.progressPercent < 100 &&
          Boolean(e.currentLesson?.id),
      )
    : null

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
                    style={{ width: `${Math.min(100, activeLearningCourse.progressPercent ?? 0)}%` }}
                  />
                </div>
              </div>

              {typeof activeLearningCourse.totalLessonsCount === 'number' &&
                activeLearningCourse.totalLessonsCount > 0 && (
                  <span className="continue-lesson-count">
                    {activeLearningCourse.completedLessonsCount ?? 0} من {activeLearningCourse.totalLessonsCount} درس مكتمل
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

      {/* Filter chips */}
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
          fullPage
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="grid-3 course-browse-grid">
          {data.map((enrollment) => (
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

