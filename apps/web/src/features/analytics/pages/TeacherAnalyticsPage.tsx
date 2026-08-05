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
    <>
      <h1 className="page-title">مساعد التحليلات</h1>
      <p className="subtitle">اسأل أسئلة مبيعات مدعومة فقط</p>

      <form onSubmit={submit} className="section" style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="اكتب سؤالك هنا..."
          maxLength={500}
          className="field"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn" disabled={!question.trim() || isLoading}>
          <span className="ms">send</span>
          {isLoading ? 'جاري المعالجة...' : 'إرسال'}
        </button>
      </form>

      <div className="actions section">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="chip clickable outline"
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

      {isLoading && <p className="subtitle">جاري المعالجة...</p>}

      {data?.status === 'success' && (
        <div className="section">
          {'totalRevenue' in data.result && (
            <div className="tiles">
              <div className="tile">
                <span className="lead-ic">
                  <span className="ms">payments</span>
                </span>
                <span className="lbl">إجمالي الإيرادات</span>
                <span className="num">{formatMoney(data.result.totalRevenue)}</span>
              </div>
              <div className="tile">
                <span className="lead-ic">
                  <span className="ms">receipt_long</span>
                </span>
                <span className="lbl">عدد الطلبات</span>
                <span className="num">{data.result.orderCount}</span>
              </div>
            </div>
          )}

          {'successfulOrderCount' in data.result && (
            <div className="tiles">
              <div className="tile">
                <span className="lead-ic">
                  <span className="ms">task_alt</span>
                </span>
                <span className="lbl">الطلبات الناجحة</span>
                <span className="num">{data.result.successfulOrderCount}</span>
              </div>
            </div>
          )}

          {'bestSellers' in data.result && (
            <div className="list">
              {data.result.bestSellers.length === 0 ? (
                <p className="subtitle" style={{ marginBottom: 0 }}>
                  لا توجد دورات مباعة في الفترة المحددة
                </p>
              ) : (
                data.result.bestSellers.map((c) => (
                  <div key={c.courseId} className="list-item">
                    <span className="lead">
                      <span className="ms">menu_book</span>
                    </span>
                    <span className="body">
                      <span className="t">{c.courseTitle}</span>
                      <span className="s">
                        {c.orderCount} طلب — {formatMoney(c.totalRevenue)}
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {data?.status === 'unsupported' && (
        <div className="card section" style={{ borderInlineStart: '4px solid var(--error)' }}>
          <h3 style={{ color: 'var(--on-error-container)', marginBottom: 10 }}>{data.message}</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingInlineStart: 20, listStyle: 'disc' }}>
            {data.examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
