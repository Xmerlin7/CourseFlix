import { useCallback, useEffect, useRef } from 'react'
import { postLessonProgress } from '../api/lessons.api'
import type { UpdateProgressResponse } from '../types/lesson.types'

const HEARTBEAT_INTERVAL_MS = 15_000

interface UseProgressHeartbeatOptions {
  lessonId: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  enabled?: boolean
  externalTracking?: boolean
  // The external (YouTube/Bunny) player's own reported play state and
  // position — see useYoutubeController / useBunnyController. Required
  // whenever externalTracking is true; without them this hook has no way
  // to know whether the video is actually playing.
  externalIsPlaying?: boolean
  externalCurrentTimeSeconds?: number
  fallbackDurationSeconds?: number | null
  initialPositionSeconds?: number
  initialWatchedPercentage?: number
  onProgress?: (result: UpdateProgressResponse) => void
}

/**
 * Sends one progress heartbeat per 15s while the video is playing, plus
 * one right when it pauses or ends — never on a repeating timer while
 * paused. This holds for both the native <video> element (driven by its
 * own `play`/`pause`/`ended` events) and external YouTube/Bunny embeds
 * (driven by `externalIsPlaying`/`externalCurrentTimeSeconds`, which mirror
 * those same semantics via postMessage/player.js — see
 * useYoutubeController and useBunnyController).
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
  externalIsPlaying = false,
  externalCurrentTimeSeconds = 0,
  fallbackDurationSeconds = null,
  initialPositionSeconds = 0,
  initialWatchedPercentage = 0,
  onProgress,
}: UseProgressHeartbeatOptions): void {
  const maxReachedSecondsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Read on each tick instead of closed over, so the interval below doesn't
  // need to be torn down and rebuilt every time playback advances.
  const externalCurrentTimeRef = useRef(externalCurrentTimeSeconds)
  externalCurrentTimeRef.current = externalCurrentTimeSeconds
  // Kept out of sendHeartbeat's deps so a parent re-render (e.g. the
  // setState calls the caller makes from inside onProgress itself) can't
  // change sendHeartbeat's identity and retrigger the effects below.
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  useEffect(() => {
    const estimatedWatchedSeconds =
      fallbackDurationSeconds && initialWatchedPercentage > 0
        ? Math.floor((fallbackDurationSeconds * initialWatchedPercentage) / 100)
        : 0

    maxReachedSecondsRef.current = Math.max(initialPositionSeconds, estimatedWatchedSeconds)
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
          .then((result) => onProgressRef.current?.(result))
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
        .then((result) => onProgressRef.current?.(result))
        .catch(() => {
          // A missed heartbeat is retried on the next interval tick or the
          // next pause/ended event — nothing to surface mid-playback.
        })
    },
    [enabled, fallbackDurationSeconds, lessonId, videoRef],
  )

  useEffect(() => {
    // Mirrors the native <video> effect below: the interval only exists
    // while the player is actually playing. Previously this ran
    // unconditionally and just added a fixed 15s to a counter on every
    // tick, regardless of whether the embed was playing, paused, or even
    // still on-screen — so a paused YouTube video kept "watching" itself
    // and could reach 100%/attendance without the student watching it.
    if (!enabled || !externalTracking || !externalIsPlaying || !fallbackDurationSeconds) {
      return
    }
    const externalDurationSeconds = fallbackDurationSeconds

    function sendExternalHeartbeat() {
      // The real position the player reports, not a wall-clock guess —
      // this is what makes pause/seek/buffering reflected accurately.
      const positionSeconds = Math.floor(externalCurrentTimeRef.current)
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
      sendExternalHeartbeat()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        sendExternalHeartbeat()
      }
    }

    intervalRef.current = setInterval(tick, HEARTBEAT_INTERVAL_MS)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', sendExternalHeartbeat)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', sendExternalHeartbeat)
      // Playback stopped (paused, ended, or the effect is tearing down for
      // any other reason) — report exactly how far it actually got, same
      // as the native <video> pause/ended handler below.
      sendExternalHeartbeat()
    }
  }, [enabled, externalTracking, externalIsPlaying, fallbackDurationSeconds, sendHeartbeat])

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
