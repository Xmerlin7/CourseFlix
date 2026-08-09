import { formatDuration } from '../../../shared/lib/formatters'
import type { VideoQaCitation } from '../types/video-qa.types'

interface VideoQaCitationListProps {
  citations: VideoQaCitation[]
  // Seeking only works when the active player exposes a seek API — a
  // native <video> element, or a YouTube iframe embed. Bunny's iframe
  // postMessage protocol isn't wired into this codebase, so its
  // timestamps render as plain (non-clickable) text instead of forcing
  // an unverified integration.
  canSeek: boolean
  onSeek?: (seconds: number) => void
}

export function VideoQaCitationList({ citations, canSeek, onSeek }: VideoQaCitationListProps) {
  if (citations.length === 0) {
    return null
  }

  return (
    <div className="list" style={{ marginTop: 12, gap: 8 }}>
      {citations.map((citation) => {
        const hasTimestamp = citation.startSeconds !== null
        const timestampLabel = hasTimestamp ? formatDuration(citation.startSeconds!) : null

        return (
          // `.list-item`/`.lead`/`.s` are sized for the wide lesson sidebar
          // (46px avatar, single-line ellipsis subtitle) — reused as-is here
          // they crushed a full-sentence excerpt into one truncated line
          // inside a ~500px chat bubble. Overridden below for a compact,
          // fully-readable quote instead.
          <div key={citation.chunkId} className="list-item" style={{ padding: 10, gap: 10, alignItems: 'flex-start' }}>
            <span className="lead" style={{ width: 28, height: 28, flex: 'none' }}>
              <span className="ms sm">movie</span>
            </span>
            <span className="body" style={{ minWidth: 0 }}>
              {timestampLabel &&
                (canSeek && onSeek ? (
                  <button
                    type="button"
                    className="chip clickable"
                    style={{ marginBottom: 6 }}
                    onClick={() => onSeek(citation.startSeconds!)}
                  >
                    <span className="ms">play_circle</span>
                    عند {timestampLabel}
                  </button>
                ) : (
                  <span
                    className="chip outline"
                    style={{ marginBottom: 6 }}
                    title="التنقل للفيديو غير متاح لهذا النوع من التشغيل"
                  >
                    عند {timestampLabel}
                  </span>
                ))}
              <span
                className="s"
                style={{ display: 'block', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}
              >
                {citation.excerpt}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
