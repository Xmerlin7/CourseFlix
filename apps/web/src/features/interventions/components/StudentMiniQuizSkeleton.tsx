import '../../../shared/components/Skeleton.css'

/**
 * Mirrors StudentMiniQuizPage's linear question list (title, weak-
 * concept subtitle, a couple of question cards with blank option
 * rows, and the submit button) — simpler than the full quiz page,
 * with no nav grid/sidebar.
 */
export function StudentMiniQuizSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="mini-quiz-skeleton">
      <div className="skeleton" style={{ height: 28, width: 150, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: 220, borderRadius: 6, marginBottom: 20 }} />

      {Array.from({ length: 2 }).map((_, qi) => (
        <div key={qi} className="qcard">
          <div className="skeleton" style={{ height: 12, width: 70, borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 20, width: '85%', borderRadius: 6, marginBottom: 18 }} />
          {Array.from({ length: 3 }).map((_, oi) => (
            <div key={oi} className="opt disabled" style={{ marginBottom: 10 }}>
              <span className="skeleton" style={{ width: 19, height: 19, borderRadius: '50%', flex: 'none' }} />
              <span className="skeleton" style={{ height: 15, width: `${50 - oi * 5}%`, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ))}

      <div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 999 }} />

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
