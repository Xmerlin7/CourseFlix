import { httpClient } from "../../../shared/api/http-client";
import type {
  TutorHistoryMessage,
  TutorMessageRequest,
  TutorMessageResponse,
} from "../types/tutor.types";

export async function getTutorMessages(
  courseId: string,
): Promise<TutorHistoryMessage[]> {
  return httpClient.get<TutorHistoryMessage[]>(
    `/courses/${courseId}/tutor/messages`,
  );
}

export async function sendTutorMessage(
  courseId: string,
  payload: TutorMessageRequest,
): Promise<TutorMessageResponse> {
  return httpClient.post<TutorMessageResponse>(
    `/courses/${courseId}/tutor/messages`,
    payload,
  );
}
