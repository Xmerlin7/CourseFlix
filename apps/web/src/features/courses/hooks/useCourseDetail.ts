import type { CourseDetail } from '../types/course.types'

export function useCourseDetail(courseId: string) {
  void courseId
  // TODO: wrap the course detail API with TanStack Query after dependency is added.
  const data: CourseDetail | null = null

  return {
    data,
    isLoading: false,
    error: null,
  }
}
