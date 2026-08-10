import '../../../shared/components/Skeleton.css'

/** Mirrors TeacherInterventionsPage's list rows (icon, student/weak-concept text, status chip + date). */
export function TeacherInterventionsSkeleton() {
  return (
    <div className="list skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="teacher-interventions-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="list-item">
          <span className="lead skeleton" style={{ borderRadius: '50%' }} />
          <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="skeleton" style={{ height: 15, width: i % 2 === 0 ? '45%' : '35%', borderRadius: 6 }} />
            <span className="skeleton" style={{ height: 13, width: '60%', borderRadius: 6 }} />
          </span>
          <span className="end" style={{ gap: 10 }}>
            <span className="skeleton" style={{ height: 24, width: 80, borderRadius: 999 }} />
            <span className="skeleton" style={{ height: 13, width: 70, borderRadius: 6 }} />
          </span>
        </div>
      ))}
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
