import '../../../shared/components/Skeleton.css'
import { CourseBrowseCardSkeleton } from './CourseBrowseCardSkeleton'

/** Mirrors StudentBrowseCoursesPage's course grid while the catalog loads. */
export function StudentBrowseCoursesSkeleton() {
  return (
    <div
      className="grid-3 course-browse-grid skeleton-pulse"
      role="status"
      aria-label="جاري تحميل المحتوى"
      data-testid="browse-courses-skeleton"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <CourseBrowseCardSkeleton key={i} />
      ))}
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
