import '../../../shared/components/Skeleton.css'
import '../../support/components/SupportChat.css'
import { CourseSectionSkeleton } from '../../courses/components/CourseSectionSkeleton'

export function StudentCourseDetailSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="course-detail-skeleton">
      {/* Course Header Card Skeleton */}
      <div className="card course-detail-header-card">
        <div className="course-detail-header-top">
          <div className="course-detail-title-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 28, width: 260, borderRadius: 8 }} />
            <div className="course-detail-meta-list" style={{ gap: 12 }}>
              <div className="skeleton" style={{ height: 16, width: 90, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 16, width: 130, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 16, width: 80, borderRadius: 6 }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 40, width: 140, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6, marginTop: 4 }} />
      </div>

      {/* Tabs Skeleton */}
      <div className="course-detail-tabs" style={{ gap: 10, marginBottom: 22 }}>
        <div className="skeleton" style={{ height: 38, width: 110, borderRadius: 999 }} />
        <div className="skeleton" style={{ height: 38, width: 90, borderRadius: 999 }} />
        <div className="skeleton" style={{ height: 38, width: 100, borderRadius: 999 }} />
      </div>

      <CourseSectionSkeleton lessonCount={4} />
      <CourseSectionSkeleton lessonCount={3} />

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}

