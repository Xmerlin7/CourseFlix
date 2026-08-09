import { formatDuration } from '../../../shared/lib/formatters'
import type { PlayerController } from '../types/player-controller.types'

interface VideoControlBarProps {
  controller: PlayerController
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

/** Material-styled replacement for native <video>/YouTube chrome — see StudentLessonPage for why. */
export function VideoControlBar({ controller, isFullscreen, onToggleFullscreen }: VideoControlBarProps) {
  const { isPlaying, currentTime, duration, bufferedFraction, volume, muted, togglePlay, seek, setVolume, toggleMute } =
    controller

  const playedPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const bufferedPercent = Math.min(100, Math.max(0, bufferedFraction * 100))
  const volumeIcon = muted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'

  return (
    <div className="player-controls" data-testid="video-control-bar">
      <div className="player-controls-seek">
        <div className="player-controls-seek-track">
          <div className="player-controls-seek-buffered" style={{ width: `${bufferedPercent}%` }} />
          <div className="player-controls-seek-played" style={{ width: `${playedPercent}%` }} />
        </div>
        <input
          type="range"
          className="player-controls-seek-input"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || currentTime)}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="موضع الفيديو"
        />
      </div>

      <div className="player-controls-row">
        <button
          type="button"
          className="icon-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
        >
          <span className="ms">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>

        <span className="player-controls-time">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>

        <span className="grow" />

        <button
          type="button"
          className="icon-btn"
          onClick={toggleMute}
          aria-label={muted ? 'إلغاء الكتم' : 'كتم الصوت'}
        >
          <span className="ms">{volumeIcon}</span>
        </button>
        <input
          type="range"
          className="player-controls-volume"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="مستوى الصوت"
        />

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
        >
          <span className="ms">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
        </button>
      </div>
    </div>
  )
}
