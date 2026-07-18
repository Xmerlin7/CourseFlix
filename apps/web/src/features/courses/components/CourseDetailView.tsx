import type { CourseDetail } from '../types/course.types'

interface CourseDetailViewProps {
  course: CourseDetail
}

export function CourseDetailView({ course }: CourseDetailViewProps) {
  void course
  // TODO: shared student/teacher course detail presentation with ordered sections and lessons.
  return null
}
