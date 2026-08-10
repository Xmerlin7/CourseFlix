import '../../../shared/components/Skeleton.css'

/**
 * TeacherAnalyticsPage has no page-level loading gate — the title, the
 * question form and the example chips render immediately. The only
 * loading state is the answer itself, previously a plain "جاري
 * المعالجة..." line; this mirrors the shape an answer usually takes
 * (a couple of stat tiles) so the result area doesn't jump around
 * once the real answer lands.
 */
export function TeacherAnalyticsResultSkeleton() {
  return (
    <div className="section skeleton-pulse" role="status" aria-label="جاري المعالجة" data-testid="analytics-result-skeleton">
      <div className="tiles">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="tile" style={{ gap: 10 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 13, width: 90, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 32, width: 70, borderRadius: 8 }} />
          </div>
        ))}
      </div>
      <span className="skeleton-sr-only">جاري المعالجة</span>
    </div>
  )
}
