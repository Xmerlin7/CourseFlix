import { httpClient } from '../../../shared/api/http-client'
import type { AnalyticsQuestionResponse } from '../types/analytics.types'

export async function askAnalyticsQuestion(question: string): Promise<AnalyticsQuestionResponse> {
  return httpClient.post<AnalyticsQuestionResponse>('/teacher/analytics/questions', { question })
}
