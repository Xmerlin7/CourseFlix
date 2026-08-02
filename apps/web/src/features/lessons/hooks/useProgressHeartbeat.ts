import { useCallback, useEffect, useRef } from 'react'
import { postLessonProgress } from '../api/lessons.api'
import type { UpdateProgressResponse } from '../types/lesson.types'

const HEARTBEAT_INTERVAL_MS = 15_000

interface UseProgressHeartbeatOptions {
  lessonId: string
  videoRef: React.RefObject<HTMLVideoElement | null>
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
  onProgress,
}: UseProgressHeartbeatOptions): void {
  const maxReachedSecondsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sendHeartbeat = useCallback(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const positionSeconds = Math.floor(video.currentTime)
    maxReachedSecondsRef.current = Math.max(
      maxReachedSecondsRef.current,
      positionSeconds,
    )

    postLessonProgress(lessonId, {
      positionSeconds,
      watchedSeconds: maxReachedSecondsRef.current,
    })
      .then((result) => onProgress?.(result))
      .catch(() => {
        // A missed heartbeat is retried on the next interval tick or the
        // next pause/ended event — nothing to surface mid-playback.
      })
  }, [lessonId, videoRef, onProgress])

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
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

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePauseOrEnded)
    video.addEventListener('ended', handlePauseOrEnded)
    window.addEventListener('beforeunload', sendHeartbeat)

    return () => {
      stopInterval()
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePauseOrEnded)
      video.removeEventListener('ended', handlePauseOrEnded)
      window.removeEventListener('beforeunload', sendHeartbeat)
    }
  }, [videoRef, sendHeartbeat])
}
