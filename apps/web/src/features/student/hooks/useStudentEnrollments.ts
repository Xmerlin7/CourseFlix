import type {
  StudentEnrollment,
  StudentEnrollmentFilters,
} from '../types/student.types'

export function useStudentEnrollments(filters: StudentEnrollmentFilters = {}) {
  void filters
  // TODO: replace with TanStack Query call to getStudentEnrollments.
  const data: StudentEnrollment[] = []

  return {
    data,
    isLoading: false,
    error: null,
  }
}
