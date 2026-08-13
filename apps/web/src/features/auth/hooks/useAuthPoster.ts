import { useEffect, useState } from 'react'
import { getPublicAuthPoster } from '../api/auth-poster.api'
import type { AuthPosterContent } from '../types/auth-poster.types'

interface UseAuthPosterResult {
  data: AuthPosterContent | null
  isLoading: boolean
}

export function useAuthPoster(): UseAuthPosterResult {
  const [data, setData] = useState<AuthPosterContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const poster = await getPublicAuthPoster()
        if (!controller.signal.aborted) {
          setData(poster)
        }
      } catch {
        if (!controller.signal.aborted) {
          setData(null)
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

  return { data, isLoading }
}
