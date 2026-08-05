import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getMiniQuiz, submitMiniQuiz } from '../api/mini-quiz.api'
import type { MiniQuiz, MiniQuizSubmitResponse } from '../types/mini-quiz.types'

interface UseMiniQuizResult {
  quiz: MiniQuiz | null
  isLoading: boolean
  isSubmitting: boolean
  error: ApiError | null
  result: MiniQuizSubmitResponse | null
  submit: (answers: Array<{ questionId: string; selectedAnswer: string }>) => Promise<void>
}

export function useMiniQuiz(miniQuizId: string | null): UseMiniQuizResult {
  const [quiz, setQuiz] = useState<MiniQuiz | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [result, setResult] = useState<MiniQuizSubmitResponse | null>(null)

  useEffect(() => {
    if (!miniQuizId) return

    const quizId = miniQuizId
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getMiniQuiz(quizId)
        if (!controller.signal.aborted) {
          setQuiz(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [miniQuizId])

  const submit = useCallback(
    async (answers: Array<{ questionId: string; selectedAnswer: string }>) => {
      if (!miniQuizId) return
      setIsSubmitting(true)
      setError(null)
      try {
        const res = await submitMiniQuiz(miniQuizId, answers)
        setResult(res)
      } catch (err) {
        setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
      } finally {
        setIsSubmitting(false)
      }
    },
    [miniQuizId],
  )

  return { quiz, isLoading, isSubmitting, error, result, submit }
}
