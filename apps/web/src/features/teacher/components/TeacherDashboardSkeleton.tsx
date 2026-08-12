import '../../../shared/components/Skeleton.css'

/** Mirrors TeacherDashboardPage: title, stat tiles, and the recent-courses list. */
export function TeacherDashboardSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="teacher-dashboard-skeleton">
      <div className="skeleton" style={{ height: 28, width: 160, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: 230, borderRadius: 6, marginBottom: 28 }} />

      <div className="tiles section">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="tile" style={{ gap: 10 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 13, width: 90, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 32, width: 50, borderRadius: 8 }} />
          </div>
        ))}
      </div>

      <section className="section">
        <div className="section-head">
          <div className="skeleton" style={{ height: 24, width: 120, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 16, width: 70, borderRadius: 6 }} />
        </div>
        <div className="list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="list-item">
              <span className="lead skeleton" style={{ borderRadius: '50%' }} />
              <span className="body">
                <span className="skeleton" style={{ height: 15, width: '50%', borderRadius: 6 }} />
              </span>
              <span className="end">
                <span className="skeleton" style={{ height: 24, width: 70, borderRadius: 999 }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
