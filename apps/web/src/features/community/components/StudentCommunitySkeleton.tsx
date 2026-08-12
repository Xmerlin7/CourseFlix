import '../../../shared/components/Skeleton.css'
import { CommunityCourseRowSkeleton } from './CommunityCourseRowSkeleton'

/** Mirrors StudentCommunityPage's header + search + course list while data loads. */
export function StudentCommunitySkeleton() {
  return (
    <div className="community-page skeleton-pulse" data-testid="community-skeleton">
      <div className="community-page-header">
        <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 6, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 16, width: 320, borderRadius: 6 }} />
      </div>

      <div className="skeleton" style={{ height: 42, width: 260, borderRadius: 999, marginBottom: 18 }} />

      <div className="community-list" role="status" aria-label="جاري تحميل الدورات">
        {Array.from({ length: 6 }).map((_, i) => (
          <CommunityCourseRowSkeleton key={i} />
        ))}
        <span className="skeleton-sr-only">جاري تحميل الدورات</span>
      </div>
    </div>
  )
}
