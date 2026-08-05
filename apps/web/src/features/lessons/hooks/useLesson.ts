import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import type { UserRole } from '../../auth/types/auth.types'
import { getLesson } from '../api/lessons.api'
import type { LessonDetail } from '../types/lesson.types'

interface UseLessonResult {
  data: LessonDetail | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

// Plain useEffect/useState, matching useCourseDetail.ts — no
// data-fetching library is installed in apps/web yet.
export function useLesson(
  lessonId: string,
  viewerRole: UserRole = 'student',
): UseLessonResult {
  const [data, setData] = useState<LessonDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const lesson = await getLesson(lessonId, viewerRole)
        if (!controller.signal.aborted) {
          setData(lesson)
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
  }, [lessonId, refetchToken, viewerRole])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
