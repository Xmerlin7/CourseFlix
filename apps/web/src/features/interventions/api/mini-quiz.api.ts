import { httpClient } from '../../../shared/api/http-client'
import type { MiniQuiz, MiniQuizSubmitResponse } from '../types/mini-quiz.types'

export async function getMiniQuiz(miniQuizId: string): Promise<MiniQuiz> {
  return httpClient.get<MiniQuiz>(`/student/mini-quizzes/${miniQuizId}`)
}

export async function submitMiniQuiz(
  miniQuizId: string,
  answers: Array<{ questionId: string; selectedAnswer: string }>,
): Promise<MiniQuizSubmitResponse> {
  return httpClient.post<MiniQuizSubmitResponse>(
    `/student/mini-quizzes/${miniQuizId}/submit`,
    { answers },
  )
}
