import '../../../shared/components/Skeleton.css'

export function DiscussionDetailSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المناقشة" data-testid="discussion-detail-skeleton">
      <div className="skeleton" style={{ height: 16, width: 120, borderRadius: 6, marginBottom: 18 }} />

      <div className="card" style={{ gap: 10, marginBottom: 20 }}>
        <div className="skeleton" style={{ height: 24, width: '70%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '35%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 13, width: '95%', borderRadius: 6, marginTop: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '80%', borderRadius: 6 }} />
      </div>

      {[0, 1].map((row) => (
        <div key={row} className="card" style={{ gap: 8, marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 13, width: '25%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: '90%', borderRadius: 6 }} />
        </div>
      ))}

      <span className="skeleton-sr-only">جاري تحميل المناقشة</span>
    </div>
  )
}
