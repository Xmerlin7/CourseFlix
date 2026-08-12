import '../../../shared/components/Skeleton.css'
import { SupportTicketListSkeleton } from './SupportTicketsPageSkeleton'
import './SupportChat.css'

export function SupportInboxSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل صندوق الدعم" data-testid="support-inbox-skeleton">
      <div className="support-page-head">
        <div className="support-page-title-group">
          <div className="skeleton" style={{ height: 28, width: 220, borderRadius: 8, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: 340, borderRadius: 6 }} />
        </div>
      </div>

      <div className="support-controls-section">
        <div className="skeleton" style={{ height: 42, width: 260, borderRadius: 999 }} />
        <div className="support-status-filters" style={{ gap: 8 }}>
          {[100, 80, 110, 120, 85, 75].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 36, width: w, borderRadius: 999 }} />
          ))}
        </div>
      </div>

      <SupportTicketListSkeleton count={4} />

      <span className="skeleton-sr-only">جاري تحميل صندوق الدعم</span>
    </div>
  )
}

