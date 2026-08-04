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
    <div className="flex flex-col gap-4 p-6">
      <h1 className="page-title">المبيعات</h1>
      <p className="page-subtitle">إجمالي المبيعات والطلبات الناجحة من الطلبات المؤكدة</p>

      <section className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="salesFrom" className="mb-1 block text-sm">
            من تاريخ
          </label>
          <input
            id="salesFrom"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="salesTo" className="mb-1 block text-sm">
            إلى تاريخ
          </label>
          <input
            id="salesTo"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <button
          onClick={() => void refetch()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          بحث
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الإيرادات</p>
          <p className="mt-1 text-2xl font-bold">
            {formatMoney(data.totalRevenue, data.currency)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">الطلبات الناجحة</p>
          <p className="mt-1 text-2xl font-bold">{data.successfulOrderCount}</p>
        </div>
      </section>

      {data.bestSellingCourse ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">الأكثر مبيعاً</h2>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{data.bestSellingCourse.courseTitle}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {data.bestSellingCourse.orderCount} طلب —{' '}
              {formatMoney(data.bestSellingCourse.totalRevenue, data.currency)}
            </p>
          </div>
        </section>
      ) : (
        <EmptyState title="لا توجد مبيعات" message="لم يتم تسجيل أي طلب ناجح في الفترة المحددة" />
      )}
    </div>
  )
}
