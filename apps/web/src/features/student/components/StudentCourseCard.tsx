import type { StudentEnrollment } from '../types/student.types'

interface StudentCourseCardProps {
  enrollment: StudentEnrollment
}

export function StudentCourseCard({ enrollment }: StudentCourseCardProps) {
  void enrollment
  // TODO: render enrolled course summary and link to /student/courses/:courseId.
  return null
}
