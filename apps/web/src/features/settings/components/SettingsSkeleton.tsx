import '../../../shared/components/Skeleton.css'

/**
 * Mirrors SettingsPage's shell — tab row + a profile-shaped card — so the
 * route-level Suspense fallback doesn't jump layout once the page loads.
 */
export function SettingsSkeleton() {
  return (
    <div
      className="skeleton-pulse"
      role="status"
      aria-label="جاري تحميل المحتوى"
      data-testid="settings-skeleton"
    >
      <div className="tabs">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="skeleton" style={{ height: 16, width: 90, margin: '13px 10px', borderRadius: 6 }} />
        ))}
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
          <span className="skeleton" style={{ height: 15, width: 140, borderRadius: 6 }} />
        </div>
        <span className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
        <span className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
      </div>
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
