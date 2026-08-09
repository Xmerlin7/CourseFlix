import { Link } from 'react-router'
import { User } from 'lucide-react'
import { ENROLLMENT_STATUS } from '../../../shared/lib/status-labels'
import { CourseThumb } from '../../courses/components/CourseThumb'
import type { StudentEnrollment } from '../types/student.types'

interface StudentCourseCardProps {
  enrollment: StudentEnrollment
  isPrimaryActive?: boolean
}

export function StudentCourseCard({ enrollment, isPrimaryActive = false }: StudentCourseCardProps) {
  const status = ENROLLMENT_STATUS[enrollment.status]
  const progressPercent = enrollment.progressPercent ?? 0
  const isCompleted = enrollment.status === 'completed' || progressPercent >= 100
  const isStarted = progressPercent > 0
  const isSuspended = enrollment.status === 'suspended'

  const currentLessonId = enrollment.currentLesson?.id
  const actionTarget = isSuspended || isCompleted || !currentLessonId
    ? `/student/courses/${enrollment.courseId}`
    : `/student/lessons/${currentLessonId}`

  let ctaLabel = 'ابدأ الآن'
  if (isCompleted) {
    ctaLabel = 'مراجعة الدورة'
  } else if (isStarted) {
    ctaLabel = 'استكمل الآن'
  }

  return (
    <article className={`card lift student-course-card${isPrimaryActive ? ' active-learning-card' : ''}`}>
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
          <span className={`chip ${status.chip} sm`}>{status.label}</span>
        </div>

        {enrollment.teacherName && (
          <div className="student-card-teacher">
            <User size={14} className="teacher-icon" />
            <span>{enrollment.teacherName}</span>
          </div>
        )}

        <div className="student-card-progress-section">
          <div className="progress-label-row">
            <span className="progress-title">تقدمك في الدورة</span>
            <span className="progress-value">{progressPercent}%</span>
          </div>
          <div className="progress">
            <div className="bar" style={{ width: `${Math.min(100, progressPercent)}%` }} />
          </div>
        </div>

        {enrollment.currentLesson?.title && !isCompleted && (
          <div className="student-card-last-lesson">
            <span className="last-lesson-lbl">آخر درس:</span>
            <span className="last-lesson-name" title={enrollment.currentLesson.title}>
              {enrollment.currentLesson.title}
            </span>
          </div>
        )}

        {typeof enrollment.totalLessonsCount === 'number' && enrollment.totalLessonsCount > 0 && (
          <div className="student-card-lesson-count">
            {enrollment.completedLessonsCount ?? 0} من {enrollment.totalLessonsCount} درس مكتمل
          </div>
        )}

        <div className="student-card-footer">
          <Link
            to={actionTarget}
            className={`btn btn-compact student-card-cta${isCompleted ? ' tonal' : ''}${isSuspended ? ' disabled' : ''}`}
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

