import { useState } from 'react'
import { DatePicker } from '../../../shared/components/DatePicker'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { showToast } from '../../../shared/components/Toast'
import { useSalesSummary } from '../hooks/useSalesSummary'

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency}`
}

function formatDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function TeacherSalesPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [activePreset, setActivePreset] = useState<string>('all')

  const { data, isLoading, error, refetch } = useSalesSummary({
    from: from || undefined,
    to: to || undefined,
  })

  // Quick Date Range Presets
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey)
    const today = new Date()
    const todayIso = formatDateIso(today)

    if (presetKey === 'today') {
      setFrom(todayIso)
      setTo(todayIso)
    } else if (presetKey === '7days') {
      const past = new Date()
      past.setDate(today.getDate() - 7)
      setFrom(formatDateIso(past))
      setTo(todayIso)
    } else if (presetKey === 'thisMonth') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      setFrom(formatDateIso(firstOfMonth))
      setTo(todayIso)
    } else if (presetKey === '3months') {
      const past = new Date()
      past.setMonth(today.getMonth() - 3)
      setFrom(formatDateIso(past))
      setTo(todayIso)
    } else {
      // 'all'
      setFrom('')
      setTo('')
    }
  }

  // Export Sales Report as CSV
  const handleExportCsv = () => {
    if (!data) return

    const rows = [
      ['تقرير المبيعات - CourseFlix'],
      ['فترة التقرير', `${from || 'الكل'} إلى ${to || 'الكل'}`],
      ['إجمالي الإيرادات', formatMoney(data.totalRevenue, data.currency)],
      ['الطلبات الناجحة', String(data.successfulOrderCount)],
      [''],
      ['اسم الدورة', 'عدد الطلبات', 'إجمالي الإيرادات', 'الحالة'],
    ]

    if (data.bestSellingCourse) {
      rows.push([
        data.bestSellingCourse.courseTitle,
        String(data.bestSellingCourse.orderCount),
        formatMoney(data.bestSellingCourse.totalRevenue, data.currency),
        'الأكثر مبيعاً',
      ])
    }

    rows.push([
      'إجمالي كل الدورات',
      String(data.successfulOrderCount),
      formatMoney(data.totalRevenue, data.currency),
      'مكتمل',
    ])

    const csvContent = '\uFEFF' + rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sales-report-${from || 'all'}-to-${to || 'all'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('تم تصدير تقرير المبيعات بنجاح')
  }

  if (isLoading) return <LoadingState variant="sales" />

  if (error) {
    return (
      <ErrorState
        title="المبيعات غير متاحة حالياً"
        message="تعذر الاتصال بخدمة المبيعات. يرجى المحاولة لاحقاً."
        onRetry={refetch}
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="لا توجد بيانات مبيعات"
        message="لم نتمكن من الوصول لبيانات المبيعات حالياً."
      />
    )
  }

  const avgOrderValue =
    data.successfulOrderCount > 0
      ? Math.round(data.totalRevenue / data.successfulOrderCount)
      : 0

  return (
    <>
      <div className="section-head" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="page-title">المبيعات</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            متابعة إجمالي المبيعات والطلبات الناجحة للأداء المالي والدورات المؤكدة
          </p>
        </div>
      </div>

      {/* Date Filter Card */}
      <section className="section">
        <div className="card" style={{ gap: 16 }}>
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 180 }}>
              <DatePicker
                id="salesFrom"
                label="من تاريخ"
                value={from}
                onChange={(val) => {
                  setFrom(val)
                  setActivePreset('')
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <DatePicker
                id="salesTo"
                label="إلى تاريخ"
                value={to}
                onChange={(val) => {
                  setTo(val)
                  setActivePreset('')
                }}
              />
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => void refetch()}
              aria-label="بحث بالفلاتر"
            >
              <span className="ms">search</span>
              بحث
            </button>

            <button
              type="button"
              className="btn tonal"
              onClick={handleExportCsv}
              disabled={!data || data.successfulOrderCount === 0}
              aria-label="تصدير تقرير المبيعات"
            >
              <span className="ms">download</span>
              تصدير CSV
            </button>
          </div>

          {/* Quick Filter Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface-variant)' }}>
              فترات سريعة:
            </span>
            <button
              type="button"
              className={`chip clickable ${activePreset === 'today' ? 'selected' : 'outline'}`}
              onClick={() => applyPreset('today')}
            >
              اليوم
            </button>
            <button
              type="button"
              className={`chip clickable ${activePreset === '7days' ? 'selected' : 'outline'}`}
              onClick={() => applyPreset('7days')}
            >
              آخر 7 أيام
            </button>
            <button
              type="button"
              className={`chip clickable ${activePreset === 'thisMonth' ? 'selected' : 'outline'}`}
              onClick={() => applyPreset('thisMonth')}
            >
              هذا الشهر
            </button>
            <button
              type="button"
              className={`chip clickable ${activePreset === '3months' ? 'selected' : 'outline'}`}
              onClick={() => applyPreset('3months')}
            >
              آخر 3 شهور
            </button>
            <button
              type="button"
              className={`chip clickable ${activePreset === 'all' ? 'selected' : 'outline'}`}
              onClick={() => applyPreset('all')}
            >
              كل الأوقات
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="tiles section">
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">payments</span>
          </span>
          <span className="lbl">إجمالي الإيرادات</span>
          <span className="num" style={{ wordBreak: 'break-word' }}>
            {formatMoney(data.totalRevenue, data.currency)}
          </span>
        </div>

        <div className="tile">
          <span className="lead-ic">
            <span className="ms">receipt_long</span>
          </span>
          <span className="lbl">الطلبات الناجحة</span>
          <span className="num">{data.successfulOrderCount}</span>
        </div>

        <div className="tile">
          <span className="lead-ic">
            <span className="ms">shopping_bag</span>
          </span>
          <span className="lbl">إجمالي الطلبات</span>
          <span className="num">{data.successfulOrderCount}</span>
        </div>

        <div className="tile">
          <span className="lead-ic">
            <span className="ms">bar_chart</span>
          </span>
          <span className="lbl">متوسط قيمة الطلب</span>
          <span className="num" style={{ wordBreak: 'break-word' }}>
            {formatMoney(avgOrderValue, data.currency)}
          </span>
        </div>
      </section>

      {/* Sales Table / Empty State */}
      {data.successfulOrderCount === 0 ? (
        <section className="section">
          <EmptyState
            title="لا توجد مبيعات خلال الفترة المحددة"
            message="لم نجد أي طلبات ناجحة في النطاق الزمني الحالي. جرب اختيارات الفلترة أو عرض جميع الأوقات."
          />
        </section>
      ) : (
        <section className="section">
          <div className="section-head">
            <h2>تفاصيل مبيعات الدورات</h2>
          </div>

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
                {data.bestSellingCourse && (
                  <tr>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700 }}>
                          {data.bestSellingCourse.courseTitle}
                        </span>
                        <span className="meta" style={{ fontSize: 12 }}>
                          الدورة الأكثر مبيعاً
                        </span>
                      </div>
                    </td>
                    <td>{data.bestSellingCourse.orderCount} طلبات</td>
                    <td style={{ fontWeight: 700 }}>
                      {formatMoney(data.bestSellingCourse.totalRevenue, data.currency)}
                    </td>
                    <td>
                      {formatMoney(
                        Math.round(
                          data.bestSellingCourse.totalRevenue /
                            (data.bestSellingCourse.orderCount || 1),
                        ),
                        data.currency,
                      )}
                    </td>
                    <td>
                      <span className="chip pink">
                        <span className="ms">star</span>
                        الأكثر مبيعاً
                      </span>
                    </td>
                  </tr>
                )}

                <tr>
                  <td>
                    <span style={{ fontWeight: 700 }}>إجمالي جميع الدورات</span>
                  </td>
                  <td>{data.successfulOrderCount} طلبات</td>
                  <td style={{ fontWeight: 700 }}>
                    {formatMoney(data.totalRevenue, data.currency)}
                  </td>
                  <td>{formatMoney(avgOrderValue, data.currency)}</td>
                  <td>
                    <span className="chip green">
                      <span className="ms">check_circle</span>
                      مكتمل
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
