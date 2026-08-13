import { useState, type CSSProperties, type MouseEvent } from 'react'
import type { AuthPosterContent, AuthPosterCourse } from '../types/auth-poster.types'

const FALLBACK_COURSE: AuthPosterCourse = {
  id: null,
  title: 'الفيزياء',
  description:
    'حصص منظمة، مراجعات ذكية، ومتابعة تقدم تساعدك تدخل الحصة وانت عارف خطوتك الجاية.',
  coverImageUrl: null,
  gradeLevel: 'من الإعدادي للثانوي',
  teacherName: 'محمد عبدالرحمن',
}

const STUDY_STATS = [
  { label: 'خطة مذاكرة', value: '١٢ أسبوع' },
  { label: 'اختبارات قصيرة', value: '٤٨ تدريب' },
  { label: 'متابعة تقدم', value: 'كل حصة' },
]

function getPosterCourse(content?: AuthPosterContent | null): AuthPosterCourse {
  return content?.course ?? FALLBACK_COURSE
}

function getShortDescription(description: string | null): string {
  const fallback = FALLBACK_COURSE.description ?? ''
  const normalized = description?.trim() || fallback
  return normalized.length > 130 ? `${normalized.slice(0, 127).trim()}...` : normalized
}

function PosterAvatar({ title, coverImageUrl }: Pick<AuthPosterCourse, 'title' | 'coverImageUrl'>) {
  if (coverImageUrl) {
    return (
      <img
        className="poster-cover-img"
        src={coverImageUrl}
        alt=""
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <div className="poster-cover-fallback" aria-hidden="true">
      <span className="ms">auto_stories</span>
      <strong>{title.slice(0, 2)}</strong>
    </div>
  )
}

export function AuthCourseStrip({ content }: { content?: AuthPosterContent | null }) {
  const course = getPosterCourse(content)

  return (
    <div className="auth-course-strip">
      <span className="auth-course-strip-icon ms">school</span>
      <span>
        <strong>{course.title}</strong>
        <small>{course.teacherName}</small>
      </span>
    </div>
  )
}

export function TeacherPoster({ content, isLoading = false }: {
  content?: AuthPosterContent | null
  isLoading?: boolean
}) {
  const course = getPosterCourse(content)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    })
  }

  return (
    <div
      className={`poster-stage${isLoading ? ' loading' : ''}`}
      style={{
        '--poster-x': tilt.x,
        '--poster-y': tilt.y,
      } as CSSProperties}
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="poster-light" aria-hidden="true" />
      <div className="poster-grid-lines" aria-hidden="true" />

      <div className="poster">
        <div className="poster-hero">
          <PosterAvatar title={course.title} coverImageUrl={course.coverImageUrl} />
          <div className="poster-hero-overlay" />
          <span className="poster-live-badge">
            <span className="ms">verified</span>
            منصة تعليم تفاعلية
          </span>
        </div>

        <div className="poster-body">
          <div className="poster-head">
            <span className="poster-head-note">{course.gradeLevel ?? 'برنامج دراسي كامل'}</span>
            <h2 className="poster-subject">{course.title}</h2>
          </div>

          <div className="poster-identity">
            <span className="poster-teacher-icon ms">person</span>
            <div className="poster-titles">
              <p className="poster-eyebrow">مع الأستاذ</p>
              <p className="poster-name">{course.teacherName}</p>
            </div>
          </div>

          <p className="poster-description">{getShortDescription(course.description)}</p>

          <ul className="poster-stats">
            {STUDY_STATS.map((stat) => (
              <li key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>

          <div className="poster-progress">
            <span>رحلة الطالب</span>
            <div className="poster-progress-track">
              <span />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
