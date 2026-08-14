import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getTeacherAuthPoster, updateTeacherAuthPoster } from '../api/auth-poster.api'
import type {
  AuthPosterContent,
  AuthPosterCustomization,
} from '../types/auth-poster.types'

interface UseTeacherAuthPosterResult {
  data: AuthPosterContent | null
  isLoading: boolean
  error: ApiError | null
  isSaving: boolean
  saveFeaturedCourse: (
    featuredCourseId: string | null,
    customization: AuthPosterCustomization,
  ) => Promise<AuthPosterContent>
}

export function useTeacherAuthPoster(): UseTeacherAuthPosterResult {
  const [data, setData] = useState<AuthPosterContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      if (!hasLoadedRef.current) setIsLoading(true)
      setError(null)

      try {
        const poster = await getTeacherAuthPoster()
        if (!controller.signal.aborted) setData(poster)
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setError(
            caughtError instanceof ApiError
              ? caughtError
              : new ApiError('Unknown error', 0),
          )
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
  }, [])

  async function saveFeaturedCourse(
    featuredCourseId: string | null,
    customization: AuthPosterCustomization,
  ) {
    setIsSaving(true)
    try {
      const saved = await updateTeacherAuthPoster({ featuredCourseId, customization })
      setData(saved)
      return saved
    } finally {
      setIsSaving(false)
    }
  }

  return { data, isLoading, error, isSaving, saveFeaturedCourse }
}
