import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getStudentInterventions } from '../api/interventions.api'
import type { StudentIntervention } from '../types/intervention.types'

interface UseStudentInterventionsResult {
  data: StudentIntervention[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useStudentInterventions(): UseStudentInterventionsResult {
  const [data, setData] = useState<StudentIntervention[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const interventions = await getStudentInterventions()
        if (!controller.signal.aborted) {
          setData(interventions)
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
  }, [refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
