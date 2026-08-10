import '../../../shared/components/Skeleton.css'

/**
 * Mirrors StudentQuizPage's "taking the quiz" layout: title, progress
 * bar, the active question card (options rendered as blank rows — no
 * fabricated question text), nav controls, and the question-number
 * side panel. Deliberately doesn't guess a question count from real
 * data; a fixed placeholder grid is enough to hold the layout.
 */
export function StudentQuizSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="quiz-skeleton">
      <div className="skeleton" style={{ height: 28, width: 200, borderRadius: 8, marginBottom: 4 }} />
      <div className="quiz-progress-bar">
        <div className="bar" style={{ width: '30%' }} />
      </div>
      <div className="skeleton" style={{ height: 13, width: 160, borderRadius: 6, marginTop: 6 }} />

      <div className="detail-grid section">
        <div>
          <div className="qcard">
            <div className="skeleton" style={{ height: 12, width: 90, borderRadius: 6, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 20, width: '90%', borderRadius: 6, marginBottom: 4 }} />
            <div className="skeleton" style={{ height: 20, width: '60%', borderRadius: 6, marginBottom: 18 }} />

            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="opt disabled" style={{ marginBottom: 10 }}>
                <span className="skeleton" style={{ width: 19, height: 19, borderRadius: '50%', flex: 'none' }} />
                <span className="skeleton" style={{ height: 15, width: `${55 - i * 5}%`, borderRadius: 6 }} />
              </div>
            ))}
          </div>

          <div className="quiz-nav-controls">
            <div className="skeleton" style={{ height: 44, width: 100, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 44, width: 100, borderRadius: 14 }} />
          </div>
        </div>

        <aside className="quiz-nav-panel">
          <div className="skeleton" style={{ height: 17, width: 60, borderRadius: 6 }} />
          <div className="quiz-nav-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="quiz-nav-cell skeleton" />
            ))}
          </div>
          <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 14 }} />
        </aside>
      </div>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
