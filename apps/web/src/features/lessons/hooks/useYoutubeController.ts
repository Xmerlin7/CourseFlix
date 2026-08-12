import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerController } from '../types/player-controller.types'

interface YoutubeInfoDelivery {
  currentTime?: number
  duration?: number
  videoLoadedFraction?: number
  volume?: number
  muted?: boolean
  playerState?: number
}

const YT_STATE_PLAYING = 1
const LISTENING_RESEND_MS = 2000

/**
 * Drives the custom Material control bar for a YouTube embed (rendered with
 * `controls=0&disablekb=1` — see getIframeEmbedUrl) via the documented
 * postMessage IFrame API: commands go out as `{event:'command', func, args}`,
 * and once the iframe is told `{event:'listening'}` it starts pushing
 * `infoDelivery` messages a few times a second with the current playback
 * state — see https://developers.google.com/youtube/iframe_api_reference.
 *
 * `mediaKey` (the lesson/video id) forces a clean re-subscribe on lesson
 * navigation, since the <iframe> node is remounted via `key` but `iframeRef`
 * itself keeps the same identity.
 */
export function useYoutubeController(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  mediaKey: string,
): PlayerController {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedFraction, setBufferedFraction] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [muted, setMuted] = useState(false)
  const wasMutedBeforeRef = useRef(false)

  const postCommand = useCallback(
    (func: string, args: unknown[] = []) => {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
    },
    [iframeRef],
  )

  useEffect(() => {
    setIsReady(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setBufferedFraction(0)

    if (!enabled) {
      return
    }
    const iframe = iframeRef.current
    if (!iframe) {
      return
    }

    function sendListening() {
      iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'lesson-player' }), '*')
    }

    function handleMessage(event: MessageEvent) {
      if (event.source !== iframe?.contentWindow) {
        return
      }
      let parsed: { event?: string; info?: YoutubeInfoDelivery }
      try {
        parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      if (parsed?.event !== 'infoDelivery' || !parsed.info) {
        return
      }
      const info = parsed.info
      setIsReady(true)
      if (typeof info.currentTime === 'number') {
        setCurrentTime(info.currentTime)
      }
      if (typeof info.duration === 'number' && info.duration > 0) {
        setDuration(info.duration)
      }
      if (typeof info.videoLoadedFraction === 'number') {
        setBufferedFraction(info.videoLoadedFraction)
      }
      if (typeof info.volume === 'number') {
        setVolumeState(info.volume / 100)
      }
      if (typeof info.muted === 'boolean') {
        setMuted(info.muted)
      }
      if (typeof info.playerState === 'number') {
        setIsPlaying(info.playerState === YT_STATE_PLAYING)
      }
    }

    window.addEventListener('message', handleMessage)
    iframe.addEventListener('load', sendListening)
    sendListening()
    const resendId = window.setInterval(sendListening, LISTENING_RESEND_MS)

    return () => {
      window.removeEventListener('message', handleMessage)
      iframe.removeEventListener('load', sendListening)
      window.clearInterval(resendId)
    }
  }, [enabled, iframeRef, mediaKey])

  const play = useCallback(() => postCommand('playVideo'), [postCommand])
  const pause = useCallback(() => postCommand('pauseVideo'), [postCommand])

  const togglePlay = useCallback(() => {
    postCommand(isPlaying ? 'pauseVideo' : 'playVideo')
  }, [isPlaying, postCommand])

  const seek = useCallback((seconds: number) => postCommand('seekTo', [seconds, true]), [postCommand])

  const setVolume = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(1, value))
      postCommand('setVolume', [Math.round(clamped * 100)])
      if (clamped > 0 && wasMutedBeforeRef.current) {
        postCommand('unMute')
      }
    },
    [postCommand],
  )

  const toggleMute = useCallback(() => {
    wasMutedBeforeRef.current = !muted
    postCommand(muted ? 'unMute' : 'mute')
  }, [muted, postCommand])

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    bufferedFraction,
    volume,
    muted,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
  }
}
