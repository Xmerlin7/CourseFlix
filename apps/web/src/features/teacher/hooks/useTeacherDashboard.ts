import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getTeacherDashboard } from '../api/teacher.api'
import type { TeacherDashboard } from '../types/teacher.types'

interface UseTeacherDashboardResult {
  data: TeacherDashboard | null
  isLoading: boolean
  error: ApiError | null
}

// NOTE: plain useEffect/useState, matching useStudentDashboard.ts — no
// data-fetching library is installed in apps/web yet.
export function useTeacherDashboard(): UseTeacherDashboardResult {
  const [data, setData] = useState<TeacherDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const dashboard = await getTeacherDashboard()
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
