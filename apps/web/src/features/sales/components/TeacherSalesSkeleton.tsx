import '../../../shared/components/Skeleton.css'

/** Mirrors TeacherSalesPage: title, date-filter card with presets, stat tiles, and the sales table. */
export function TeacherSalesSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="sales-skeleton">
      <div className="section-head" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 28, width: 100, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 340, borderRadius: 6 }} />
        </div>
      </div>

      <section className="section">
        <div className="card" style={{ gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div className="skeleton" style={{ height: 14, width: 70, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 14 }} />
              </div>
            ))}
            <div className="skeleton" style={{ height: 44, width: 90, borderRadius: 999 }} />
            <div className="skeleton" style={{ height: 44, width: 120, borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="skeleton" style={{ height: 14, width: 70, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 32, width: 55, borderRadius: 999 }} />
            <div className="skeleton" style={{ height: 32, width: 85, borderRadius: 999 }} />
            <div className="skeleton" style={{ height: 32, width: 75, borderRadius: 999 }} />
            <div className="skeleton" style={{ height: 32, width: 90, borderRadius: 999 }} />
            <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 999 }} />
          </div>
        </div>
      </section>

      <section className="tiles section">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tile" style={{ gap: 10 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 13, width: 90, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 32, width: 110, borderRadius: 8 }} />
          </div>
        ))}
      </section>

      <section className="section">
        <div className="skeleton" style={{ height: 24, width: 170, borderRadius: 6, marginBottom: 20 }} />
        <div className="table-wrap">
          <table className="mtable">
            <thead>
              <tr>
                <th>الدورة</th>
                <th>عدد الطلبات</th>
                <th>إجمالي الإيرادات</th>
                <th>متوسط سعر الطلب</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {/* the table only ever holds a best-seller row + a totals row */}
              {Array.from({ length: 2 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className="skeleton" style={{ height: 15, width: 140, borderRadius: 6 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ height: 15, width: 70, borderRadius: 6 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ height: 15, width: 90, borderRadius: 6 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ height: 15, width: 90, borderRadius: 6 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ height: 24, width: 90, borderRadius: 999 }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
