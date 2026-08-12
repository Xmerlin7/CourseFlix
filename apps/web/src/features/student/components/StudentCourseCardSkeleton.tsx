/** Mirrors a single StudentCourseCard on "دوراتي" (thumb, title+status chip, progress, CTA). */
export function StudentCourseCardSkeleton() {
  return (
    <div className="card lift student-course-card">
      <div className="student-card-thumb-wrapper skeleton" />

      <div className="student-card-body">
        <div className="student-card-head">
          <div className="skeleton" style={{ height: 18, width: '65%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 24, width: 60, borderRadius: 999, flexShrink: 0 }} />
        </div>

        <div className="student-card-progress-section">
          <div className="progress-label-row">
            <div className="skeleton" style={{ height: 12, width: 80, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 12, width: 30, borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ height: 6, width: '100%', borderRadius: 999 }} />
        </div>

        <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6 }} />

        <div className="student-card-footer">
          <div className="skeleton" style={{ height: 32, width: '100%', borderRadius: 999 }} />
        </div>
      </div>
    </div>
  )
}
