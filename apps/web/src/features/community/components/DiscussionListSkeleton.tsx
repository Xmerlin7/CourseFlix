import '../../../shared/components/Skeleton.css'

export function DiscussionListSkeleton() {
  return (
    <div className="skeleton-pulse list" role="status" aria-label="جاري تحميل المناقشات" data-testid="discussion-list-skeleton">
      {[0, 1, 2].map((row) => (
        <div key={row} className="list-item" style={{ pointerEvents: 'none' }}>
          <span className="lead">
            <div className="skeleton" style={{ height: 24, width: 24, borderRadius: '50%' }} />
          </span>
          <span className="body">
            <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '35%', borderRadius: 6 }} />
          </span>
          <span className="end">
            <div className="skeleton" style={{ height: 20, width: 70, borderRadius: 999 }} />
          </span>
        </div>
      ))}
      <span className="skeleton-sr-only">جاري تحميل المناقشات</span>
    </div>
  )
}
