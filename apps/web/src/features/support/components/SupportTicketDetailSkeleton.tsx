import '../../../shared/components/Skeleton.css'
import './SupportChat.css'

export function SupportTicketDetailSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل طلب الدعم" data-testid="support-ticket-detail-skeleton">
      <div className="skeleton" style={{ height: 16, width: 120, borderRadius: 6, marginBottom: 18 }} />

      <div className="card support-ticket-header">
        <div className="support-ticket-header-top">
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 11, width: 90, borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 20, width: '55%', borderRadius: 8, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="skeleton" style={{ height: 24, width: 92, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 24, width: 110, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 999 }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 28, width: 96, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ height: 12, width: '85%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6 }} />
      </div>

      <div className="support-chat-panel">
        <div className="support-chat-messages">
          {/* Support message skeleton → left */}
          <div className="chat-msg-group from-support is-new-group">
            <span className="chat-msg-group-label">
              <span className="skeleton" style={{ height: 10, width: 70, borderRadius: 6 }} />
            </span>
            <div className="skeleton" style={{ height: 40, width: 220, borderRadius: 16 }} />
          </div>

          {/* Student message skeleton → right */}
          <div className="chat-msg-group from-student is-new-group">
            <span className="chat-msg-group-label">
              <span className="skeleton" style={{ height: 10, width: 60, borderRadius: 6 }} />
            </span>
            <div className="skeleton" style={{ height: 32, width: 180, borderRadius: 16 }} />
          </div>

          {/* Support message skeleton → left */}
          <div className="chat-msg-group from-support is-new-group">
            <span className="chat-msg-group-label">
              <span className="skeleton" style={{ height: 10, width: 70, borderRadius: 6 }} />
            </span>
            <div className="skeleton" style={{ height: 52, width: 260, borderRadius: 16 }} />
          </div>

          {/* Student message skeleton → right */}
          <div className="chat-msg-group from-student is-new-group">
            <span className="chat-msg-group-label">
              <span className="skeleton" style={{ height: 10, width: 60, borderRadius: 6 }} />
            </span>
            <div className="skeleton" style={{ height: 40, width: 200, borderRadius: 16 }} />
          </div>
        </div>

        <div className="chat-composer">
          <div className="skeleton" style={{ flex: 1, height: 42, borderRadius: 20 }} />
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 999 }} />
        </div>
      </div>

      <span className="skeleton-sr-only">جاري تحميل طلب الدعم</span>
    </div>
  )
}
