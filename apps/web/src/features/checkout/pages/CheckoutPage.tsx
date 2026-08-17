import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { ApiError } from '../../../shared/api/api-error'
import { useCheckout } from '../hooks/useCheckout'

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency}`
}

function getServerMessage(error: ApiError): string | null {
  const details = error.details
  if (details && typeof details === 'object' && 'message' in details) {
    const message = (details as { message?: unknown }).message
    return typeof message === 'string' ? message : null
  }
  return null
}

type NoticeCardProps = {
  icon: string
  title: string
  message: string
  actionLabel: string
  actionTo: string
}

function NoticeCard({ icon, title, message, actionLabel, actionTo }: NoticeCardProps) {
  return (
    <div className="card" style={{ alignItems: 'center', textAlign: 'center', gap: 18, padding: '48px 32px' }}>
      <span className="lead" style={{ width: 64, height: 64 }}>
        <span className="ms" style={{ fontSize: 32 }}>
          {icon}
        </span>
      </span>
      <div>
        <h3 style={{ marginBottom: 6 }}>{title}</h3>
        <p className="meta">{message}</p>
      </div>
      <Link className="btn" to={actionTo}>
        {actionLabel}
      </Link>
    </div>
  )
}

function ErrorBanner({ message, detail }: { message: string; detail?: string | null }) {
  return (
    <div className="card section" role="alert" style={{ borderInlineStart: '4px solid var(--error)' }}>
      <p style={{ fontWeight: 700, color: 'var(--error)' }}>{message}</p>
      {detail && (
        <p className="meta" dir="ltr" style={{ marginTop: 4 }}>
          {detail}
        </p>
      )}
    </div>
  )
}

function PaymobFrame({ url }: { url: string }) {
  return (
    <div className="pay-frame" role="region" aria-label="بوابة الدفع الآمنة">
      <div className="pay-frame-head">
        <span className="ms" aria-hidden="true">
          lock
        </span>
        <strong>بوابة الدفع الآمنة</strong>
      </div>
      <iframe src={url} title="بوابة الدفع الآمنة" className="pay-frame-iframe" />
    </div>
  )
}

type CheckoutContentProps = {
  courseId: string
  existingOrderId: string | null
  pollMs: number
  onRetry: () => void
}

function CheckoutContent({ courseId, existingOrderId, pollMs, onRetry }: CheckoutContentProps) {
  const navigate = useNavigate()
  const {
    order,
    isCreating,
    isInitiatingPaymob,
    paymentUrl,
    createError,
    paymobError,
    payWithPaymob,
  } = useCheckout(courseId, existingOrderId, pollMs)

  useEffect(() => {
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href
    }
  }, [])

  if (isCreating) {
    return <LoadingState variant="text" />
  }

  if (createError) {
    if (createError.status === 404) {
      return (
        <NotFoundState
          title="الدورة غير موجودة"
          message="لم نتمكن من العثور على هذه الدورة. ربما تم حذفها."
        />
      )
    }

    if (createError.status === 409) {
      const alreadyOwned = getServerMessage(createError)?.includes('already own') ?? false

      if (alreadyOwned) {
        return (
          <NoticeCard
            icon="check_circle"
            title="أنت مسجل بالفعل في هذه الدورة"
            message="لا حاجة للشراء مرة أخرى — يمكنك متابعة الدورة الآن."
            actionLabel="الذهاب إلى الدورة"
            actionTo={`/student/courses/${courseId}`}
          />
        )
      }

      return (
        <NoticeCard
          icon="lock_clock"
          title="هذه الدورة غير متاحة للشراء حالياً"
          message="الدورة غير منشورة حالياً، حاول لاحقاً أو تواصل مع المعلم."
          actionLabel="الرجوع إلى دوراتي"
          actionTo={ROUTE_PATHS.STUDENT.COURSES}
        />
      )
    }

    return (
      <ErrorState
        title="تعذر بدء عملية الشراء"
        message="حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
        onRetry={onRetry}
      />
    )
  }

  if (!order) {
    return <NotFoundState />
  }

  if (order.status === 'paid') {
    return (
      <div className="section" style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          className="card"
          role="status"
          style={{ alignItems: 'center', textAlign: 'center', gap: 14, maxWidth: 440, padding: '48px 36px' }}
        >
          <span className="lead green" style={{ width: 64, height: 64 }}>
            <span className="ms fill" style={{ fontSize: 34 }}>
              check_circle
            </span>
          </span>
          <h1 className="page-title" style={{ margin: 0 }}>
            تم الدفع بنجاح
          </h1>
          <p className="meta">
            رقم الطلب: <span dir="ltr">{order.orderReference}</span>
          </p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>
            {formatMoney(order.amountMinor, order.currency)}
          </p>
          <p className="meta">تم تسجيلك في {order.items[0]?.title ?? 'الدورة'} بنجاح.</p>
          <Link className="btn big" to={`/student/courses/${order.items[0]?.courseId ?? courseId}`}>
            <span className="ms">play_arrow</span>
            بدء التعلم
          </Link>
        </div>
      </div>
    )
  }

  const declined = order.paymentStatus === 'failed'
  const opening = !paymentUrl && !paymobError && !declined

  return (
    <>
      <h1 className="page-title">إتمام الشراء</h1>
      <p className="subtitle">راجع تفاصيل الطلب وأكمل الدفع بأمان</p>

      {declined && (
        <ErrorBanner message="تم رفض عملية الدفع" detail="لم تتم عملية الدفع بنجاح. يمكنك إعادة المحاولة." />
      )}

      {paymobError && (
        <ErrorBanner
          message="تعذر الاتصال بمزود الدفع. يرجى المحاولة مرة أخرى."
          detail={getServerMessage(paymobError)}
        />
      )}

      <div className="checkout-grid">
        <aside className="card checkout-aside">
          <span className="ms checkout-aside-icon" aria-hidden="true">
            shopping_bag
          </span>
          <div className="checkout-aside-body">
            <h2>ملخص الطلب</h2>
            <p className="meta">{order.items[0]?.title ?? 'الدورة'}</p>
            <div className="checkout-aside-row">
              <span>سعر الدورة</span>
              <b>{formatMoney(order.amountMinor, order.currency)}</b>
            </div>
            <div className="checkout-aside-row checkout-aside-total">
              <span>الإجمالي</span>
              <b>{formatMoney(order.amountMinor, order.currency)}</b>
            </div>
            <p className="checkout-aside-secure">
              <span className="ms" aria-hidden="true">
                lock
              </span>
              دفع آمن ومشفّر
            </p>
          </div>
        </aside>

        <section className="card checkout-panel">
          {paymentUrl ? (
            <>
              <PaymobFrame url={paymentUrl} />
              <p className="ccard-frame-hint">
                أكمل الدفع في النافذة الآمنة — بعد الإتمام سيتم تحويلك تلقائياً إلى صفحة التأكيد.
              </p>
            </>
          ) : (
            <div className="ccard-pay-cta">
              {(paymobError || declined) && (
                <button
                  type="button"
                  className="btn big"
                  onClick={() => void payWithPaymob()}
                  disabled={isInitiatingPaymob}
                >
                  <span className="ms" aria-hidden="true">
                    lock
                  </span>
                  {isInitiatingPaymob ? 'جاري فتح بوابة الدفع...' : 'إعادة المحاولة'}
                </button>
              )}
              {opening && (
                <p className="meta">
                  <span className="ms" aria-hidden="true" style={{ fontSize: 16, verticalAlign: '-3px' }}>
                    lock
                  </span>{' '}
                  جاري فتح بوابة الدفع الآمنة...
                </p>
              )}
            </div>
          )}

          <div className="checkout-back">
            <button type="button" className="btn text" onClick={() => navigate(ROUTE_PATHS.STUDENT.BROWSE)}>
              الرجوع للدورات
            </button>
          </div>
        </section>
      </div>
    </>
  )
}

export function CheckoutPage({ pollMs = 2500 }: { pollMs?: number }) {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const [attempt, setAttempt] = useState(0)
  const existingOrderId = searchParams.get('order')

  return (
    <CheckoutContent
      key={`${courseId ?? ''}:${existingOrderId ?? ''}:${attempt}`}
      courseId={courseId ?? ''}
      existingOrderId={existingOrderId}
      pollMs={pollMs}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  )
}