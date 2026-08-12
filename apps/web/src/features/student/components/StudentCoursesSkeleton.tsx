import '../../../shared/components/Skeleton.css'
import { ContinueLearningCardSkeleton } from './ContinueLearningCardSkeleton'
import { StudentCourseCardSkeleton } from './StudentCourseCardSkeleton'

/**
 * Mirrors دوراتي's layout while enrollments load: an optional
 * continue-learning card (shown pre-emptively to avoid a layout jump
 * if one turns out to exist) followed by the course grid. The status
 * filter chips render immediately since they don't depend on data.
 */
export function StudentCoursesSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="student-courses-skeleton">
      <section className="continue-learning-section section" aria-hidden="true">
        <ContinueLearningCardSkeleton />
      </section>

      <div className="grid-3 course-browse-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <StudentCourseCardSkeleton key={i} />
        ))}
      </div>
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
