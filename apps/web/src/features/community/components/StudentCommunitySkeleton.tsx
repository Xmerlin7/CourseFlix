import '../../../shared/components/Skeleton.css'

/** Skeleton for the Community landing page — 4 course-list items. */
export function StudentCommunitySkeleton() {
  return (
    <div className="community-page skeleton-pulse" data-testid="community-skeleton">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 6, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 16, width: 260, borderRadius: 6 }} />
      </div>

      {/* Course cards */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card community-course-card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
          <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 16, width: '55%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '35%', borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}
