import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getCourseDetail } from '../api/courses.api'
import type { CourseDetail } from '../types/course.types'

interface UseCourseDetailResult {
  data: CourseDetail | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

// NOTE: plain useEffect/useState, matching useStudentDashboard.ts — no
// data-fetching library is installed in apps/web yet.
export function useCourseDetail(courseId: string): UseCourseDetailResult {
  const [data, setData] = useState<CourseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const course = await getCourseDetail(courseId)
        if (!controller.signal.aborted) {
          setData(course)
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
  }, [courseId, refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
