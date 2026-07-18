import { httpClient } from '../../../shared/api/http-client'
import type {
  TeacherCourse,
  TeacherDashboard,
  UpdateTeacherCoursePayload,
} from '../types/teacher.types'

export async function getTeacherDashboard(): Promise<TeacherDashboard> {
  return httpClient.get<TeacherDashboard>('/teacher/dashboard')
}

export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  return httpClient.get<TeacherCourse[]>('/teacher/courses')
}

export async function updateTeacherCourse(
  courseId: string,
  payload: UpdateTeacherCoursePayload,
): Promise<TeacherCourse> {
  return httpClient.patch<TeacherCourse>(`/teacher/courses/${courseId}`, payload)
}
