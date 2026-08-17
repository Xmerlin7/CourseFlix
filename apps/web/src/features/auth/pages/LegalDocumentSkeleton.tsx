import '../../../shared/components/Skeleton.css'

/**
 * Suspense fallback for /terms and /privacy.
 *
 * Wrapped in the same `.legal-page` shell the real page uses — not just
 * for visual consistency, but because `.legal-page` is what makes this
 * screen scroll at all (see its comment in index.css: `body.shell` is
 * pinned non-scrollable so the signed-in app can scroll independently, so
 * a standalone page has to own its own scrolling). The route's default
 * fallback was the generic `<LoadingState variant="cards">` — a grid of
 * course-browse cards with zero relation to a text document, rendered
 * with no scroll container at all, so on a short viewport it was both the
 * wrong shape and unscrollable while it showed.
 */
export function LegalDocumentSkeleton() {
  return (
    <div className="legal-page">
      <header className="legal-page-header">
        <span className="logo">COURSEFLIX</span>
        <div className="skeleton" style={{ height: 34, width: 84, borderRadius: 999 }} />
      </header>

      <main className="legal-doc">
        <div
          className="skeleton-pulse"
          role="status"
          aria-label="جاري تحميل المحتوى"
        >
          <div className="skeleton" style={{ height: 32, width: '55%', borderRadius: 8, marginBottom: 28 }} />

          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="legal-section">
              <div className="skeleton" style={{ height: 18, width: '38%', borderRadius: 6, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 13, width: '100%', borderRadius: 6, marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 13, width: '96%', borderRadius: 6, marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 6 }} />
            </div>
          ))}

          <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
        </div>
      </main>
    </div>
  )
}
