import { httpClient } from '../../../shared/api/http-client'
import type { TutorMessageRequest, TutorMessageResponse } from '../types/tutor.types'

export async function sendTutorMessage(
  courseId: string,
  payload: TutorMessageRequest,
): Promise<TutorMessageResponse> {
  return httpClient.post<TutorMessageResponse>(`/courses/${courseId}/tutor/messages`, payload)
}
