import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerController } from '../types/player-controller.types'

interface BunnyPlayerJsInstance {
  on: (event: string, callback: (value?: unknown) => void) => void
  play: () => void
  pause: () => void
  setCurrentTime: (seconds: number) => void
  getDuration: (callback: (seconds: number) => void) => void
  setVolume: (value: number) => void
  getVolume: (callback: (value: number) => void) => void
  mute: () => void
  unmute: () => void
  getMuted: (callback: (muted: boolean) => void) => void
}

declare global {
  interface Window {
    playerjs?: {
      Player: new (iframe: HTMLIFrameElement) => BunnyPlayerJsInstance
    }
  }
}

// Bunny Stream's embed doesn't support hiding its own native controls (per
// their docs), so this only drives play/pause for the anti-capture guard —
// see StudentLessonPage, which keeps Bunny's native control bar and just
// adds a supplementary fullscreen button on top. Bunny documents that its
// player is controllable via the third-party player.js library loaded from
// their own CDN: https://bunny.net/docs/stream/playback-api
const PLAYERJS_SRC = '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js'
let playerjsLoadPromise: Promise<void> | null = null

function loadPlayerjs(): Promise<void> {
  if (window.playerjs) {
    return Promise.resolve()
  }
  if (!playerjsLoadPromise) {
    playerjsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = PLAYERJS_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load player.js'))
      document.head.appendChild(script)
    })
  }
  return playerjsLoadPromise
}

export function useBunnyController(
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
  const playerRef = useRef<BunnyPlayerJsInstance | null>(null)

  useEffect(() => {
    setIsReady(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setBufferedFraction(0)
    playerRef.current = null

    if (!enabled) {
      return
    }
    const iframe = iframeRef.current
    if (!iframe) {
      return
    }

    let cancelled = false

    loadPlayerjs()
      .then(() => {
        if (cancelled || !window.playerjs) {
          return
        }
        const player = new window.playerjs.Player(iframe)
        playerRef.current = player

        player.on('ready', () => {
          if (cancelled) {
            return
          }
          setIsReady(true)
          player.getDuration((seconds) => !cancelled && setDuration(seconds || 0))
          player.getVolume((value) => !cancelled && setVolumeState((value ?? 100) / 100))
          player.getMuted((value) => !cancelled && setMuted(Boolean(value)))
        })
        player.on('play', () => !cancelled && setIsPlaying(true))
        player.on('pause', () => !cancelled && setIsPlaying(false))
        player.on('ended', () => !cancelled && setIsPlaying(false))
        player.on('timeupdate', (value) => {
          if (cancelled) {
            return
          }
          const data = value as { seconds?: number; duration?: number }
          if (typeof data?.seconds === 'number') {
            setCurrentTime(data.seconds)
          }
          if (typeof data?.duration === 'number' && data.duration > 0) {
            setDuration(data.duration)
          }
        })
        player.on('progress', (value) => {
          if (cancelled) {
            return
          }
          const data = value as { percent?: number }
          if (typeof data?.percent === 'number') {
            setBufferedFraction(data.percent)
          }
        })
      })
      .catch(() => {
        // Bunny's own controls (never removed) keep working regardless.
      })

    return () => {
      cancelled = true
      playerRef.current = null
    }
  }, [enabled, iframeRef, mediaKey])

  const play = useCallback(() => playerRef.current?.play(), [])
  const pause = useCallback(() => playerRef.current?.pause(), [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pause()
    } else {
      playerRef.current?.play()
    }
  }, [isPlaying])

  const seek = useCallback((seconds: number) => playerRef.current?.setCurrentTime(seconds), [])

  const setVolume = useCallback((value: number) => {
    playerRef.current?.setVolume(Math.round(Math.max(0, Math.min(1, value)) * 100))
  }, [])

  const toggleMute = useCallback(() => {
    if (muted) {
      playerRef.current?.unmute()
    } else {
      playerRef.current?.mute()
    }
  }, [muted])

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
