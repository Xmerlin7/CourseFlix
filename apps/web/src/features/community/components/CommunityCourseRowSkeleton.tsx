/** Mirrors a single row in the community conversation-style course list. */
export function CommunityCourseRowSkeleton() {
  return (
    <div className="community-row">
      <div className="community-row-avatar skeleton" />

      <div className="community-row-main">
        <div className="community-row-line1">
          <div className="skeleton" style={{ height: 15, width: '45%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 11, width: 34, borderRadius: 6 }} />
        </div>
        <div className="community-row-line2">
          <div className="skeleton" style={{ height: 11, width: '30%', borderRadius: 6 }} />
        </div>
        <div className="community-row-line3">
          <div className="skeleton" style={{ height: 12, width: '65%', borderRadius: 6 }} />
        </div>
      </div>
    </div>
  )
}
