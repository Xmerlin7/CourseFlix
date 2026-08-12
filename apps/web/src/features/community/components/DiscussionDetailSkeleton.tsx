import '../../../shared/components/Skeleton.css'

export function DiscussionDetailSkeleton() {
  return (
    <div
      className="skeleton-pulse"
      role="status"
      aria-label="جاري تحميل المناقشة"
      data-testid="discussion-detail-skeleton"
      style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}
    >
      <div className="skeleton" style={{ height: 32, width: 130, borderRadius: 16, marginBottom: 16 }} />

      <div className="card discussion-question-card" style={{ gap: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 24, width: 100, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 24, width: 120, borderRadius: 12 }} />
        </div>
        <div className="skeleton" style={{ height: 28, width: '75%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '30%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '95%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6 }} />
        <div style={{ display: 'flex', gap: 10, paddingTop: 10 }}>
          <div className="skeleton" style={{ height: 32, width: 90, borderRadius: 16 }} />
        </div>
      </div>

      <div className="skeleton" style={{ height: 22, width: 110, borderRadius: 6, marginBottom: 16 }} />

      {[0, 1].map((row) => (
        <div key={row} className="card discussion-reply-card" style={{ gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ height: 22, width: 120, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 14, width: 80, borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ height: 14, width: '88%', borderRadius: 6 }} />
        </div>
      ))}

      <div className="card discussion-reply-composer" style={{ gap: 12, marginTop: 24 }}>
        <div className="skeleton" style={{ height: 16, width: 80, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 80, width: '100%', borderRadius: 8 }} />
      </div>

      <span className="skeleton-sr-only">جاري تحميل المناقشة</span>
    </div>
  )
}
