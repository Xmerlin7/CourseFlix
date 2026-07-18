import { httpClient } from '../../../shared/api/http-client'
import type {
  StudentDashboard,
  StudentEnrollment,
  StudentEnrollmentFilters,
} from '../types/student.types'

export async function getStudentDashboard(): Promise<StudentDashboard> {
  return httpClient.get<StudentDashboard>('/student/dashboard')
}

export async function getStudentEnrollments(
  filters: StudentEnrollmentFilters = {},
): Promise<StudentEnrollment[]> {
  return httpClient.get<StudentEnrollment[]>('/student/enrollments', {
    searchParams: filters,
  })
}
