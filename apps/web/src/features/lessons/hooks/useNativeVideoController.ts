import { useCallback, useEffect, useState } from 'react'
import type { PlayerController } from '../types/player-controller.types'

/**
 * Drives the custom Material control bar for a plain <video> element.
 * `mediaKey` should be the lesson/video id — StudentLessonPage remounts the
 * <video> node (via a `key`) on every lesson change, and since `videoRef`
 * itself never changes identity, the listener-attachment effect below needs
 * `mediaKey` in its deps to know it must re-subscribe to the new node.
 */
export function useNativeVideoController(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  mediaKey: string,
): PlayerController {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedFraction, setBufferedFraction] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    setIsReady(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setBufferedFraction(0)
    if (!video) {
      return
    }
    // TS no longer preserves narrowing inside the closures below, so bind
    // the (now non-null) node to a fresh const the handlers can reference.
    const media = video

    function handleLoadedMetadata() {
      setDuration(media.duration || 0)
      setVolumeState(media.volume)
      setMuted(media.muted)
      setIsReady(true)
    }
    function handleTimeUpdate() {
      setCurrentTime(media.currentTime)
    }
    function handleProgress() {
      if (media.buffered.length > 0 && media.duration > 0) {
        setBufferedFraction(media.buffered.end(media.buffered.length - 1) / media.duration)
      }
    }
    function handlePlay() {
      setIsPlaying(true)
    }
    function handlePause() {
      setIsPlaying(false)
    }
    function handleVolumeChange() {
      setVolumeState(media.volume)
      setMuted(media.muted)
    }
    function handleDurationChange() {
      setDuration(media.duration || 0)
    }

    media.addEventListener('loadedmetadata', handleLoadedMetadata)
    media.addEventListener('timeupdate', handleTimeUpdate)
    media.addEventListener('progress', handleProgress)
    media.addEventListener('play', handlePlay)
    media.addEventListener('pause', handlePause)
    media.addEventListener('volumechange', handleVolumeChange)
    media.addEventListener('durationchange', handleDurationChange)

    if (media.readyState >= 1) {
      handleLoadedMetadata()
    }

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata)
      media.removeEventListener('timeupdate', handleTimeUpdate)
      media.removeEventListener('progress', handleProgress)
      media.removeEventListener('play', handlePlay)
      media.removeEventListener('pause', handlePause)
      media.removeEventListener('volumechange', handleVolumeChange)
      media.removeEventListener('durationchange', handleDurationChange)
    }
  }, [videoRef, mediaKey])

  const play = useCallback(() => {
    videoRef.current?.play().catch(() => {})
  }, [videoRef])

  const pause = useCallback(() => {
    videoRef.current?.pause()
  }, [videoRef])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) {
      return
    }
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [videoRef])

  const seek = useCallback(
    (seconds: number) => {
      const video = videoRef.current
      if (video) {
        video.currentTime = Math.max(0, Math.min(seconds, video.duration || seconds))
      }
    },
    [videoRef],
  )

  const setVolume = useCallback(
    (value: number) => {
      const video = videoRef.current
      if (!video) {
        return
      }
      video.volume = Math.max(0, Math.min(1, value))
      if (video.volume > 0 && video.muted) {
        video.muted = false
      }
    },
    [videoRef],
  )

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (video) {
      video.muted = !video.muted
    }
  }, [videoRef])

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
