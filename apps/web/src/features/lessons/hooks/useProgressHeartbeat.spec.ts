import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { useProgressHeartbeat } from './useProgressHeartbeat'

const PROGRESS_URL = `${env.apiBaseUrl}/lessons/lesson-1/progress`

interface ProgressPayload {
  positionSeconds: number
  watchedSeconds: number
  durationSeconds?: number
}

function captureProgressRequests(): ProgressPayload[] {
  const requests: ProgressPayload[] = []
  server.use(
    http.post(PROGRESS_URL, async ({ request }) => {
      requests.push((await request.json()) as ProgressPayload)
      return HttpResponse.json({ watchedPercentage: 0, status: 'in_progress', attendanceAwarded: false })
    }),
  )
  return requests
}

// A real <video> element is irrelevant to the external (YouTube/Bunny)
// tracking path exercised below — it only needs to satisfy the ref's type.
const videoRef = { current: null }

/**
 * Controls the hook's internal 15s interval by hand instead of faking the
 * global clock — `vi.useFakeTimers()` also freezes the timers Node's
 * `fetch` (used by MSW under the hood) relies on internally, which hangs
 * every request in this suite. Mirrors the same manual setInterval spy
 * already used in StudentLessonPage.spec.tsx.
 */
function mockIntervals() {
  let nextId = 1
  const timers = new Map<number, () => void>()

  const setIntervalSpy = vi
    .spyOn(globalThis, 'setInterval')
    .mockImplementation((handler: TimerHandler) => {
      const id = nextId++
      if (typeof handler === 'function') {
        timers.set(id, handler as () => void)
      }
      return id as unknown as ReturnType<typeof setInterval>
    })

  const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval').mockImplementation((id) => {
    timers.delete(id as unknown as number)
  })

  return {
    fireTicks() {
      Array.from(timers.values()).forEach((handler) => handler())
    },
    restore() {
      setIntervalSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    },
  }
}

// Real (unmocked) macrotask tick, to let the mocked fetch/MSW promise chain
// settle — testing-library's own `waitFor` can't be used here since it
// polls via `setInterval` too, which the spy above intentionally disarms.
function flushAsync() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0))
}

describe('useProgressHeartbeat — external (YouTube/Bunny) tracking', () => {
  let intervals: ReturnType<typeof mockIntervals>

  beforeEach(() => {
    intervals = mockIntervals()
  })

  afterEach(() => {
    intervals.restore()
  })

  it('never reports progress while the embedded player is paused, no matter how many ticks pass', async () => {
    // Regression test: a paused YouTube embed used to still "watch itself"
    // because the heartbeat ran on a plain interval that assumed 15s of
    // playback per tick regardless of the player's actual state.
    const requests = captureProgressRequests()

    renderHook(() =>
      useProgressHeartbeat({
        lessonId: 'lesson-1',
        videoRef,
        externalTracking: true,
        externalIsPlaying: false,
        externalCurrentTimeSeconds: 0,
        fallbackDurationSeconds: 600,
      }),
    )

    intervals.fireTicks()
    intervals.fireTicks()
    await act(() => flushAsync())

    expect(requests).toHaveLength(0)
  })

  it('reports the player\'s real current time on each tick, not a fixed 15s-per-tick estimate', async () => {
    const requests = captureProgressRequests()

    const { rerender } = renderHook((props) => useProgressHeartbeat(props), {
      initialProps: {
        lessonId: 'lesson-1',
        videoRef,
        externalTracking: true,
        externalIsPlaying: true,
        externalCurrentTimeSeconds: 4,
        fallbackDurationSeconds: 600,
      },
    })

    // By the time the tick fires, the player reports 55s (a seek, or
    // simply the video's own clock) — the heartbeat must send that real
    // value, not "15" derived from counting wall-clock ticks.
    rerender({
      lessonId: 'lesson-1',
      videoRef,
      externalTracking: true,
      externalIsPlaying: true,
      externalCurrentTimeSeconds: 55,
      fallbackDurationSeconds: 600,
    })

    intervals.fireTicks()
    await act(() => flushAsync())

    expect(requests).toHaveLength(1)
    expect(requests[0]).toEqual({ positionSeconds: 55, watchedSeconds: 55, durationSeconds: 600 })
  })

  it('freezes progress the moment the player pauses, and does not keep advancing on its own afterward', async () => {
    const requests = captureProgressRequests()

    const { rerender, unmount } = renderHook((props) => useProgressHeartbeat(props), {
      initialProps: {
        lessonId: 'lesson-1',
        videoRef,
        externalTracking: true,
        externalIsPlaying: true,
        externalCurrentTimeSeconds: 60,
        fallbackDurationSeconds: 600,
      },
    })

    // Student watched exactly one minute, then paused — matches the
    // reported scenario verbatim. The hook reports this pause point
    // immediately (its cleanup fires as soon as `externalIsPlaying` flips),
    // without waiting for the next tick.
    rerender({
      lessonId: 'lesson-1',
      videoRef,
      externalTracking: true,
      externalIsPlaying: false,
      externalCurrentTimeSeconds: 60,
      fallbackDurationSeconds: 600,
    })
    await act(() => flushAsync())

    expect(requests).toHaveLength(1)
    expect(requests[0]).toEqual({ positionSeconds: 60, watchedSeconds: 60, durationSeconds: 600 })

    // The pause already tore the interval down, so there is nothing left
    // for a stray tick to fire — proves it, instead of just asserting the
    // absence of further activity.
    intervals.fireTicks()
    await act(() => flushAsync())
    expect(requests).toHaveLength(1)

    unmount()
  })
})
