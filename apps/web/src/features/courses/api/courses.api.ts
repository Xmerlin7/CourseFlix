import { httpClient } from '../../../shared/api/http-client'
import type { CourseCatalogItem, CourseDetail } from '../types/course.types'

export async function getCourseDetail(courseId: string): Promise<CourseDetail> {
  return httpClient.get<CourseDetail>(`/courses/${courseId}`)
}

export async function getCourseCatalog(): Promise<CourseCatalogItem[]> {
  return httpClient.get<CourseCatalogItem[]>('/courses')
}
