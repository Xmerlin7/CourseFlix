import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getCourseAgentRuns, startLessonAgentRun } from '../api/lesson-agents.api'
import type {
  LessonAgentRunSummary,
  UpdateAgentSettingsPayload,
} from '../types/lesson-agents.types'

const POLL_INTERVAL_MS = 5000

interface UseCourseAgentRunsResult {
  data: LessonAgentRunSummary[]
  isLoading: boolean
  error: ApiError | null
  start: (
    lessonId: string,
    overrides?: UpdateAgentSettingsPayload,
  ) => Promise<LessonAgentRunSummary>
  refetch: () => void
}

/**
 * Every run in a course, so the content manager can show a lesson's
 * agent state inline. Same plain useEffect/useState + silent-poll shape
 * as `useExamGenerationRequests` — there is no data-fetching library in
 * apps/web yet.
 */
export function useCourseAgentRuns(courseId: string): UseCourseAgentRunsResult {
  const [data, setData] = useState<LessonAgentRunSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  const hasWorkInFlight = data.some(
    (run) => run.status === 'queued' || run.status === 'running',
  )

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setError(null)
      try {
        const runs = await getCourseAgentRuns(courseId)
        if (!controller.signal.aborted) {
          setData(runs)
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
  }, [courseId, refetchToken])

  useEffect(() => {
    if (!hasWorkInFlight) return

    const timer = setInterval(() => {
      setRefetchToken((token) => token + 1)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [hasWorkInFlight])

  async function start(
    lessonId: string,
    overrides?: UpdateAgentSettingsPayload,
  ): Promise<LessonAgentRunSummary> {
    const run = await startLessonAgentRun(lessonId, overrides)
    setRefetchToken((token) => token + 1)
    return run
  }

  return {
    data,
    isLoading,
    error,
    start,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
