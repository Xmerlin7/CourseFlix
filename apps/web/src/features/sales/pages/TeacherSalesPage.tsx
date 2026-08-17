import { useState } from 'react'
import { DatePicker } from '../../../shared/components/DatePicker'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { showToast } from '../../../shared/components/Toast'
import { useSalesSummary } from '../hooks/useSalesSummary'
import { TeacherSalesSkeleton } from '../components/TeacherSalesSkeleton'

// NaN-safe: a malformed/partial API response must never render "NaN",
// "undefined" or "EGP NaN" — fall back to a plain dash instead.
function formatMoney(minor: number | null | undefined, currency: string | null | undefined) {
  if (typeof minor !== 'number' || !Number.isFinite(minor)) return '-'
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency ?? ''}`.trim()
}

function formatCount(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return value.toLocaleString('ar-EG')
}

function formatDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// CSV cells are quoted, so any embedded quote must be doubled or it
// terminates the cell early and corrupts every column after it.
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function TeacherSalesPage() {
  // Draft values bound to the date pickers/inputs — editing these alone
  // must NOT hit the API (see handleSearch). Only a preset or an explicit
  // "بحث" click commits them into appliedFilters, which is what the hook
  // (and CSV export) actually use — otherwise every keystroke/day-pick
  // fires its own request, and a later "بحث" click fires yet another
  // redundant one for the same values.
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<{ from?: string; to?: string }>({})
  const [activePreset, setActivePreset] = useState<string>('all')

  const { data, isLoading, error, refetch } = useSalesSummary(appliedFilters)

  // Quick Date Range Presets — only fill in the date fields. Like manual
  // date-picker edits, a preset alone must not hit the API: the user still
  // confirms with "بحث", so every filter change goes through one single
  // request path instead of firing on every field change.
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey)
    const today = new Date()
    const todayIso = formatDateIso(today)

    let nextFrom = ''
    let nextTo = ''

    if (presetKey === 'today') {
      nextFrom = todayIso
      nextTo = todayIso
    } else if (presetKey === '7days') {
      const past = new Date()
      past.setDate(today.getDate() - 7)
      nextFrom = formatDateIso(past)
      nextTo = todayIso
    } else if (presetKey === 'thisMonth') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      nextFrom = formatDateIso(firstOfMonth)
      nextTo = todayIso
    } else if (presetKey === '3months') {
      const past = new Date()
      past.setMonth(today.getMonth() - 3)
      nextFrom = formatDateIso(past)
      nextTo = todayIso
    }
    // else 'all' — nextFrom/nextTo stay '' (no filter)

    setFrom(nextFrom)
    setTo(nextTo)
  }

  const handleSearch = () => {
    if (from && to && from > to) {
      showToast('تاريخ "من" يجب أن يكون قبل تاريخ "إلى"', 'error')
      return
    }
    setAppliedFilters({ from: from || undefined, to: to || undefined })
    refetch()
  }

  // Export Sales Report as CSV — reflects the filters that produced the
  // currently-displayed `data`, not any unsubmitted draft still sitting in
  // the date pickers.
  const handleExportCsv = () => {
    if (!data) return

    const appliedFrom = appliedFilters.from ?? ''
    const appliedTo = appliedFilters.to ?? ''

    const rows = [
      ['تقرير المبيعات - CourseFlix'],
      ['فترة التقرير', `${appliedFrom || 'الكل'} إلى ${appliedTo || 'الكل'}`],
      ['إجمالي الإيرادات', formatMoney(data.revenueMinor, data.currency)],
      ['الطلبات الناجحة', String(data.ordersCount)],
      [''],
      ['اسم الدورة', 'عدد الطلبات', 'إجمالي الإيرادات', 'الحالة'],
    ]

    if (data.bestSeller) {
      rows.push([
        data.bestSeller.title,
        String(data.bestSeller.ordersCount),
        formatMoney(data.bestSeller.revenueMinor, data.currency),
        'الأكثر مبيعاً',
      ])
    }

    rows.push([
      'إجمالي جميع الدورات',
      String(data.ordersCount),
      formatMoney(data.revenueMinor, data.currency),
      'مكتمل',
    ])

    const csvContent = '﻿' + rows.map((r) => r.map((cell) => csvCell(cell)).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sales-report-${appliedFrom || 'all'}-to-${appliedTo || 'all'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('تم تصدير تقرير المبيعات بنجاح')
  }

  if (isLoading) return <TeacherSalesSkeleton />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
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
    data.ordersCount > 0 ? Math.round(data.revenueMinor / data.ordersCount) : 0

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
              onClick={handleSearch}
              aria-label="بحث بالفلاتر"
            >
              <span className="ms">search</span>
              بحث
            </button>

            <button
              type="button"
              className="btn tonal"
              onClick={handleExportCsv}
              disabled={!data || data.ordersCount === 0}
              aria-label="تصدير تقرير المبيعات"
            >
              <span className="ms">download</span>
              تصدير CSV
            </button>
          </div>

          {/* Quick Filter Presets */}
          <div className="actions">
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
            {formatMoney(data.revenueMinor, data.currency)}
          </span>
        </div>

        <div className="tile">
          <span className="lead-ic">
            <span className="ms">receipt_long</span>
          </span>
          <span className="lbl">الطلبات الناجحة</span>
          <span className="num">{formatCount(data.ordersCount)}</span>
        </div>

        <div className="tile">
          <span className="lead-ic">
            <span className="ms">shopping_bag</span>
          </span>
          <span className="lbl">إجمالي الطلبات</span>
          <span className="num">{formatCount(data.ordersCount)}</span>
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
      {data.ordersCount === 0 ? (
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
                {data.bestSeller && (
                  <tr>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700 }}>{data.bestSeller.title}</span>
                        <span className="meta" style={{ fontSize: 12 }}>
                          الدورة الأكثر مبيعاً
                        </span>
                      </div>
                    </td>
                    <td>{formatCount(data.bestSeller.ordersCount)} طلبات</td>
                    <td style={{ fontWeight: 700 }}>
                      {formatMoney(data.bestSeller.revenueMinor, data.currency)}
                    </td>
                    <td>
                      {formatMoney(
                        Math.round(
                          data.bestSeller.revenueMinor / (data.bestSeller.ordersCount || 1),
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
                  <td>{formatCount(data.ordersCount)} طلبات</td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(data.revenueMinor, data.currency)}</td>
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
