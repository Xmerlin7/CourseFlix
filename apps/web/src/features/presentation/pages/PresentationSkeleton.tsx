import './PresentationSkeleton.css'

// Skeleton shown while the /present deck bundle loads — mirrors the hero
// slide layout (logo, subtitle, tagline, team grid + solo member) so the
// flash-on-load matches what the first slide renders.
export function PresentationSkeleton() {
  return (
    <div className="pres-skeleton-root" role="status" aria-label="جاري تحميل العرض التقديمي">
      <div className="pres-skeleton-card">
        <div className="skeleton skeleton-h-10 skeleton-w-1/2 pres-skeleton-logo" />
        <div className="skeleton pres-skeleton-sub" />
        <div className="skeleton pres-skeleton-tag" />
        <div className="pres-skeleton-divider" />
        <div className="skeleton pres-skeleton-label" />
        <div className="pres-skeleton-team">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="pres-skeleton-member" key={i}>
              <div className="skeleton pres-skeleton-avatar" />
              <div className="skeleton pres-skeleton-name" />
            </div>
          ))}
        </div>
        <div className="pres-skeleton-solo">
          <div className="pres-skeleton-member">
            <div className="skeleton pres-skeleton-avatar" />
            <div className="skeleton pres-skeleton-name" />
          </div>
        </div>
      </div>
      <span className="loading-sr-only">جاري تحميل العرض التقديمي</span>
    </div>
  )
}