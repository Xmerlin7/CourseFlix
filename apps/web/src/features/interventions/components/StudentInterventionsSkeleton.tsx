import '../../../shared/components/Skeleton.css'

/** Mirrors StudentInterventionsPage's list rows (icon, weak-concept/rule text, mini-quiz CTA + date). */
export function StudentInterventionsSkeleton() {
  return (
    <div className="list skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="student-interventions-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="list-item">
          <span className="lead skeleton" style={{ borderRadius: '50%' }} />
          <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="skeleton" style={{ height: 15, width: i % 2 === 0 ? '55%' : '42%', borderRadius: 6 }} />
            <span className="skeleton" style={{ height: 13, width: '35%', borderRadius: 6 }} />
          </span>
          <span className="end" style={{ gap: 10 }}>
            <span className="skeleton" style={{ height: 24, width: 130, borderRadius: 999 }} />
            <span className="skeleton" style={{ height: 13, width: 70, borderRadius: 6 }} />
          </span>
        </div>
      ))}
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
