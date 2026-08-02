import { httpClient } from '../../../shared/api/http-client'
import type {
  LessonDetail,
  UpdateProgressRequest,
  UpdateProgressResponse,
} from '../types/lesson.types'

export async function getLesson(lessonId: string): Promise<LessonDetail> {
  return httpClient.get<LessonDetail>(`/lessons/${lessonId}`)
}

export async function postLessonProgress(
  lessonId: string,
  payload: UpdateProgressRequest,
): Promise<UpdateProgressResponse> {
  return httpClient.post<UpdateProgressResponse>(`/lessons/${lessonId}/progress`, payload)
}
