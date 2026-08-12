import '../../../shared/components/Skeleton.css'

export function SupportTicketsPageSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل طلبات الدعم" data-testid="support-tickets-skeleton">
      <div className="section-head">
        <div className="skeleton" style={{ height: 28, width: 180, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 40, width: 160, borderRadius: 999 }} />
      </div>

      <div className="tabs" role="tablist" aria-hidden="true" style={{ gap: 10 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton" style={{ height: 18, width: 70, borderRadius: 6, margin: '13px 0' }} />
        ))}
      </div>

      <div className="list">
        {[0, 1, 2].map((row) => (
          <div key={row} className="list-item" style={{ pointerEvents: 'none' }}>
            <span className="lead">
              <div className="skeleton" style={{ height: 24, width: 24, borderRadius: '50%' }} />
            </span>
            <span className="body">
              <div className="skeleton" style={{ height: 16, width: '55%', borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 6 }} />
            </span>
            <span className="end">
              <div className="skeleton" style={{ height: 22, width: 80, borderRadius: 999 }} />
            </span>
          </div>
        ))}
      </div>

      <span className="skeleton-sr-only">جاري تحميل طلبات الدعم</span>
    </div>
  )
}
