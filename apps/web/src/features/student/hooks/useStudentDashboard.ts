import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getStudentDashboard } from '../api/student.api'
import type { StudentDashboard } from '../types/student.types'

interface UseStudentDashboardResult {
  data: StudentDashboard | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
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
  const [refetchToken, setRefetchToken] = useState(0)
  // True once a response has landed. Gates the skeleton — see the guard
  // inside the effect below.
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      // Only the first load shows a skeleton; every load after it keeps
      // the current content mounted. Swapping in a full-page skeleton
      // collapses the page height, which makes the browser reset scroll
      // to the top — that fired after every save/edit/delete, and once
      // per keystroke on the pages whose search term is part of the
      // request, where it read as the page reloading mid-word.
      if (!hasLoadedRef.current) {
        setIsLoading(true)
      }
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
          hasLoadedRef.current = true
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [refetchToken])

  return { data, isLoading, error, refetch: () => setRefetchToken((token) => token + 1) }
}