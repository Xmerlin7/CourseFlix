import './LoadingState.css'

type LoadingStateProps = {
  variant?: 'cards' | 'list' | 'text' | 'lesson' | 'sales' | 'student-courses' | 'student-home'
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

      {variant === 'student-courses' && (
        <div className="grid-3 course-browse-grid loading-grid" data-testid="cards-skeleton">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="card loading-card student-course-card-skeleton">
              <div className="skeleton loading-card-thumb" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div className="skeleton skeleton-h-5" style={{ width: '60%' }} />
                  <div className="skeleton skeleton-h-5 skeleton-w-1\/3" style={{ borderRadius: 999 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton skeleton-h-3 skeleton-w-full" />
                  <div className="skeleton skeleton-h-3 skeleton-w-2\/3" />
                </div>
                <div className="skeleton skeleton-h-3 skeleton-w-1\/2" />
                <div className="skeleton skeleton-h-3 skeleton-w-1\/3" />
                <div style={{ marginTop: 'auto', paddingTop: 14 }}>
                  <div className="skeleton skeleton-h-10 skeleton-w-full" style={{ borderRadius: 999 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'student-home' && (
        <div data-testid="student-home-skeleton">
          <div className="skeleton" style={{ height: 28, width: 220, borderRadius: 8, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 260, borderRadius: 6, marginBottom: 28 }} />

          <div
            className="card"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              marginBottom: 36,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="skeleton" style={{ height: 20, width: 140, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 24, width: 220, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 14, width: 180, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 8, width: '100%', maxWidth: 260, borderRadius: 999 }} />
            </div>
            <div className="skeleton" style={{ height: 48, width: 160, borderRadius: 999 }} />
          </div>

          <div className="tiles section">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="tile" style={{ gap: 10 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
                <div className="skeleton" style={{ height: 14, width: 70, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 28, width: 50, borderRadius: 8 }} />
              </div>
            ))}
          </div>

          {[0, 1].map((section) => (
            <div key={section} className="section">
              <div className="skeleton" style={{ height: 22, width: 140, borderRadius: 6, marginBottom: 16 }} />
              <div className="list">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="list-item">
                    <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%', flex: 'none' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 15, width: '60%', borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 12, width: '35%', borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 36, width: 110, borderRadius: 999 }} />
            ))}
          </div>
          <div className="list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="list-item">
                <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%', flex: 'none' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton" style={{ height: 15, width: '50%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
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

      {variant === 'lesson' && (
        <div className="lesson-shell" data-testid="lesson-skeleton">
          <main className="lesson-main">
            <div
              className="player secure-player skeleton"
              style={{
                aspectRatio: '16 / 9',
                borderRadius: 24,
                background: 'var(--surface-container-highest)',
              }}
            />

            <div className="lesson-title-row">
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="skeleton" style={{ height: 16, width: 140, borderRadius: 6, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 28, width: 260, borderRadius: 8 }} />
              </div>
              <div className="skeleton" style={{ height: 32, width: 90, borderRadius: 999 }} />
            </div>

            <div className="lesson-nav-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18 }}>
              <div className="skeleton" style={{ height: 40, width: 96, borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 16, width: 80, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 40, width: 96, borderRadius: 12 }} />
            </div>

            <div className="card" style={{ gap: 10, marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton" style={{ height: 16, width: 180, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 16, width: 40, borderRadius: 6 }} />
              </div>
              <div className="skeleton" style={{ height: 8, width: '100%', borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 14, width: 220, borderRadius: 6 }} />
            </div>

            <div className="card" style={{ gap: 12, marginTop: 18 }}>
              <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 12 }} />
            </div>

            <div className="skeleton" style={{ height: 64, width: '100%', borderRadius: 16, marginTop: 18 }} />
          </main>

          <aside className="lesson-playlist" aria-label="دروس الدورة">
            <div className="lesson-playlist-head">
              <div>
                <div className="skeleton" style={{ height: 14, width: 60, borderRadius: 6, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 24, width: 160, borderRadius: 6 }} />
              </div>
              <div className="skeleton" style={{ height: 36, width: 36, borderRadius: 10 }} />
            </div>

            <div className="lesson-playlist-sections">
              <section className="lesson-playlist-section">
                <div className="skeleton" style={{ height: 16, width: 90, borderRadius: 6, marginBottom: 10 }} />
                <div className="list lesson-nav-list">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="list-item lesson-nav-item"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'var(--surface)' }}
                    >
                      <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div className="skeleton" style={{ height: 16, width: i % 2 === 0 ? '75%' : '60%', borderRadius: 6 }} />
                        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
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
