import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getStudentEnrollments } from '../api/student.api'
import type {
  StudentEnrollment,
  StudentEnrollmentFilters,
} from '../types/student.types'

interface UseStudentEnrollmentsResult {
  data: StudentEnrollment[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useStudentEnrollments(
  filters: StudentEnrollmentFilters = {},
): UseStudentEnrollmentsResult {
  // Destructure into primitives on purpose: `filters` as a whole object
  // has a new identity every render for callers passing an inline
  // literal (e.g. `useStudentEnrollments({ status })`), which would
  // otherwise refetch on every render.
  const { status, gradeLevel } = filters
  const [data, setData] = useState<StudentEnrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const enrollments = await getStudentEnrollments({ status, gradeLevel })
        if (!controller.signal.aborted) {
          setData(enrollments)
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
  }, [status, gradeLevel, refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}