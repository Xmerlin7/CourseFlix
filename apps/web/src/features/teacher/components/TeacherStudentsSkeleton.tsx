import '../../../shared/components/Skeleton.css'

/**
 * Mirrors TeacherStudentsPage: title, stat tiles, the ID search field,
 * status filter chips, and the students table — all of which are
 * currently gated behind the same isLoading check as the table itself,
 * so the whole page (not just the table) needs a placeholder.
 */
export function TeacherStudentsSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="teacher-students-skeleton">
      <div className="skeleton" style={{ height: 28, width: 90, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: 340, borderRadius: 6, marginBottom: 28 }} />

      <section className="tiles section">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tile" style={{ gap: 10 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 13, width: 80, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 32, width: 60, borderRadius: 8 }} />
          </div>
        ))}
      </section>

      {/* Two search fields on this page: the server-side ID lookup and
          the client-side name/email box added with pagination. */}
      {[200, 150].map((labelWidth) => (
        <div key={labelWidth} className="tf search-field section">
          <div className="skeleton" style={{ height: 13, width: labelWidth, borderRadius: 6, marginBottom: 7 }} />
          <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 14 }} />
        </div>
      ))}

      <div className="actions section">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 36, width: 90, borderRadius: 999 }} />
        ))}
      </div>

      <div className="table-wrap section">
        <table className="mtable">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>ID</th>
              <th>حالة الاشتراك</th>
              <th>الكورسات</th>
              <th>إجمالي المدفوع</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td>
                  <div className="skeleton" style={{ height: 15, width: 120, borderRadius: 6, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 12, width: 150, borderRadius: 6 }} />
                </td>
                <td>
                  <div className="skeleton" style={{ height: 14, width: 90, borderRadius: 6 }} />
                </td>
                <td>
                  <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 999 }} />
                </td>
                <td>
                  <div className="skeleton" style={{ height: 32, width: 180, borderRadius: 14 }} />
                </td>
                <td>
                  <div className="skeleton" style={{ height: 15, width: 80, borderRadius: 6 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
