import '../../../shared/components/Skeleton.css'

/**
 * Mirrors NotificationsPage's list rows (icon, title/message, trailing
 * type chip / unread dot). The header and status/type filter chips
 * render immediately since they don't depend on data.
 */
export function NotificationsSkeleton() {
  return (
    <div className="list skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="notifications-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="list-item">
          <span className="lead skeleton" style={{ borderRadius: '50%' }} />
          <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="skeleton" style={{ height: 15, width: i % 2 === 0 ? '55%' : '40%', borderRadius: 6 }} />
            <span className="skeleton" style={{ height: 13, width: '75%', borderRadius: 6 }} />
          </span>
          <span className="end">
            <span className="skeleton" style={{ height: 24, width: 70, borderRadius: 999 }} />
          </span>
        </div>
      ))}
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
