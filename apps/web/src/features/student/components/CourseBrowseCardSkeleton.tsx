/** Mirrors a single course card on "استكشف الدورات" (thumb, title, teacher, price/CTA footer). */
export function CourseBrowseCardSkeleton() {
  return (
    <div className="card lift course-browse-card">
      <div className="course-card-thumb-wrapper skeleton" />

      <div className="course-card-body">
        <div className="skeleton" style={{ height: 20, width: '90%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 20, width: '60%', borderRadius: 6 }} />

        <div className="course-card-teacher">
          <div className="skeleton" style={{ height: 13, width: 90, borderRadius: 6 }} />
        </div>

        <div className="course-card-footer">
          <div className="skeleton" style={{ height: 16, width: 70, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 32, width: 90, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  )
}
