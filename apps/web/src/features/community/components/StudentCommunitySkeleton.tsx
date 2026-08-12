import '../../../shared/components/Skeleton.css'
import { CommunityCourseCardSkeleton } from './CommunityCourseCardSkeleton'

/** Mirrors StudentCommunityPage's header + course grid while enrollments load. */
export function StudentCommunitySkeleton() {
  return (
    <div className="community-page skeleton-pulse" data-testid="community-skeleton">
      <div className="community-page-header">
        <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 6, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 16, width: 320, borderRadius: 6 }} />
      </div>

      <div className="community-section">
        <div className="section-head">
          <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 6 }} />
        </div>

        <div
          className="grid-3 course-browse-grid community-course-grid"
          role="status"
          aria-label="جاري تحميل الدورات"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <CommunityCourseCardSkeleton key={i} />
          ))}
          <span className="skeleton-sr-only">جاري تحميل الدورات</span>
        </div>
      </div>
    </div>
  )
}
