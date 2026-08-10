import './LoadingState.css'

type LoadingStateProps = {
  variant?: 'cards' | 'list' | 'text' | 'sales'
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

      {variant === 'sales' && (
        <div style={{ display: 'grid', gap: 24 }} data-testid="sales-skeleton">
          <div>
            <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 8, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: 280, borderRadius: 6 }} />
          </div>

          <div className="card" style={{ gap: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {/* "من تاريخ" / "إلى تاريخ" — label bar + input bar, matching .tf */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div className="skeleton" style={{ height: 14, width: 70, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 14 }} />
                </div>
              ))}
              <div className="skeleton" style={{ height: 44, width: 90, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 44, width: 120, borderRadius: 999 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div className="skeleton" style={{ height: 14, width: 70, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 32, width: 55, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 32, width: 85, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 32, width: 75, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 32, width: 90, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 999 }} />
            </div>
          </div>

          <div className="tiles">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="tile" style={{ gap: 10 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
                <div className="skeleton" style={{ height: 14, width: 80, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 28, width: 110, borderRadius: 8 }} />
              </div>
            ))}
          </div>

          <div>
            <div className="skeleton" style={{ height: 22, width: 170, borderRadius: 6, marginBottom: 14 }} />
            <div className="table-wrap">
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="skeleton" style={{ height: 20, width: '100%', borderRadius: 6 }} />
                {/* the table only ever holds a best-seller row + a totals row */}
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 24, width: '100%', borderRadius: 6 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <span className="loading-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
