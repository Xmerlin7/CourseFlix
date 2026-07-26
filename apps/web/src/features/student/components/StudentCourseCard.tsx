import { Link } from 'react-router'
import type { StudentEnrollment } from '../types/student.types'

interface StudentCourseCardProps {
  enrollment: StudentEnrollment
}

export function StudentCourseCard({ enrollment }: StudentCourseCardProps) {
  return (
    <Link
      to={`/student/courses/${enrollment.courseId}`}
      className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700"
    >
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
        {enrollment.courseTitle ?? `Course ${enrollment.courseId}`}
      </h3>

      {enrollment.gradeLevel && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {enrollment.gradeLevel}
        </p>
      )}

      <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-primary">
        {enrollment.status}
      </span>
    </Link>
  )
}