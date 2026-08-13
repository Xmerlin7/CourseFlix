import '../../../shared/components/Skeleton.css'

export function AnnouncementsSectionSkeleton() {
  return (
    <div
      className="skeleton-pulse"
      role="status"
      aria-label="جاري تحميل الإعلانات"
      data-testid="announcements-skeleton"
      style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}
    >
      {[0, 1].map((row) => (
        <div key={row} className="card" style={{ gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: '25%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        </div>
      ))}
      <span className="skeleton-sr-only">جاري تحميل الإعلانات</span>
    </div>
  )
}
