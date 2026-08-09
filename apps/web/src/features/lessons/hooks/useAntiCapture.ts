import { useCallback, useEffect, useRef, useState } from 'react'

export type CaptureBlockReason = 'window-blur' | 'devtools' | 'print-screen' | null

interface UseAntiCaptureOptions {
  enabled: boolean
  isPlaying: boolean
  onPause: () => void
  onResume: () => void
}

interface UseAntiCaptureResult {
  blockReason: CaptureBlockReason
  resume: () => void
}

const DEVTOOLS_SIZE_THRESHOLD_PX = 220
const DEVTOOLS_POLL_MS = 1500

/**
 * Best-effort deterrents around a lesson video: no web page can stop OS-level
 * screen capture, but this kills playback the moment the window loses focus,
 * a screenshot/devtools shortcut fires, or devtools is heuristically
 * detected — and it pairs with the per-student watermark (see
 * StudentLessonPage) so anything that does get out is traceable back to the
 * account that captured it. Backend-agnostic: `onPause`/`onResume` are
 * whatever the active PlayerController (native video / YouTube / Bunny)
 * provides, so this works the same regardless of video source.
 */
export function useAntiCapture({ enabled, isPlaying, onPause, onResume }: UseAntiCaptureOptions): UseAntiCaptureResult {
  const [blockReason, setBlockReason] = useState<CaptureBlockReason>(null)
  const blockReasonRef = useRef<CaptureBlockReason>(null)
  const isPlayingRef = useRef(isPlaying)
  const wasPlayingRef = useRef(false)
  const onPauseRef = useRef(onPause)
  const onResumeRef = useRef(onResume)
  isPlayingRef.current = isPlaying
  onPauseRef.current = onPause
  onResumeRef.current = onResume

  const setReason = useCallback((reason: CaptureBlockReason) => {
    blockReasonRef.current = reason
    setBlockReason(reason)
  }, [])

  const pauseVideo = useCallback(() => {
    if (isPlayingRef.current) {
      wasPlayingRef.current = true
      onPauseRef.current()
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      return
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        pauseVideo()
        return
      }
      if (wasPlayingRef.current && !blockReasonRef.current) {
        wasPlayingRef.current = false
        onResumeRef.current()
      }
    }

    function handleBlur() {
      pauseVideo()
      setReason('window-blur')
    }

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key
      const isPrintScreen = key === 'PrintScreen'
      const isDevtoolsShortcut =
        key === 'F12' ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(key)) ||
        (event.metaKey && event.altKey && (key === 'I' || key === 'i'))
      const isSaveOrPrintOrSource =
        (event.ctrlKey || event.metaKey) && !event.shiftKey && ['s', 'S', 'p', 'P', 'u', 'U'].includes(key)

      if (isPrintScreen) {
        pauseVideo()
        setReason('print-screen')
        navigator.clipboard?.writeText(' ').catch(() => {})
        return
      }

      if (isDevtoolsShortcut || isSaveOrPrintOrSource) {
        event.preventDefault()
        if (isDevtoolsShortcut) {
          pauseVideo()
          setReason('devtools')
        }
      }
    }

    let devtoolsOpen = false
    function pollDevtools() {
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight
      const isOpen = widthDiff > DEVTOOLS_SIZE_THRESHOLD_PX || heightDiff > DEVTOOLS_SIZE_THRESHOLD_PX

      if (isOpen && !devtoolsOpen) {
        devtoolsOpen = true
        pauseVideo()
        setReason('devtools')
      } else if (!isOpen && devtoolsOpen) {
        devtoolsOpen = false
        if (blockReasonRef.current === 'devtools') {
          setReason(null)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('keydown', handleKeyDown)
    const pollId = window.setInterval(pollDevtools, DEVTOOLS_POLL_MS)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('keydown', handleKeyDown)
      window.clearInterval(pollId)
    }
  }, [enabled, pauseVideo, setReason])

  const resume = useCallback(() => {
    wasPlayingRef.current = false
    setReason(null)
    onResumeRef.current()
  }, [setReason])

  return { blockReason, resume }
}
