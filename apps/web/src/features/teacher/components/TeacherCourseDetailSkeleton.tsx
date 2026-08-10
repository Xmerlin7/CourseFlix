import '../../../shared/components/Skeleton.css'
import { CourseSectionSkeleton } from '../../courses/components/CourseSectionSkeleton'

/**
 * Mirrors TeacherCourseDetailPage's default "المحتوى" tab: the real
 * (static, data-independent) management tabs so they don't pop in
 * after load, the shared CourseDetailView sections/lessons, a
 * content-manager toolbar placeholder, and the course-edit form.
 */
export function TeacherCourseDetailSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="teacher-course-detail-skeleton">
      <div className="tabs" role="tablist">
        <button type="button" className="tab active" disabled>المحتوى</button>
        <button type="button" className="tab" disabled>الاختبارات</button>
        <button type="button" className="tab" disabled>امتحان بالذكاء الاصطناعي</button>
        <button type="button" className="tab" disabled>الملفات</button>
      </div>

      <div className="section-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 28, width: 240, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 180, borderRadius: 6 }} />
        </div>
      </div>

      <CourseSectionSkeleton lessonCount={4} />
      <CourseSectionSkeleton lessonCount={2} />

      <div className="card" style={{ gap: 14, marginTop: 18 }}>
        <div className="skeleton" style={{ height: 18, width: 150, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 14 }} />
      </div>

      <div className="card" style={{ gap: 14, marginTop: 18 }}>
        <div className="skeleton" style={{ height: 18, width: 160, borderRadius: 6 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tf">
            <div className="skeleton" style={{ height: 13, width: 90, borderRadius: 6, marginBottom: 7 }} />
            <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 14 }} />
          </div>
        ))}
        <div className="skeleton" style={{ height: 44, width: 110, borderRadius: 999 }} />
      </div>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
