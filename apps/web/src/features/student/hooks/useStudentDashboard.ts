import type { StudentDashboard } from '../types/student.types'

export function useStudentDashboard() {
  // TODO: replace with TanStack Query call to getStudentDashboard.
  const data: StudentDashboard | null = null

  return {
    data,
    isLoading: false,
    error: null,
  }
}
