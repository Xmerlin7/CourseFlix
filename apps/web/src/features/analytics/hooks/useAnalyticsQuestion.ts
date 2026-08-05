import { useCallback, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { askAnalyticsQuestion } from '../api/analytics.api'
import type { AnalyticsQuestionResponse } from '../types/analytics.types'

interface UseAnalyticsQuestionResult {
  data: AnalyticsQuestionResponse | null
  isLoading: boolean
  error: ApiError | null
  ask: (question: string) => Promise<AnalyticsQuestionResponse | null>
}

export function useAnalyticsQuestion(): UseAnalyticsQuestionResult {
  const [data, setData] = useState<AnalyticsQuestionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const ask = useCallback(async (question: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await askAnalyticsQuestion(question)
      setData(response)
      return response
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error, ask }
}
