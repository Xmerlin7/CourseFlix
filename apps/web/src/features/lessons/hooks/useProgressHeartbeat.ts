import { useCallback, useEffect, useRef } from 'react'
import { postLessonProgress } from '../api/lessons.api'
import type { UpdateProgressResponse } from '../types/lesson.types'

const HEARTBEAT_INTERVAL_MS = 15_000
const HEARTBEAT_INTERVAL_SECONDS = HEARTBEAT_INTERVAL_MS / 1000

interface UseProgressHeartbeatOptions {
  lessonId: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  enabled?: boolean
  externalTracking?: boolean
  fallbackDurationSeconds?: number | null
  initialPositionSeconds?: number
  initialWatchedPercentage?: number
  onProgress?: (result: UpdateProgressResponse) => void
}

/**
 * Sends one progress heartbeat per 15s while the video is playing, plus
 * one on `pause`, `ended`, and `beforeunload` — never on a repeating timer
 * while paused, since the interval is only running between `play` and the
 * next `pause`/`ended`.
 *
 * `watchedSeconds` is the furthest point reached in this playback session
 * (a high-water mark on `currentTime`) — a simple, honest MVP proxy for
 * "unique seconds watched" (see docs/api/sprint2-lessons.md). The server
 * independently enforces that stored progress never regresses, so this
 * hook doesn't need to get that part exactly right; it only needs to
 * never report less than what was actually reached.
 *
 * Known limitation: the `beforeunload` heartbeat uses the same fetch call
 * as every other heartbeat, which browsers are free to cancel mid-flight
 * during unload. A guaranteed-delivery beacon is out of scope for this
 * MVP slice — the 15s interval already bounds how much a dropped final
 * heartbeat can lose.
 */
export function useProgressHeartbeat({
  lessonId,
  videoRef,
  enabled = true,
  externalTracking = false,
  fallbackDurationSeconds = null,
  initialPositionSeconds = 0,
  initialWatchedPercentage = 0,
  onProgress,
}: UseProgressHeartbeatOptions): void {
  const maxReachedSecondsRef = useRef(0)
  const externalPositionSecondsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const estimatedWatchedSeconds =
      fallbackDurationSeconds && initialWatchedPercentage > 0
        ? Math.floor((fallbackDurationSeconds * initialWatchedPercentage) / 100)
        : 0

    maxReachedSecondsRef.current = Math.max(initialPositionSeconds, estimatedWatchedSeconds)
    externalPositionSecondsRef.current = initialPositionSeconds
  }, [fallbackDurationSeconds, initialPositionSeconds, initialWatchedPercentage, lessonId])

  const sendHeartbeat = useCallback(
    (override?: {
      positionSeconds: number
      watchedSeconds: number
      durationSeconds?: number
    }) => {
      if (!enabled) {
        return
      }

      if (override) {
        postLessonProgress(lessonId, override)
          .then((result) => onProgress?.(result))
          .catch(() => {
            // A missed heartbeat is retried on the next interval tick or
            // lifecycle event — nothing to surface mid-playback.
          })
        return
      }

      const video = videoRef.current
      if (!video) {
        return
      }

      const positionSeconds = Math.floor(video.currentTime)
      maxReachedSecondsRef.current = Math.max(
        maxReachedSecondsRef.current,
        positionSeconds,
      )

      const videoDurationSeconds =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.floor(video.duration)
          : (fallbackDurationSeconds ?? undefined)

      postLessonProgress(lessonId, {
        positionSeconds,
        watchedSeconds: maxReachedSecondsRef.current,
        ...(videoDurationSeconds ? { durationSeconds: videoDurationSeconds } : {}),
      })
        .then((result) => onProgress?.(result))
        .catch(() => {
          // A missed heartbeat is retried on the next interval tick or the
          // next pause/ended event — nothing to surface mid-playback.
        })
    },
    [enabled, fallbackDurationSeconds, lessonId, onProgress, videoRef],
  )

  useEffect(() => {
    if (!enabled || !externalTracking || !fallbackDurationSeconds) {
      return
    }
    const externalDurationSeconds = fallbackDurationSeconds

    function stopInterval() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    function sendExternalHeartbeat() {
      const positionSeconds = externalPositionSecondsRef.current
      maxReachedSecondsRef.current = Math.max(maxReachedSecondsRef.current, positionSeconds)
      sendHeartbeat({
        positionSeconds,
        watchedSeconds: maxReachedSecondsRef.current,
        durationSeconds: externalDurationSeconds,
      })
    }

    function tick() {
      if (document.visibilityState === 'hidden') {
        return
      }

      externalPositionSecondsRef.current += HEARTBEAT_INTERVAL_SECONDS
      sendExternalHeartbeat()
    }

    function startInterval() {
      stopInterval()
      intervalRef.current = setInterval(tick, HEARTBEAT_INTERVAL_MS)
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        sendExternalHeartbeat()
        stopInterval()
      } else {
        startInterval()
      }
    }

    startInterval()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', sendExternalHeartbeat)

    return () => {
      stopInterval()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', sendExternalHeartbeat)
    }
  }, [enabled, externalTracking, fallbackDurationSeconds, sendHeartbeat])

  useEffect(() => {
    const video = videoRef.current
    if (!enabled || externalTracking || !video) {
      return
    }

    function stopInterval() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    function handlePlay() {
      stopInterval()
      intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
    }

    function handlePauseOrEnded() {
      stopInterval()
      sendHeartbeat()
    }

    function handleBeforeUnload() {
      sendHeartbeat()
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePauseOrEnded)
    video.addEventListener('ended', handlePauseOrEnded)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      stopInterval()
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePauseOrEnded)
      video.removeEventListener('ended', handlePauseOrEnded)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, externalTracking, videoRef, sendHeartbeat])
}
