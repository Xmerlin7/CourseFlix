import '../../../shared/components/Skeleton.css'
import { ContinueLearningCardSkeleton } from './ContinueLearningCardSkeleton'

/**
 * Mirrors StudentDashboardPage's "hasCourses" layout: title, continue-
 * learning card, stat tiles, recent-activity list, recent-notifications
 * list, quick-access chips, and a short recent-courses list.
 */
export function StudentHomeSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="student-home-skeleton">
      <div className="skeleton" style={{ height: 28, width: 220, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: 260, borderRadius: 6, marginBottom: 28 }} />

      <section className="section" aria-hidden="true">
        <ContinueLearningCardSkeleton />
      </section>

      <div className="tiles section">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tile" style={{ gap: 10 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 13, width: 70, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 32, width: 50, borderRadius: 8 }} />
          </div>
        ))}
      </div>

      <section className="section">
        <div className="skeleton" style={{ height: 24, width: 110, borderRadius: 6, marginBottom: 20 }} />
        <div className="list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="list-item">
              <span className="lead skeleton" style={{ borderRadius: '50%' }} />
              <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="skeleton" style={{ height: 15, width: '65%', borderRadius: 6 }} />
                <span className="skeleton" style={{ height: 12, width: '35%', borderRadius: 6 }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="skeleton" style={{ height: 24, width: 140, borderRadius: 6, marginBottom: 20 }} />
        <div className="list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="list-item">
              <span className="lead skeleton" style={{ borderRadius: '50%' }} />
              <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="skeleton" style={{ height: 15, width: '55%', borderRadius: 6 }} />
                <span className="skeleton" style={{ height: 12, width: '75%', borderRadius: 6 }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="actions section" role="group">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 36, width: 110, borderRadius: 999 }} />
          ))}
        </div>

        <div className="section-head">
          <div className="skeleton" style={{ height: 24, width: 100, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 16, width: 90, borderRadius: 6 }} />
        </div>
        <div className="list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="list-item">
              <span className="lead skeleton" style={{ borderRadius: '50%' }} />
              <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="skeleton" style={{ height: 15, width: '60%', borderRadius: 6 }} />
                <span className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
              </span>
              <span className="end">
                <span className="skeleton" style={{ height: 24, width: 60, borderRadius: 999 }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
