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

    function handleLoadedMetadata() {
      setDuration(video.duration || 0)
      setVolumeState(video.volume)
      setMuted(video.muted)
      setIsReady(true)
    }
    function handleTimeUpdate() {
      setCurrentTime(video.currentTime)
    }
    function handleProgress() {
      if (video.buffered.length > 0 && video.duration > 0) {
        setBufferedFraction(video.buffered.end(video.buffered.length - 1) / video.duration)
      }
    }
    function handlePlay() {
      setIsPlaying(true)
    }
    function handlePause() {
      setIsPlaying(false)
    }
    function handleVolumeChange() {
      setVolumeState(video.volume)
      setMuted(video.muted)
    }
    function handleDurationChange() {
      setDuration(video.duration || 0)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('durationchange', handleDurationChange)

    if (video.readyState >= 1) {
      handleLoadedMetadata()
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('durationchange', handleDurationChange)
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
