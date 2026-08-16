import './TeacherPoster.css'
import {
  DEFAULT_AUTH_POSTER_CUSTOMIZATION,
  type AuthPosterContent,
  type AuthPosterCourse,
} from '../types/auth-poster.types'

// Shown whenever the public auth-poster config is unreachable or no course
// has been featured yet, so the showcase panel is never a hole.
const FALLBACK_COURSE: AuthPosterCourse = {
  id: null,
  title: 'الفيزياء',
  description:
    'حصص منظمة، مراجعات ذكية، ومتابعة تقدم تساعدك تدخل الحصة وانت عارف خطوتك الجاية.',
  coverImageUrl: null,
  gradeLevel: 'من الإعدادي للثانوي',
  teacherName: 'محمد عبدالرحمن',
}

function getPosterCourse(content?: AuthPosterContent | null): AuthPosterCourse {
  return content?.course ?? FALLBACK_COURSE
}

function getDescription(description: string | null): string {
  return description?.trim() || (FALLBACK_COURSE.description ?? '')
}

function CoverArt({ title, coverImageUrl }: Pick<AuthPosterCourse, 'title' | 'coverImageUrl'>) {
  if (coverImageUrl) {
    return <img src={coverImageUrl} alt="" loading="lazy" decoding="async" />
  }

  return (
    <div className="cfp-fallback" aria-hidden="true">
      <strong>{title.slice(0, 2)}</strong>
    </div>
  )
}

/**
 * Compact echo of the featured course, for the breakpoint where the
 * showcase panel is hidden. Without it the admin's featured-course choice
 * would simply vanish on phones, which is where most students sign in.
 */
export function AuthCourseStrip({ content }: { content?: AuthPosterContent | null }) {
  const course = getPosterCourse(content)

  return (
    <div className="cfa-course-strip">
      <span className="cfa-course-strip-icon ms" aria-hidden="true">
        school
      </span>
      <span className="cfa-course-strip-text">
        <strong>{course.title}</strong>
        <small>{course.teacherName}</small>
      </span>
    </div>
  )
}

/**
 * The featured-course spotlight: a cover hero with the title set over it,
 * and a detail panel overlapping its lower edge.
 *
 * Every string here is admin-configurable (Settings > auth poster), so the
 * component renders all nine customization fields — dropping one would
 * leave an editor field in Settings that changes nothing visible.
 */
export function TeacherPoster({
  content,
  isLoading = false,
}: {
  content?: AuthPosterContent | null
  isLoading?: boolean
}) {
  const course = getPosterCourse(content)
  const customization = {
    ...DEFAULT_AUTH_POSTER_CUSTOMIZATION,
    ...content?.customization,
  }

  const stats = [
    { value: customization.studyPlanValue, label: customization.studyPlanLabel },
    { value: customization.quizValue, label: customization.quizLabel },
    { value: customization.followUpValue, label: customization.followUpLabel },
  ]

  return (
    <article
      className={`cfp${isLoading ? ' loading' : ''}`}
      lang="ar"
      dir="rtl"
      aria-busy={isLoading || undefined}
    >
      <div className="cfp-hero">
        <CoverArt title={course.title} coverImageUrl={course.coverImageUrl} />
        <span className="cfp-scrim" aria-hidden="true" />

        <span className="cfp-badge">
          <span className="ms" aria-hidden="true">
            verified
          </span>
          {customization.badgeText}
        </span>

        <div className="cfp-caption">
          <span className="cfp-grade">{course.gradeLevel ?? 'برنامج دراسي كامل'}</span>
          <h2 className="cfp-title">{course.title}</h2>
        </div>
      </div>

      <div className="cfp-detail">
        <div className="cfp-teacher">
          <span className="cfp-avatar ms" aria-hidden="true">
            person
          </span>
          <span className="cfp-teacher-text">
            <span className="prefix">{customization.teacherPrefix}</span>
            <span className="name">{course.teacherName}</span>
          </span>
        </div>

        <p className="cfp-desc">{getDescription(course.description)}</p>

        <span className="cfp-rule" aria-hidden="true" />

        <ul className="cfp-stats">
          {stats.map((stat) => (
            <li key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>

        <div className="cfp-progress">
          <span className="cfp-progress-label">{customization.journeyLabel}</span>
          <div className="cfp-progress-track" aria-hidden="true">
            <i />
          </div>
        </div>
      </div>
    </article>
  )
}
