import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { formatDuration } from '../../../shared/lib/formatters'
import { LESSON_PROGRESS_STATUS } from '../../../shared/lib/status-labels'
import { showToast } from '../../../shared/components/Toast'
import { useAuth } from '../../auth/hooks/useAuth'
import { VideoQaPanel } from '../../video-qa/components/VideoQaPanel'
import { VideoControlBar } from '../components/VideoControlBar'
import type { CaptureBlockReason } from '../hooks/useAntiCapture'
import { useAntiCapture } from '../hooks/useAntiCapture'
import { useBunnyController } from '../hooks/useBunnyController'
import { useLesson } from '../hooks/useLesson'
import { useNativeVideoController } from '../hooks/useNativeVideoController'
import { useProgressHeartbeat } from '../hooks/useProgressHeartbeat'
import { useYoutubeController } from '../hooks/useYoutubeController'
import type { LessonCourseOutlineLesson, LessonProgressStatus } from '../types/lesson.types'

const CAPTURE_BLOCK_COPY: Record<Exclude<CaptureBlockReason, null>, { icon: string; title: string; body: string }> = {
  'window-blur': {
    icon: 'visibility_off',
    title: 'الفيديو متوقف',
    body: 'حصل تبديل بره نافذة المتصفح، فوقفنا الفيديو تلقائيًا. دوس استكمال عشان تكمل المشاهدة.',
  },
  devtools: {
    icon: 'code_off',
    title: 'الفيديو متوقف',
    body: 'أدوات المطور مفتوحة في المتصفح. اقفلها وبعدين استكمل المشاهدة.',
  },
  'print-screen': {
    icon: 'screenshot_monitor',
    title: 'محاولة تصوير الشاشة',
    body: 'المحتوى ده محمي بحقوق النشر ومربوط بحسابك. دوس استكمال عشان تكمل المشاهدة.',
  },
}

const EXTERNAL_VIDEO_FALLBACK_DURATION_SECONDS = 600

