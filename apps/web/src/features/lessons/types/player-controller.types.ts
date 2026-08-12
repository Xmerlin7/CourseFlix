/** Common shape exposed by every backend-specific player adapter (native <video>, YouTube iframe, Bunny iframe) so VideoControlBar can stay backend-agnostic. */
export interface PlayerController {
  isReady: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  /** 0-1, how much of the media is buffered ahead — best effort per backend. */
  bufferedFraction: number
  /** 0-1 */
  volume: number
  muted: boolean
  play: () => void
  pause: () => void
  togglePlay: () => void
  seek: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
}
