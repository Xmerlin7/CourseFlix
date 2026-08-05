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
        <div className="loading-grid">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="loading-card">
              <div className="skeleton skeleton-h-32" />
              <div className="skeleton skeleton-h-4 skeleton-w-3\/4" />
              <div className="skeleton skeleton-h-3 skeleton-w-1\/2" />
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
