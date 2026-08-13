import { useEffect, useState } from 'react'
import { getAdminQuotas } from '../api/teacher-billing.api'
import type { AdminTeacherQuota } from '../types/teacher-billing.types'

interface UseAdminQuotasResult {
  data: AdminTeacherQuota[] | null
  isLoading: boolean
  error: boolean
  refetch: () => void
}

export function useAdminQuotas(enabled = true): UseAdminQuotasResult {
  const [data, setData] = useState<AdminTeacherQuota[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(false)
      try {
        const quotas = await getAdminQuotas()
        if (!controller.signal.aborted) setData(quotas)
      } catch {
        if (!controller.signal.aborted) setError(true)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [enabled, refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
