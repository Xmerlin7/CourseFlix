import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getAdminAuthPoster, updateAdminAuthPoster } from '../api/auth-poster.api'
import type { AuthPosterContent } from '../types/auth-poster.types'

interface UseAdminAuthPosterResult {
  data: AuthPosterContent | null
  isLoading: boolean
  error: ApiError | null
  isSaving: boolean
  saveFeaturedCourse: (featuredCourseId: string | null) => Promise<AuthPosterContent>
  refetch: () => void
}

export function useAdminAuthPoster(): UseAdminAuthPosterResult {
  const [data, setData] = useState<AuthPosterContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      if (!hasLoadedRef.current) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const poster = await getAdminAuthPoster()
        if (!controller.signal.aborted) {
          setData(poster)
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

  async function saveFeaturedCourse(featuredCourseId: string | null) {
    setIsSaving(true)
    try {
      const saved = await updateAdminAuthPoster({ featuredCourseId })
      setData(saved)
      return saved
    } finally {
      setIsSaving(false)
    }
  }

  return {
    data,
    isLoading,
    error,
    isSaving,
    saveFeaturedCourse,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
