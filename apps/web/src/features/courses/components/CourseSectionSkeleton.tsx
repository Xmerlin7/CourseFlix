/** Mirrors one CourseDetailView section: a header + a list of lesson rows. */
export function CourseSectionSkeleton({ lessonCount = 3 }: { lessonCount?: number }) {
  return (
    <section className="section">
      <div className="section-head">
        <div className="skeleton" style={{ height: 22, width: 160, borderRadius: 6 }} />
      </div>
      <div className="list">
        {Array.from({ length: lessonCount }).map((_, i) => (
          <div key={i} className="list-item">
            <span className="lead skeleton" style={{ borderRadius: '50%' }} />
            <span className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="skeleton" style={{ height: 15, width: i % 2 === 0 ? '70%' : '55%', borderRadius: 6 }} />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
