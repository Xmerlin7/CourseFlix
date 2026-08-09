import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getVideoQaStatus } from '../api/video-qa.api'
import type { VideoQaTranscriptStatus } from '../types/video-qa.types'

interface UseVideoQaStatusResult {
  status: VideoQaTranscriptStatus | null
  isLoading: boolean
  error: ApiError | null
}

const POLL_INTERVAL_MS = 6000
const POLLING_STATUSES: VideoQaTranscriptStatus[] = ['pending', 'processing']

// Same useEffect/useState fetch pattern as useStudentDocuments.ts — no
// data-fetching library is installed in apps/web. Drives whether the
// assistant panel is enabled for the currently playing video.
export function useVideoQaStatus(videoId: string): UseVideoQaStatusResult {
  const [status, setStatus] = useState<VideoQaTranscriptStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    if (!videoId) {
      setStatus(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    let pollId: ReturnType<typeof setInterval> | null = null

    function stopPolling() {
      if (pollId) {
        clearInterval(pollId)
        pollId = null
      }
    }

    // Ingestion (or a backfill — see backfill-video-transcripts.ts) runs in
    // the background after a lesson's video is saved, so `pending`/
    // `processing` isn't final — poll until it lands on `completed` or
    // `failed` so the panel unlocks on its own, no manual page refresh.
    function handleStatus(nextStatus: VideoQaTranscriptStatus) {
      setStatus(nextStatus)
      if (POLLING_STATUSES.includes(nextStatus)) {
        if (!pollId) {
          pollId = setInterval(poll, POLL_INTERVAL_MS)
        }
      } else {
        stopPolling()
      }
    }

    function poll() {
      getVideoQaStatus(videoId)
        .then((response) => {
          if (!cancelled) {
            handleStatus(response.status)
          }
        })
        .catch(() => {
          // A missed poll is silently retried on the next tick — only the
          // initial fetch below surfaces an error to the UI.
        })
    }

    setIsLoading(true)
    setError(null)

    getVideoQaStatus(videoId)
      .then((response) => {
        if (!cancelled) {
          handleStatus(response.status)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      stopPolling()
    }
  }, [videoId])

  return { status, isLoading, error }
}
