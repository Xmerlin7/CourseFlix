import { Link } from 'react-router'
import { ENROLLMENT_STATUS } from '../../../shared/lib/status-labels'
import { CourseThumb } from '../../courses/components/CourseThumb'
import type { StudentEnrollment } from '../types/student.types'

interface StudentCourseCardProps {
  enrollment: StudentEnrollment
}

export function StudentCourseCard({ enrollment }: StudentCourseCardProps) {
  const status = ENROLLMENT_STATUS[enrollment.status]

  return (
    <Link to={`/student/courses/${enrollment.courseId}`} className="card lift course-card">
      <div className="row">
        <CourseThumb
          coverImageUrl={enrollment.coverImageUrl}
          alt={enrollment.courseTitle ?? ''}
        />

        <div className="info">
          <h3>{enrollment.courseTitle ?? 'دورة غير متاحة'}</h3>
          {enrollment.gradeLevel && <p className="meta">{enrollment.gradeLevel}</p>}
          <div className="actions">
            <span className={`chip ${status.chip}`}>{status.label}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
