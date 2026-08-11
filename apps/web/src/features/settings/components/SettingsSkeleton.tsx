import '../../../shared/components/Skeleton.css'

/**
 * Mirrors SettingsPage's shell — sticky side nav + a grid of cards — so
 * the route-level Suspense fallback doesn't jump layout once it loads.
 */
export function SettingsSkeleton() {
  return (
    <div
      className="skeleton-pulse"
      role="status"
      aria-label="جاري تحميل المحتوى"
      data-testid="settings-skeleton"
    >
      <div className="settings-shell">
        <div className="settings-nav">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="skeleton" style={{ height: 44, width: '100%', borderRadius: 999 }} />
          ))}
        </div>

        <div className="settings-cards-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card settings-card">
              <span className="skeleton" style={{ height: 16, width: '55%', borderRadius: 6 }} />
              <span className="skeleton" style={{ height: 13, width: '80%', borderRadius: 6 }} />
              <span className="skeleton" style={{ height: 40, width: '100%', borderRadius: 14 }} />
            </div>
          ))}
        </div>
      </div>
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
