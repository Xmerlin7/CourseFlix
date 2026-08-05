import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getTeacherCourses } from '../api/teacher.api'
import type { TeacherCourse } from '../types/teacher.types'

interface UseTeacherCoursesResult {
  data: TeacherCourse[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

// NOTE: plain useEffect/useState, matching useStudentEnrollments.ts — no
// data-fetching library is installed in apps/web yet.
export function useTeacherCourses(filters: { status?: string } = {}): UseTeacherCoursesResult {
  const { status } = filters
  const [data, setData] = useState<TeacherCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const courses = await getTeacherCourses({ status })
        if (!controller.signal.aborted) {
          setData(courses)
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
  }, [status, refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
