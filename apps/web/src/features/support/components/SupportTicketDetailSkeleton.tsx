import '../../../shared/components/Skeleton.css'

export function SupportTicketDetailSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل طلب الدعم" data-testid="support-ticket-detail-skeleton">
      <div className="skeleton" style={{ height: 16, width: 120, borderRadius: 6, marginBottom: 18 }} />

      <div className="card" style={{ gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: 22, width: '45%', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ height: 13, width: '30%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 13, width: '90%', borderRadius: 6, marginTop: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '75%', borderRadius: 6 }} />
      </div>

      {[0, 1].map((row) => (
        <div key={row} className="card" style={{ gap: 8, marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 12, width: '20%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: '85%', borderRadius: 6 }} />
        </div>
      ))}

      <span className="skeleton-sr-only">جاري تحميل طلب الدعم</span>
    </div>
  )
}
