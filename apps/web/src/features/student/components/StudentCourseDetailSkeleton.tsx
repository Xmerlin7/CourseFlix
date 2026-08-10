import '../../../shared/components/Skeleton.css'
import { CourseSectionSkeleton } from '../../courses/components/CourseSectionSkeleton'

/**
 * Mirrors StudentCourseDetailPage/CourseDetailView: header (title, meta,
 * assistant button), description line, media tabs, and the sections/
 * lessons list.
 */
export function StudentCourseDetailSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="course-detail-skeleton">
      <div className="section-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 28, width: 260, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 6 }} />
        </div>
        <div className="skeleton" style={{ height: 40, width: 140, borderRadius: 999 }} />
      </div>

      <div className="skeleton" style={{ height: 15, width: '85%', maxWidth: 480, borderRadius: 6, marginBottom: 20 }} />

      <div className="tabs" role="tablist" aria-hidden="true" style={{ gap: 10 }}>
        <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 6, margin: '13px 0' }} />
        <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 6, margin: '13px 0' }} />
      </div>

      <CourseSectionSkeleton lessonCount={4} />
      <CourseSectionSkeleton lessonCount={3} />

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
