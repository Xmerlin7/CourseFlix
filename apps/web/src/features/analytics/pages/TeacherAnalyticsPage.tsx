import { useState } from 'react'
import { ErrorState } from '../../../shared/components/ErrorState'
import { useAnalyticsQuestion } from '../hooks/useAnalyticsQuestion'

const EXAMPLES = [
  'كم إيراداتي من 1 يناير إلى 31 مارس؟',
  'عدد الطلبات الناجحة هذا الشهر',
  'ما هي الدورات الأكثر مبيعاً؟',
]

function formatMoney(minor: number) {
  return `${(minor / 100).toLocaleString('ar-EG')} EGP`
}

export function TeacherAnalyticsPage() {
  const [question, setQuestion] = useState('')
  const { data, isLoading, error, ask } = useAnalyticsQuestion()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (q) void ask(q)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="page-title">مساعد التحليلات</h1>
      <p className="page-subtitle">اسأل أسئلة مبيعات مدعومة فقط</p>

      <form onSubmit={submit} className="flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="اكتب سؤالك هنا..."
          className="flex-1 rounded-lg border px-3 py-2"
          maxLength={500}
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={!question.trim() || isLoading}
        >
          {isLoading ? 'جاري المعالجة...' : 'إرسال'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="rounded-full border px-4 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => {
              setQuestion(ex)
              void ask(ex)
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <ErrorState onRetry={() => question && void ask(question)} />}

      {isLoading && <p className="text-gray-500 dark:text-gray-400">جاري المعالجة...</p>}

      {data?.status === 'success' && (
        <div className="flex flex-col gap-4 rounded-lg border p-5">
          {'totalRevenue' in data.result && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الإيرادات</p>
                <p className="mt-1 text-2xl font-bold">{formatMoney(data.result.totalRevenue)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">عدد الطلبات</p>
                <p className="mt-1 text-2xl font-bold">{data.result.orderCount}</p>
              </div>
            </div>
          )}
          {'successfulOrderCount' in data.result && (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">الطلبات الناجحة</p>
              <p className="mt-1 text-2xl font-bold">{data.result.successfulOrderCount}</p>
            </div>
          )}
          {'bestSellers' in data.result && (
            <div className="flex flex-col gap-2">
              {data.result.bestSellers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">لا توجد دورات مباعة في الفترة المحددة</p>
              ) : (
                data.result.bestSellers.map((c) => (
                  <div key={c.courseId} className="rounded-lg border p-3">
                    <p className="font-semibold">{c.courseTitle}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {c.orderCount} طلب — {formatMoney(c.totalRevenue)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {data?.status === 'unsupported' && (
        <div className="rounded-lg border border-red-300 p-5">
          <h3 className="mb-2 font-semibold text-red-600 dark:text-red-400">{data.message}</h3>
          <ul className="list-disc space-y-1 pr-5">
            {data.examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
