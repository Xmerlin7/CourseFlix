import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { useSalesSummary } from '../hooks/useSalesSummary'

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency}`
}

export function TeacherSalesPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data, isLoading, error, refetch } = useSalesSummary({
    from: from || undefined,
    to: to || undefined,
  })

  if (isLoading) return <LoadingState />
  if (error) {
    return (
      <ErrorState
        title="المبيعات غير متاحة حالياً"
        message="تعذر الاتصال بخدمة المبيعات. يرجى المحاولة لاحقاً."
        onRetry={refetch}
      />
    )
  }
  if (!data) return <EmptyState title="لا توجد بيانات" message="لا توجد بيانات مبيعات بعد" />

  return (
    <>
      <h1 className="page-title">المبيعات</h1>
      <p className="subtitle">إجمالي المبيعات والطلبات الناجحة من الطلبات المؤكدة</p>

      <section className="actions section" style={{ alignItems: 'flex-end' }}>
        <div className="tf" style={{ marginBottom: 0, minWidth: 160 }}>
          <label htmlFor="salesFrom">من تاريخ</label>
          <input id="salesFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="tf" style={{ marginBottom: 0, minWidth: 160 }}>
          <label htmlFor="salesTo">إلى تاريخ</label>
          <input id="salesTo" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn" onClick={() => void refetch()}>
          <span className="ms">search</span>
          بحث
        </button>
      </section>

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
      </section>

      {data.bestSellingCourse ? (
        <section className="section">
          <div className="section-head">
            <h2>الأكثر مبيعاً</h2>
          </div>
          <div className="card">
            <h3 style={{ wordBreak: 'break-word' }}>{data.bestSellingCourse.courseTitle}</h3>
            <span className="meta">
              {data.bestSellingCourse.orderCount} طلب — {formatMoney(data.bestSellingCourse.totalRevenue, data.currency)}
            </span>
          </div>
        </section>
      ) : (
        <EmptyState title="لا توجد مبيعات" message="لم يتم تسجيل أي طلب ناجح في الفترة المحددة" />
      )}
    </>
  )
}
