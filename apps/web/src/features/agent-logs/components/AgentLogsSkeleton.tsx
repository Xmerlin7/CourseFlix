import '../../../shared/components/Skeleton.css'

/**
 * Mirrors AgentLogsPage's list rows (icon, action/agent-type, trailing
 * status chip + timestamp). The type/status filter chips render
 * immediately since they don't depend on data.
 */
export function AgentLogsSkeleton() {
  return (
    <div className="list skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="agent-logs-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="list-item">
          <span className="lead skeleton" style={{ borderRadius: '50%' }} />
          <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="skeleton" style={{ height: 15, width: i % 2 === 0 ? '50%' : '38%', borderRadius: 6 }} />
            <span className="skeleton" style={{ height: 13, width: '30%', borderRadius: 6 }} />
          </span>
          <span className="end" style={{ gap: 10 }}>
            <span className="skeleton" style={{ height: 24, width: 60, borderRadius: 999 }} />
            <span className="skeleton" style={{ height: 13, width: 90, borderRadius: 6 }} />
          </span>
        </div>
      ))}
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
