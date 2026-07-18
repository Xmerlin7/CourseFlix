import type { TeacherCourse } from '../types/teacher.types'

export function useTeacherCourses() {
  // TODO: replace with TanStack Query call to getTeacherCourses.
  const data: TeacherCourse[] = []

  return {
    data,
    isLoading: false,
    error: null,
  }
}
