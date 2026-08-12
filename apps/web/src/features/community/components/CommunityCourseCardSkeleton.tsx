/** Mirrors a single card in the community course grid (thumb, title, grade, CTA). */
export function CommunityCourseCardSkeleton() {
  return (
    <div className="card lift course-browse-card community-course-card">
      <div className="course-card-thumb-wrapper skeleton" />

      <div className="course-card-body">
        <div className="skeleton" style={{ height: 18, width: '85%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 13, width: '45%', borderRadius: 6 }} />

        <div className="course-card-footer community-course-footer">
          <div className="skeleton" style={{ height: 14, width: 100, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  )
}
