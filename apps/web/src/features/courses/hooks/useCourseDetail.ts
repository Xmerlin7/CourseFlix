import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getCourseDetail } from '../api/courses.api'
import type { CourseDetail } from '../types/course.types'

interface UseCourseDetailResult {
  data: CourseDetail | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

// Same cadence as useCourseDocuments' ingestion poll.
const POLL_INTERVAL_MS = 5000

// NOTE: plain useEffect/useState, matching useStudentDashboard.ts — no
// data-fetching library is installed in apps/web yet.
export function useCourseDetail(courseId: string): UseCourseDetailResult {
  const [data, setData] = useState<CourseDetail | null>(null)
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
        const course = await getCourseDetail(courseId)
        if (!controller.signal.aborted) {
          setData(course)
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
  }, [courseId, refetchToken])

  // Video moderation runs asynchronously in the worker, so a lesson sits
  // at `pending` for a while after upload and then flips to approved or
  // rejected with no client action. Poll until nothing is pending, then
  // stop — same shape as useCourseDocuments' ingestion poll. Only the
  // teacher/assistant view ever sees a status here (the API omits it for
  // students), so this never adds load to a student's page.
  const hasPendingModeration = (data?.sections ?? []).some((section) =>
    section.lessons.some((lesson) => lesson.videoModerationStatus === 'pending'),
  )

  useEffect(() => {
    if (!hasPendingModeration) {
      return
    }

    const timer = setInterval(() => {
      setRefetchToken((token) => token + 1)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [hasPendingModeration])

  return {
    data,
    isLoading,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
