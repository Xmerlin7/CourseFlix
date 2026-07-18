import { httpClient } from '../../../shared/api/http-client'
import type { CourseDetail } from '../types/course.types'

export async function getCourseDetail(courseId: string): Promise<CourseDetail> {
  return httpClient.get<CourseDetail>(`/courses/${courseId}`)
}
