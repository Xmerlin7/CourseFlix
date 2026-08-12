import { AnnouncementsSectionSkeleton } from './AnnouncementsSectionSkeleton'
import { DiscussionListSkeleton } from './DiscussionListSkeleton'
import '../../../shared/components/Skeleton.css'

/** Suspense fallback for the lazily-loaded CourseCommunityPanel. */
export function CommunityPanelSkeleton() {
  return (
    <div data-testid="community-panel-skeleton">
      <AnnouncementsSectionSkeleton />
      <div className="skeleton-pulse" style={{ marginBottom: 16 }}>
        <div className="skeleton" style={{ height: 24, width: 140, borderRadius: 6, marginBottom: 14 }} />
        <div className="tabs" role="tablist" aria-hidden="true" style={{ gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 18, width: 70, borderRadius: 6, margin: '13px 0' }} />
          ))}
        </div>
      </div>
      <DiscussionListSkeleton />
    </div>
  )
}
