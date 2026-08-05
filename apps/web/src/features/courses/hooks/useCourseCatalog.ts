import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getCourseCatalog } from '../api/courses.api'
import type { CourseCatalogItem } from '../types/course.types'

interface UseCourseCatalogResult {
  data: CourseCatalogItem[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useCourseCatalog(): UseCourseCatalogResult {
  const [data, setData] = useState<CourseCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const courses = await getCourseCatalog()
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
  }, [refetchToken])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
