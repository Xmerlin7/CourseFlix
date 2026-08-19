import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import {
  approveAgentStep,
  getAgentRun,
  publishAgentRun,
  rejectAgentStep,
  sendAgentStepFeedback,
} from '../api/lesson-agents.api'
import type { LessonAgentRunDetail } from '../types/lesson-agents.types'

// Faster than exam generation's 5s: this view is a live feed of agents
// handing work to each other, and a five-second gap makes a handoff read
// as a jump rather than a step.
const POLL_INTERVAL_MS = 2500

interface UseAgentRunResult {
  data: LessonAgentRunDetail | null
  isLoading: boolean
  error: ApiError | null
  approve: (stepId: string) => Promise<void>
  reject: (stepId: string) => Promise<void>
  sendFeedback: (stepId: string, message: string) => Promise<void>
  publish: () => Promise<void>
  refetch: () => void
}

/**
 * Polls one run while its agents are working.
 *
 * The whole run lives in the database, so this hook holds no state the
 * teacher can lose — closing the page and coming back later re-renders
 * exactly where the crew got to, which is the point of running them in
 * the background at all.
 */
export function useAgentRun(runId: string | null): UseAgentRunResult {
  const [data, setData] = useState<LessonAgentRunDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  // Derived rather than cleared in the effect: with no run selected there
  // is nothing to show, and blanking state from inside an effect costs an
  // extra render pass for a value that's a pure function of `runId`.
  const visibleData = runId ? data : null
  const isWorking =
    visibleData?.status === 'queued' || visibleData?.status === 'running'

  useEffect(() => {
    if (!runId) return

    const controller = new AbortController()

    async function load() {
      setError(null)
      try {
        const detail = await getAgentRun(runId as string)
        if (!controller.signal.aborted) {
          setData(detail)
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
  }, [runId, refetchToken])

  useEffect(() => {
    if (!isWorking) return

    const timer = setInterval(() => {
      setRefetchToken((token) => token + 1)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isWorking])

  // Every action returns the full refreshed run, so the panel updates
  // from the response instead of waiting out a poll interval.
  async function approve(stepId: string) {
    if (!runId) return
    setData(await approveAgentStep(runId, stepId))
  }

  async function reject(stepId: string) {
    if (!runId) return
    setData(await rejectAgentStep(runId, stepId))
  }

  async function sendFeedback(stepId: string, message: string) {
    if (!runId) return
    setData(await sendAgentStepFeedback(runId, stepId, message))
  }

  async function publish() {
    if (!runId) return
    setData(await publishAgentRun(runId))
  }

  return {
    data: visibleData,
    isLoading: runId ? isLoading : false,
    error,
    approve,
    reject,
    sendFeedback,
    publish,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
