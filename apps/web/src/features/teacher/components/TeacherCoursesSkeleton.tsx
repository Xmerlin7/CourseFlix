import '../../../shared/components/Skeleton.css'
import { TeacherCourseCardSkeleton } from './TeacherCourseCardSkeleton'

/** Mirrors TeacherCoursesPage's course grid while the list loads. */
export function TeacherCoursesSkeleton() {
  return (
    <div
      className="grid-3 skeleton-pulse"
      role="status"
      aria-label="جاري تحميل المحتوى"
      data-testid="teacher-courses-skeleton"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <TeacherCourseCardSkeleton key={i} />
      ))}
      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
