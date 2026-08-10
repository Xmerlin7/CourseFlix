/** Mirrors a single course card on المعلم's دوراتي (thumb + title/meta/status). */
export function TeacherCourseCardSkeleton() {
  return (
    <div className="card lift course-card">
      <div className="row">
        <div className="thumb skeleton" style={{ width: 118, height: 112, flex: 'none', borderRadius: 12 }} />
        <div className="info">
          <div className="skeleton" style={{ height: 18, width: '80%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: '40%', borderRadius: 6 }} />
          <div className="actions">
            <div className="skeleton" style={{ height: 24, width: 70, borderRadius: 999 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
