import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getTeacherInterventions } from '../api/interventions.api'
import type { TeacherIntervention } from '../types/intervention.types'

interface UseTeacherInterventionsResult {
  data: TeacherIntervention[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useTeacherInterventions(): UseTeacherInterventionsResult {
  const [data, setData] = useState<TeacherIntervention[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)
  // Tells a manual refetch() apart from a first load or a switch to a
  // different target; see the guard inside the effect below.
  const lastRefetchTokenRef = useRef(refetchToken)

  useEffect(() => {
    const isManualRefetch = lastRefetchTokenRef.current !== refetchToken
    lastRefetchTokenRef.current = refetchToken
    const controller = new AbortController()

    async function load() {
      // A manual refetch keeps the current content mounted: swapping in a
      // full-page skeleton collapses the page height, which makes the
      // browser reset scroll to the top after every save/edit/delete.
      if (!isManualRefetch) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const interventions = await getTeacherInterventions()
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
