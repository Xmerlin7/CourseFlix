import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getStudentDashboard } from '../api/student.api'
import type { StudentDashboard } from '../types/student.types'

interface UseStudentDashboardResult {
  data: StudentDashboard | null
  isLoading: boolean
  error: ApiError | null
}

// NOTE: no data-fetching library (e.g. TanStack Query) is installed in
// apps/web yet, so this uses plain useEffect/useState rather than adding
// a new dependency unilaterally. AbortController doesn't cancel the
// underlying fetch (httpClient doesn't accept a signal yet), it only
// prevents state updates after unmount.
export function useStudentDashboard(): UseStudentDashboardResult {
  const [data, setData] = useState<StudentDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const dashboard = await getStudentDashboard()
        if (!controller.signal.aborted) {
          setData(dashboard)
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
  }, [])

  return { data, isLoading, error }
}