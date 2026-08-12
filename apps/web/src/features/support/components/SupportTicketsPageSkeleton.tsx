import '../../../shared/components/Skeleton.css'
import './SupportChat.css'

export function SupportTicketCardSkeleton() {
  return (
    <div className="support-ticket-card card" style={{ pointerEvents: 'none' }}>
      <div className="support-card-top">
        <div className="support-card-meta">
          <div className="skeleton" style={{ height: 20, width: 70, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 20, width: 90, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ height: 24, width: 85, borderRadius: 999 }} />
      </div>

      <div className="skeleton" style={{ height: 20, width: '65%', borderRadius: 6, margin: '4px 0' }} />

      <div className="support-card-footer">
        <div className="support-card-info">
          <div className="skeleton" style={{ height: 14, width: 140, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, width: 110, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ height: 16, width: 16, borderRadius: '50%' }} />
      </div>
    </div>
  )
}

export function SupportTicketListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="support-tickets-list">
      {Array.from({ length: count }).map((_, index) => (
        <SupportTicketCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function SupportTicketsPageSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل طلبات الدعم" data-testid="support-tickets-skeleton">
      <div className="support-page-head">
        <div className="support-page-title-group">
          <div className="skeleton" style={{ height: 28, width: 160, borderRadius: 8, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: 260, borderRadius: 6 }} />
        </div>
        <div className="skeleton" style={{ height: 42, width: 150, borderRadius: 999 }} />
      </div>

      <div className="support-controls-section">
        <div className="skeleton" style={{ height: 42, width: 240, borderRadius: 999 }} />
        <div className="support-status-filters" style={{ gap: 8 }}>
          {[100, 80, 110, 105, 85, 75].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 36, width: w, borderRadius: 999 }} />
          ))}
        </div>
      </div>

      <SupportTicketListSkeleton count={3} />

      <span className="skeleton-sr-only">جاري تحميل طلبات الدعم</span>
    </div>
  )
}

