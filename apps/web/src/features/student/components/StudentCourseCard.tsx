import { Link } from 'react-router'
import { ENROLLMENT_STATUS } from '../../../shared/lib/status-labels'
import { CourseThumb } from '../../courses/components/CourseThumb'
import type { StudentEnrollment } from '../types/student.types'

interface StudentCourseCardProps {
  enrollment: StudentEnrollment
  isPrimaryActive?: boolean
}

export function StudentCourseCard({ enrollment, isPrimaryActive = false }: StudentCourseCardProps) {
  const status = ENROLLMENT_STATUS[enrollment.status]
  const progressPercent = enrollment.progressPercent
  const isCompleted = enrollment.status === 'completed' || progressPercent >= 100
  const isStarted = progressPercent > 0
  const isSuspended = enrollment.status === 'suspended'

  const currentLessonId = enrollment.currentLesson?.id
  const coursePath = `/student/courses/${enrollment.courseId}`
  // The CTA resumes the lesson; the card body around it opens the course
  // overview instead, so browsing the course is never a side effect of
  // wanting to keep watching (and vice versa).
  const actionTarget = isSuspended || isCompleted || !currentLessonId
    ? coursePath
    : `/student/lessons/${currentLessonId}`

  let ctaLabel = 'ابدأ الآن'
  if (isCompleted) {
    ctaLabel = 'مراجعة الدورة'
  } else if (isStarted) {
    ctaLabel = 'استكمل الآن'
  }

  return (
    <article className={`card lift student-course-card${isPrimaryActive ? ' active-learning-card' : ''}`}>
      {/* Stretched overlay link: makes the whole card open the course
          overview without nesting the CTA inside another <a>, which is
          invalid HTML and breaks keyboard navigation. The CTA sits above
          it via z-index, so it keeps its own destination. */}
      <Link
        to={coursePath}
        className="student-card-overlay-link"
        aria-label={`تفاصيل دورة ${enrollment.courseTitle ?? ''}`}
      />
      <div className="student-card-thumb-wrapper">
        <CourseThumb coverImageUrl={enrollment.coverImageUrl} alt={enrollment.courseTitle ?? ''} />
        {isPrimaryActive && (
          <span className="active-learning-badge">
            <span className="pulse-dot" aria-hidden="true" />
            تتعلم الآن
          </span>
        )}
        {enrollment.gradeLevel && (
          <span className="student-card-grade">{enrollment.gradeLevel}</span>
        )}
      </div>

      <div className="student-card-body">
        <div className="student-card-head">
          <h3 className="student-card-title" title={enrollment.courseTitle ?? ''}>
            {enrollment.courseTitle ?? 'دورة غير متاحة'}
          </h3>
          <span className={`chip ${status.chip}`}>{status.label}</span>
        </div>

        {enrollment.totalLessonsCount > 0 && (
          <div className="student-card-progress-section">
            <div className="progress-label-row">
              <span className="progress-title">تقدمك في الدورة</span>
              <span className="progress-value">{progressPercent}%</span>
            </div>
            <div className="progress">
              <div className="bar" style={{ width: `${Math.min(100, progressPercent)}%` }} />
            </div>
          </div>
        )}

        {enrollment.currentLesson?.title && !isCompleted && (
          <div className="student-card-last-lesson">
            <span className="last-lesson-lbl">آخر درس:</span>
            <span className="last-lesson-name" title={enrollment.currentLesson.title}>
              {enrollment.currentLesson.title}
            </span>
          </div>
        )}

        {enrollment.totalLessonsCount > 0 && (
          <div className="student-card-lesson-count">
            {enrollment.completedLessonsCount} من {enrollment.totalLessonsCount} درس مكتمل
          </div>
        )}

        <div className="student-card-footer">
          <Link
            to={actionTarget}
            className={`btn btn-compact student-card-cta${isCompleted ? ' tonal' : ''}${isSuspended ? ' disabled' : ''}`}
            aria-disabled={isSuspended}
            onClick={(e) => {
              if (isSuspended) e.preventDefault()
            }}
          >
            <span className="ms sm" aria-hidden="true">
              {isCompleted ? 'auto_stories' : 'play_arrow'}
            </span>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  )
}
