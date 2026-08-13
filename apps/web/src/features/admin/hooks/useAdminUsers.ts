import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getAdminUsers } from '../api/admin-users.api'
import type { AdminUserListItem, AdminUsersFilter } from '../types/admin.types'

interface UseAdminUsersResult {
  data: AdminUserListItem[] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useAdminUsers(filters: AdminUsersFilter): UseAdminUsersResult {
  const [data, setData] = useState<AdminUserListItem[] | null>(null)
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
        const users = await getAdminUsers(filters)
        if (!controller.signal.aborted) {
          setData(users)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is a plain object recreated by callers each render; role/status/search are the real deps.
  }, [filters.role, filters.status, filters.search, refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
