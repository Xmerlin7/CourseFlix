import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getCourseQuizzes } from '../api/quizzes.api'
import type { QuizSummary } from '../types/quiz.types'

export function useCourseQuizzes(courseId: string) {
  const [data, setData] = useState<QuizSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)
    getCourseQuizzes(courseId)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [courseId])

  return { data, isLoading, error }
}
