import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { formatDuration } from '../../../shared/lib/formatters'
import { LESSON_PROGRESS_STATUS } from '../../../shared/lib/status-labels'
import { useLesson } from '../hooks/useLesson'
import { useProgressHeartbeat } from '../hooks/useProgressHeartbeat'
import type { LessonProgressStatus } from '../types/lesson.types'

/**
 * Visual reference: ui5/lesson.html. The mockup's fake play button and
 * client-side progress timer are replaced here by a real <video controls>
 * element and server-reported progress — ui5 was a static prototype with
 * no backend to report to.
 */
export function StudentLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { data, isLoading, error, refetch } = useLesson(lessonId ?? '')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [watchedPercentage, setWatchedPercentage] = useState<number | null>(null)
  const [status, setStatus] = useState<LessonProgressStatus | null>(null)
  const [attendanceAwarded, setAttendanceAwarded] = useState(false)
  const [videoError, setVideoError] = useState(false)

  useProgressHeartbeat({
    lessonId: lessonId ?? '',
    videoRef,
    onProgress: (result) => {
      setWatchedPercentage(result.watchedPercentage)
      setStatus(result.status)
      if (result.attendanceAwarded) {
        setAttendanceAwarded(true)
      }
    },
  })

  if (isLoading) {
    return <LoadingState variant="text" />
  }

  if (error) {
    if (error.status === 403) {
      return <ForbiddenState />
    }
    if (error.status === 404) {
      return <NotFoundState />
    }
    return <ErrorState onRetry={refetch} />
  }

  if (!data) {
    return <NotFoundState />
  }

  const resumeSeconds = data.progress.lastPositionSeconds
  const displayedPercentage = watchedPercentage ?? data.progress.watchedPercentage
  const displayedStatus = status ?? data.progress.status
  const statusMeta = LESSON_PROGRESS_STATUS[displayedStatus]

  function handleLoadedMetadata() {
    const video = videoRef.current
    // Seeds the resume position once, from the server-saved value — a
    // media reload after a transient error re-seeds from the same value,
    // never from whatever the failed attempt happened to reach.
    if (video && resumeSeconds > 0) {
      video.currentTime = resumeSeconds
    }
  }

  return (
    <>
      <div className="player">
        {videoError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4" style={{ color: '#CFC4E6' }}>
            <span className="ms" style={{ fontSize: 40 }}>
              error
            </span>
            <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 260 }}>
              تعذر تشغيل الفيديو — تقدمك المحفوظ لسه موجود، جرب تاني
            </p>
            <button type="button" className="btn tonal" onClick={() => setVideoError(false)}>
              <span className="ms">refresh</span>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <video
            key={data.video.id}
            ref={videoRef}
            src={data.video.url}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => setVideoError(true)}
          />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 20 }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          {data.title}
        </h1>
        <span className={`chip ${statusMeta.chip}`}>{statusMeta.label}</span>
        {attendanceAwarded && (
          <span className="chip green">
            <span className="ms">how_to_reg</span>
            تم تسجيل حضورك
          </span>
        )}
      </div>

      {resumeSeconds > 0 && displayedStatus !== 'completed' && (
        <div className="resume-banner">
          <span className="ms">history</span>
          هتكمل من {formatDuration(resumeSeconds)}
        </div>
      )}

      <div className="card" style={{ gap: 10, marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700 }}>
          <span style={{ color: 'var(--on-surface-variant)' }}>نسبة المشاهدة (تُحسب في الحضور)</span>
          <span>{Math.round(displayedPercentage)}%</span>
        </div>
        <div className="progress">
          <div className="bar" style={{ width: `${Math.min(100, displayedPercentage)}%` }} />
        </div>
        <span className="meta">تُعتبر حاضرًا عند مشاهدة نسبة كافية من الدرس</span>
      </div>
    </>
  )
}