function extractIframeSrc(input: string): string | null {
  const match = input.match(/<iframe\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null
}

function isBunnyStreamPlayerHost(hostname: string): boolean {
  return ['iframe.mediadelivery.net', 'player.mediadelivery.net'].includes(
    hostname.replace(/^www\./, '').toLowerCase(),
  )
}

function getStudentWatermarkId(userId: string | undefined): string | null {
  if (!userId) {
    return null
  }

  return userId.replace(/-/g, '').slice(0, 10).toUpperCase()
}

function getIframeEmbedUrl(value: string): string | null {
  const raw = value.trim()
  const candidate = raw.includes('<iframe') ? extractIframeSrc(raw) : raw
  if (!candidate) {
    return null
  }

  try {
    const parsed = new URL(candidate.replace(/&amp;/g, '&').trim())
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (isBunnyStreamPlayerHost(hostname)) {
      return parsed.toString()
    }

    if (hostname === 'youtu.be' || hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      let videoId: string | null = null

      if (hostname === 'youtu.be') {
        videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null
      } else if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v')
      } else {
        const [kind, id] = parsed.pathname.split('/').filter(Boolean)
        if (kind === 'embed' || kind === 'shorts') {
          videoId = id ?? null
        }
      }

      if (!videoId || !/^[\w-]{6,}$/.test(videoId)) {
        return null
      }

      const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`)
      embedUrl.searchParams.set('rel', '0')
      embedUrl.searchParams.set('modestbranding', '1')
      embedUrl.searchParams.set('iv_load_policy', '3')
      embedUrl.searchParams.set('playsinline', '1')
      // Required for the postMessage command/listening API that both the
      // video Q&A assistant (seekTo — see handleSeekTo) and the custom
      // Material control bar (see useYoutubeController) drive the player
      // with.
      embedUrl.searchParams.set('enablejsapi', '1')
      // YouTube's own chrome is hidden in favor of VideoControlBar — it's
      // driven entirely through the iframe API above.
      embedUrl.searchParams.set('controls', '0')
      embedUrl.searchParams.set('disablekb', '1')
      return embedUrl.toString()
    }

    return null
  } catch {
    return null
  }
}

/**
 * Visual reference: ui5/lesson.html. The mockup's fake play button and
 * client-side progress timer are replaced here by a real <video> element
 * (or YouTube/Bunny iframe) driven by a custom Material control bar — see
 * VideoControlBar — plus server-reported progress; ui5 was a static
 * prototype with no backend to report to.
 */
export function StudentLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { user } = useAuth()
  const viewerRole = user?.role ?? 'student'
  const { data, isLoading, error, refetch } = useLesson(lessonId ?? '', viewerRole)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const playerRef = useRef<HTMLDivElement | null>(null)
  const [watchedPercentage, setWatchedPercentage] = useState<number | null>(null)
  const [status, setStatus] = useState<LessonProgressStatus | null>(null)
  const [attendanceAwarded, setAttendanceAwarded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const iframeEmbedUrl = data ? getIframeEmbedUrl(data.video.url) : null
  const progressDurationSeconds =
    data?.video.durationSeconds ?? (iframeEmbedUrl ? EXTERNAL_VIDEO_FALLBACK_DURATION_SECONDS : null)
  const isYoutubeEmbed = iframeEmbedUrl?.includes('youtube-nocookie.com') ?? false
  const isBunnyEmbed = Boolean(iframeEmbedUrl) && !isYoutubeEmbed
  // Native <video> and YouTube both expose a way to seek programmatically;
  // Bunny's playback API (see useBunnyController) doesn't cover seeking to
  // an arbitrary point reliably enough to trust for citation jumps, so its
  // cited timestamps render as plain text instead of a hacked guess.
  const canSeekVideo = !iframeEmbedUrl || isYoutubeEmbed
  const mediaKey = data?.video.id ?? ''

  // Every embed gets its own backend-specific controller; only one is ever
  // actually wired to a live element at a time (native video XOR iframe), so
  // exactly one of these three no-ops per render — see PlayerController.
  const nativeVideoController = useNativeVideoController(videoRef, mediaKey)
  const youtubeController = useYoutubeController(iframeRef, isYoutubeEmbed, mediaKey)
  const bunnyController = useBunnyController(iframeRef, isBunnyEmbed, mediaKey)
  const activeController = iframeEmbedUrl
    ? isYoutubeEmbed
      ? youtubeController
      : bunnyController
    : nativeVideoController
  // Bunny's embed has no way to hide its own chrome (confirmed against their
  // docs), so it keeps its native controls and only gets a supplementary
  // fullscreen button; native <video> and YouTube get the full Material bar.
  const hasCustomControlBar = !isBunnyEmbed

  function handleSeekTo(seconds: number) {
    if (canSeekVideo) {
      activeController.seek(seconds)
    }
  }

  const [isFullscreen, setIsFullscreen] = useState(false)

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      playerRef.current?.requestFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenElement = document.fullscreenElement
      // Bunny's native fullscreen button (the only control we can't remove
      // or replace) still fullscreens its bare <iframe>, which strips the
      // watermark overlay siblings out of `.player` — bounce it back up to
      // the container. Native <video> and YouTube never hit this: their
      // chrome is fully replaced by VideoControlBar, whose own fullscreen
      // button always targets `.player` directly.
      if (isBunnyEmbed && fullscreenElement === iframeRef.current && playerRef.current) {
        document.exitFullscreen().catch(() => {})
        playerRef.current.requestFullscreen?.().catch(() => {})
        return
      }
      setIsFullscreen(fullscreenElement === playerRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isBunnyEmbed])

  const { blockReason, resume } = useAntiCapture({
    enabled: viewerRole === 'student' && Boolean(data),
    isPlaying: activeController.isPlaying,
    onPause: activeController.pause,
    onResume: activeController.play,
    // Clicking anywhere on a YouTube/Bunny iframe (pause, seek, its own
    // fullscreen button) shifts focus into it and fires a `window` blur on
    // us — that's normal video interaction, not the user alt-tabbing away.
    isFocusShiftInternal: () => Boolean(iframeEmbedUrl) && document.activeElement === iframeRef.current,
  })

  useProgressHeartbeat({
    lessonId: lessonId ?? '',
    videoRef,
    enabled: viewerRole === 'student' && Boolean(data),
    externalTracking: Boolean(iframeEmbedUrl),
    fallbackDurationSeconds: progressDurationSeconds,
    initialPositionSeconds: data?.progress.lastPositionSeconds ?? 0,
    initialWatchedPercentage: data?.progress.watchedPercentage ?? 0,
    onProgress: (result) => {
      setWatchedPercentage(result.watchedPercentage)
      setStatus(result.status)
      if (result.attendanceAwarded) {
        setAttendanceAwarded(true)
      }
    },
  })

  if (isLoading) {
    return <LoadingState variant="lesson" />
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
  const lessonPathPrefix = viewerRole === 'teacher' ? '/teacher/lessons' : '/student/lessons'
  const coursePath =
    viewerRole === 'teacher'
      ? `/teacher/courses/${data.course.id}`
      : `/student/courses/${data.course.id}`
  const isTeacher = viewerRole === 'teacher'
  const courseLessons = data.course.sections.flatMap((section) => section.lessons)
  const currentLessonIndex = courseLessons.findIndex((lesson) => lesson.id === data.id)
  const prevLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < courseLessons.length - 1 ? courseLessons[currentLessonIndex + 1] : null
  const totalLessonsCount = courseLessons.length
  const isCurrentCompleted = displayedStatus === 'completed' || displayedPercentage >= 100
  const completedLessonsCount = courseLessons.filter((l) =>
    l.id === data.id ? isCurrentCompleted : l.progressStatus === 'completed' || (l.watchedPercentage ?? 0) >= 100,
  ).length

  const isNextEnabled = isTeacher ? Boolean(nextLesson) : Boolean(nextLesson) && isCurrentCompleted

  // Sequential unlocking: a lesson is unlocked for students if:
  // 1. It is a teacher preview.
  // 2. It is the first lesson in the course.
  // 3. It is already completed.
  // 4. All preceding lessons in the course are 100% completed.
  const unlockedLessonIds = new Set<string>()
  if (isTeacher) {
    courseLessons.forEach((l) => unlockedLessonIds.add(l.id))
  } else if (courseLessons.length > 0) {
    unlockedLessonIds.add(courseLessons[0].id)
    let allPreviousCompleted = true
    for (let i = 0; i < courseLessons.length; i++) {
      const l = courseLessons[i]
      const isLCompleted =
        l.id === data.id
          ? isCurrentCompleted
          : l.progressStatus === 'completed' || (l.watchedPercentage ?? 0) >= 100

      if (allPreviousCompleted || isLCompleted) {
        unlockedLessonIds.add(l.id)
      }

      if (!isLCompleted) {
        allPreviousCompleted = false
      }
    }
  }

  if (viewerRole === 'student' && data && !unlockedLessonIds.has(data.id)) {
    return (
      <ForbiddenState
        title="هذا الدرس مغلق حاليًا"
        message="أكمل مشاهدة الدرس الحالي بنسبة 100% لفتح الدرس التالي."
      />
    )
  }

  const studentWatermarkId =
    viewerRole === 'student' ? getStudentWatermarkId(user?.id) : null

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
      <div className="lesson-shell">
        <main className="lesson-main">
          <div
            ref={playerRef}
            className="player secure-player"
            onContextMenu={(event) => {
              if (viewerRole === 'student') event.preventDefault()
            }}
            onDragStart={(event) => event.preventDefault()}
          >
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
            ) : iframeEmbedUrl ? (
              <iframe
                key={data.video.id}
                ref={iframeRef}
                src={iframeEmbedUrl}
                title={data.title}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; fullscreen"
                allowFullScreen
              />
            ) : (
              <video
                key={data.video.id}
                ref={videoRef}
                src={data.video.url}
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                disableRemotePlayback
                onLoadedMetadata={handleLoadedMetadata}
                onError={() => setVideoError(true)}
                onClick={() => nativeVideoController.togglePlay()}
                onDoubleClick={toggleFullscreen}
              />
            )}
            {studentWatermarkId && (
              <>
                <div className="player-watermark-grid" aria-hidden="true">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <span key={index}>ID {studentWatermarkId}</span>
                  ))}
                </div>
                <span className="player-watermark" data-testid="student-video-watermark">
                  ID {studentWatermarkId}
                </span>
              </>
            )}
            {!videoError && hasCustomControlBar && (
              <VideoControlBar
                controller={activeController}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
            )}
            {!videoError && isBunnyEmbed && (
              <button
                type="button"
                className="icon-btn player-fullscreen-btn"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
              >
                <span className="ms">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
              </button>
            )}
            {blockReason && (
              <div className="player-capture-guard" data-testid="capture-guard" role="alertdialog">
                <span className="ms" style={{ fontSize: 36 }}>
                  {CAPTURE_BLOCK_COPY[blockReason].icon}
                </span>
                <strong>{CAPTURE_BLOCK_COPY[blockReason].title}</strong>
                <p>{CAPTURE_BLOCK_COPY[blockReason].body}</p>
                <button type="button" className="btn tonal" onClick={resume}>
                  <span className="ms">play_arrow</span>
                  استكمال المشاهدة
                </button>
              </div>
            )}
          </div>

          <div className="lesson-title-row">
            <div>
              <Link to={coursePath} className="meta-link">
                <span className="ms">arrow_back</span>
                {data.course.title}
              </Link>
              <h1 className="page-title" style={{ margin: 0 }}>
                {data.title}
              </h1>
            </div>
            {viewerRole === 'student' ? (
              <span className={`chip ${statusMeta.chip}`}>{statusMeta.label}</span>
            ) : (
              <span className="chip">
                <span className="ms">visibility</span>
                معاينة المدرس
              </span>
            )}
            {attendanceAwarded && (
              <span className="chip green">
                <span className="ms">how_to_reg</span>
                تم تسجيل حضورك
              </span>
            )}
          </div>

          <div className="lesson-nav-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18 }}>
            <Link
              to={prevLesson ? `${lessonPathPrefix}/${prevLesson.id}` : '#'}
              className={`btn outline lesson-nav-btn${!prevLesson ? ' disabled' : ''}`}
              onClick={(e) => {
                if (!prevLesson) e.preventDefault()
              }}
              aria-label="الدرس السابق"
              aria-disabled={!prevLesson}
            >
              <span className="ms">arrow_forward</span>
              السابق
            </Link>

            <span className="lesson-progress-badge" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--on-surface-variant)' }}>
              {completedLessonsCount} من {totalLessonsCount}
            </span>

            <Link
              to={isNextEnabled && nextLesson ? `${lessonPathPrefix}/${nextLesson.id}` : '#'}
              className={`btn primary lesson-nav-btn${!isNextEnabled ? ' disabled' : ''}`}
              onClick={(e) => {
                if (!isNextEnabled) {
                  e.preventDefault()
                  if (nextLesson && !isCurrentCompleted && !isTeacher) {
                    showToast('أكمل مشاهدة الدرس الحالي بنسبة 100% لفتح الدرس التالي.', 'error')
                  }
                }
              }}
              aria-label="الدرس التالي"
              aria-disabled={!isNextEnabled}
            >
              التالي
              <span className="ms">arrow_back</span>
            </Link>
          </div>

          {resumeSeconds > 0 && displayedStatus !== 'completed' && viewerRole === 'student' && (
            <div className="resume-banner">
              <span className="ms">history</span>
              هتكمل من {formatDuration(resumeSeconds)}
            </div>
          )}

          {viewerRole === 'student' && (
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
          )}

          {viewerRole === 'student' && (
            <VideoQaPanel
              videoId={data.video.id}
              canSeek={canSeekVideo}
              onSeek={handleSeekTo}
            />
          )}

          {nextLesson && (
            <Link
              to={isNextEnabled ? `${lessonPathPrefix}/${nextLesson.id}` : '#'}
              onClick={(e) => {
                if (!isNextEnabled) {
                  e.preventDefault()
                  if (!isCurrentCompleted && !isTeacher) {
                    showToast('أكمل مشاهدة الدرس الحالي بنسبة 100% لفتح الدرس التالي.', 'error')
                  }
                }
              }}
              className={`next-lesson-link${!isNextEnabled ? ' locked' : ''}`}
              style={!isNextEnabled ? { opacity: 0.65, cursor: 'not-allowed' } : undefined}
              aria-disabled={!isNextEnabled}
            >
              <span className="ms">{isNextEnabled ? 'skip_next' : 'lock'}</span>
              <span>
                <span className="meta">{isNextEnabled ? 'الدرس التالي' : 'الدرس التالي (مغلق)'}</span>
                <strong>{nextLesson.title}</strong>
              </span>
            </Link>
          )}
        </main>

        <aside className="lesson-playlist" aria-label="دروس الدورة">
          <div className="lesson-playlist-head">
            <div>
              <span className="meta">أنت داخل</span>
              <h2>{data.course.title}</h2>
            </div>
            <Link to={coursePath} className="icon-btn" aria-label="الرجوع للكورس">
              <span className="ms">open_in_new</span>
            </Link>
          </div>

          <div className="lesson-playlist-sections">
            {data.course.sections.map((section) => (
              <section key={section.id} className="lesson-playlist-section">
                <h3>{section.title}</h3>
                <div className="list lesson-nav-list">
                  {section.lessons.map((lesson) => (
                    <LessonNavLink
                      key={lesson.id}
                      lesson={lesson}
                      isActive={lesson.id === data.id}
                      isNext={nextLesson?.id === lesson.id}
                      isLocked={!unlockedLessonIds.has(lesson.id)}
                      progressStatus={lesson.id === data.id ? displayedStatus : lesson.progressStatus}
                      to={`${lessonPathPrefix}/${lesson.id}`}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </aside>
      </div>
    </>
  )
}

function LessonNavLink({
  lesson,
  isActive,
  isNext,
  isLocked,
  progressStatus,
  to,
}: {
  lesson: LessonCourseOutlineLesson
  isActive: boolean
  isNext: boolean
  isLocked: boolean
  progressStatus?: LessonProgressStatus
  to: string
}) {
  const isCompleted = progressStatus === 'completed'
  const statusLabel = isLocked
    ? 'مقفل'
    : isCompleted
      ? 'تمت المشاهدة'
      : isActive
        ? 'الدرس الحالي'
        : isNext
          ? 'التالي'
          : 'درس في الدورة'

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isLocked) {
      e.preventDefault()
      showToast('أكمل مشاهدة الدرس الحالي بنسبة 100% لفتح الدرس التالي.', 'error')
    }
  }

  return (
    <Link
      to={isLocked ? '#' : to}
      onClick={handleClick}
      className={`list-item lesson-nav-item${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}${isLocked ? ' locked' : ''}`}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={isLocked}
    >
      <span className="lead">
        <span className="ms">
          {isLocked ? 'lock' : isCompleted ? 'done_all' : isActive ? 'play_arrow' : 'play_circle'}
        </span>
      </span>
      <span className="body">
        <span className="t">{lesson.title}</span>
        <span className="s">{statusLabel}</span>
      </span>
    </Link>
  )
}
