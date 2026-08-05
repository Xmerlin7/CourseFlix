import { httpClient } from '../../../shared/api/http-client'
import type { UserRole } from '../../auth/types/auth.types'
import type {
  LessonDetail,
  UpdateProgressRequest,
  UpdateProgressResponse,
} from '../types/lesson.types'

export async function getLesson(
  lessonId: string,
  viewerRole: UserRole = 'student',
): Promise<LessonDetail> {
  const path =
    viewerRole === 'teacher'
      ? `/teacher/lessons/${lessonId}/player`
      : `/lessons/${lessonId}`

  return httpClient.get<LessonDetail>(path)
}

export async function postLessonProgress(
  lessonId: string,
  payload: UpdateProgressRequest,
): Promise<UpdateProgressResponse> {
  return httpClient.post<UpdateProgressResponse>(`/lessons/${lessonId}/progress`, payload)
}
