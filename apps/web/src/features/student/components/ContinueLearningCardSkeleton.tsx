/**
 * Mirrors the "continue-learning-card" shape rendered on both the
 * student home page and دوراتي — badge, title, last lesson, progress
 * bar, and the resume button.
 */
export function ContinueLearningCardSkeleton() {
  return (
    <div className="continue-learning-card card">
      <div className="continue-learning-info">
        <div className="continue-learning-header">
          <span className="skeleton" style={{ height: 22, width: 130, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ height: 21, width: '70%', maxWidth: 260, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '55%', maxWidth: 220, borderRadius: 6 }} />
        <div className="continue-progress-block">
          <div className="skeleton" style={{ height: 13, width: 100, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 8, width: '100%', borderRadius: 999 }} />
        </div>
      </div>
      <div className="continue-learning-action">
        <div className="skeleton" style={{ height: 48, width: 160, borderRadius: 999 }} />
      </div>
    </div>
  )
}
