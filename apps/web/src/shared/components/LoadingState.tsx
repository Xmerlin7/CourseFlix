import './LoadingState.css'

type LoadingStateProps = {
  variant?: 'cards' | 'list' | 'text'
  count?: number
}

export function LoadingState({ variant = 'cards', count = 3 }: LoadingStateProps) {
  return (
    <div
      className="loading-state"
      role="status"
      aria-label="جاري تحميل المحتوى"
    >
      {variant === 'cards' && (
        <div className="grid-3 course-browse-grid loading-grid" data-testid="cards-skeleton">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="card course-browse-card loading-card">
              <div className="skeleton loading-card-thumb" />
              <div className="course-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="skeleton skeleton-h-4 skeleton-w-1\/3" style={{ borderRadius: 999 }} />
                <div className="skeleton skeleton-h-5 skeleton-w-full" />
                <div className="skeleton skeleton-h-4 skeleton-w-2\/3" />
                <div className="course-card-footer" style={{ marginTop: 'auto', paddingTop: 14 }}>
                  <div className="skeleton skeleton-h-5 skeleton-w-1\/3" />
                  <div className="skeleton skeleton-h-8 skeleton-w-1\/3" style={{ borderRadius: 999 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="loading-list">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="loading-list-item">
              <div className="skeleton loading-avatar" />
              <div className="loading-list-lines">
                <div className="skeleton skeleton-h-3 skeleton-w-2\/3" />
                <div className="skeleton skeleton-h-3 skeleton-w-1\/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'text' && (
        <div className="loading-text-block">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton skeleton-h-4 skeleton-w-full" />
          ))}
        </div>
      )}

      <span className="loading-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
