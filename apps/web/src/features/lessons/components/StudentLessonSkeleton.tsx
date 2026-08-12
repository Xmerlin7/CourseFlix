import '../../../shared/components/Skeleton.css'

/**
 * Mirrors StudentLessonPage: video player, title row, prev/next nav,
 * watch-percentage card, the collapsed "اسأل عن هذا الفيديو" Q&A
 * toggle, and the course playlist sidebar — preserving the same
 * lesson-shell/lesson-main/lesson-playlist grid so nothing shifts once
 * the real lesson loads.
 */
export function StudentLessonSkeleton() {
  return (
    <div className="lesson-shell skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="lesson-skeleton">
      <main className="lesson-main">
        <div
          className="player secure-player skeleton"
          style={{ aspectRatio: '16 / 9', borderRadius: 24, background: 'var(--surface-container-highest)' }}
        />

        <div className="lesson-title-row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="skeleton" style={{ height: 14, width: 140, borderRadius: 6, marginBottom: 8 }} />
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
          <div className="skeleton" style={{ height: 6, width: '100%', borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 14, width: 220, borderRadius: 6 }} />
        </div>

        {/* Collapsed "اسأل عن هذا الفيديو" Q&A toggle — VideoQaPanel starts closed. */}
        <div className="card" style={{ gap: 12, marginTop: 18 }}>
          <div className="skeleton" style={{ height: 44, width: 220, borderRadius: 999 }} />
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
          {Array.from({ length: 2 }).map((_, sectionIndex) => (
            <section key={sectionIndex} className="lesson-playlist-section">
              <div className="skeleton" style={{ height: 16, width: 90, borderRadius: 6, marginBottom: 10 }} />
              <div className="list lesson-nav-list">
                {Array.from({ length: sectionIndex === 0 ? 4 : 2 }).map((_, i) => (
                  <div key={i} className="list-item lesson-nav-item">
                    <span className="lead skeleton" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
                    <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="skeleton" style={{ height: 16, width: i % 2 === 0 ? '75%' : '60%', borderRadius: 6 }} />
                      <span className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
