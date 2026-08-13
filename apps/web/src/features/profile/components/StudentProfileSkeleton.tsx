import '../../../shared/components/Skeleton.css'

/**
 * Mirrors StudentProfilePage's structure 1:1 (identity card,
 * the basic-info card, the nav-row list, and the footer) so swapping this
 * out for the real page causes no layout shift.
 */
export function StudentProfileSkeleton() {
  return (
    <div
      className="profile-page skeleton-pulse"
      role="status"
      aria-label="جاري تحميل الملف الشخصي"
      data-testid="student-profile-skeleton"
    >
      <div className="card profile-identity-card">
        <div className="profile-avatar-wrap">
          <div className="skeleton" style={{ width: 88, height: 88, borderRadius: '50%' }} />
        </div>
        <div className="profile-identity-text">
          <div className="skeleton" style={{ height: 22, width: 170, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: 210, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 24, width: 60, borderRadius: 999, marginTop: 6 }} />
        </div>
      </div>

      <div className="card profile-form-card">
        <div className="skeleton" style={{ height: 18, width: 140, borderRadius: 6 }} />
        <div className="tf">
          <div className="skeleton" style={{ height: 13, width: 90, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
        </div>
        <div className="tf" style={{ marginBottom: 0 }}>
          <div className="skeleton" style={{ height: 13, width: 110, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
        </div>
      </div>

      <section className="section profile-nav-list">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="list-item">
            <span className="lead skeleton" style={{ borderRadius: '50%' }} />
            <span className="body">
              <span className="skeleton" style={{ height: 15, width: '40%', borderRadius: 6 }} />
            </span>
            <span className="end">
              <span className="skeleton" style={{ height: 20, width: 20, borderRadius: 6 }} />
            </span>
          </div>
        ))}
      </section>

      <footer className="profile-footer">
        <div className="profile-footer-links">
          <div className="skeleton" style={{ height: 20, width: 100, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 20, width: 100, borderRadius: 6 }} />
        </div>
        <div className="profile-footer-actions">
          <div className="skeleton" style={{ height: 44, width: 140, borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 44, width: 110, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ height: 13, width: 70, borderRadius: 6 }} />
      </footer>

      <span className="skeleton-sr-only">جاري تحميل الملف الشخصي</span>
    </div>
  )
}
