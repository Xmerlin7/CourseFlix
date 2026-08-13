import '../../../shared/components/Skeleton.css'

export function SupportInboxSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل صندوق الدعم" data-testid="support-inbox-skeleton">
      <div className="section-head">
        <div className="skeleton" style={{ height: 28, width: 200, borderRadius: 8 }} />
      </div>

      <div className="tf search-field section">
        <div className="skeleton" style={{ height: 13, width: 160, borderRadius: 6, marginBottom: 7 }} />
        <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 14 }} />
      </div>

      <div className="flex" style={{ gap: 10, marginBottom: 16 }}>
        <div className="skeleton" style={{ height: 40, width: 140, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 40, width: 140, borderRadius: 12 }} />
      </div>

      <div className="list">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="list-item" style={{ pointerEvents: 'none' }}>
            <span className="lead">
              <div className="skeleton" style={{ height: 24, width: 24, borderRadius: '50%' }} />
            </span>
            <span className="body">
              <div className="skeleton" style={{ height: 16, width: '50%', borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 6 }} />
            </span>
            <span className="end">
              <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 999 }} />
            </span>
          </div>
        ))}
      </div>

      <span className="skeleton-sr-only">جاري تحميل صندوق الدعم</span>
    </div>
  )
}
