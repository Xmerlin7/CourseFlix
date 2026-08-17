import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { ApiError } from '../../../shared/api/api-error'
import { useCheckout } from '../hooks/useCheckout'
import { CreditCard3D } from '../components/CreditCard3D'
import { CardPaymentForm } from '../components/CardPaymentForm'
import { detectBrand, formatCardNumber } from '../lib/card-utils'

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

function PaymobFrame({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="pay-frame" role="region" aria-label="بوابة الدفع الآمنة">
      <div className="pay-frame-head">
        <span className="ms" aria-hidden="true">
          lock
        </span>
        <strong>بوابة الدفع الآمنة</strong>
        <button type="button" className="btn text" onClick={onClose}>
          إلغاء
        </button>
      </div>
      <iframe src={url} title="بوابة الدفع الآمنة" className="pay-frame-iframe" />
    </div>
  )
}

export function CheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const {
    order,
    isCreating,
    isConfirming,
    isInitiatingPaymob,
    createError,
    confirmError,
    paymobError,
    pay,
    payWithPaymob,
    retryCreate,
  } = useCheckout(courseId ?? '', searchParams.get('order'))

  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cvvFocused, setCvvFocused] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  useEffect(() => {
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href
    }
  }, [])

  const handlePaymob = async () => {
    const url = await payWithPaymob()
    if (url) {
      setPaymentUrl(url)
    }
  }

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
        onRetry={retryCreate}
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
  const item = order.items[0]

  return (
    <>
      <h1 className="page-title">إتمام الشراء</h1>
      <p className="subtitle">راجع تفاصيل الطلب وأكمل الدفع بأمان</p>

      {declined && (
        <ErrorBanner message="تم رفض عملية الدفع" detail="لم تتم عملية الدفع بنجاح. يمكنك إعادة المحاولة." />
      )}

      {confirmError && <ErrorBanner message="تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى." />}

      {paymobError && (
        <ErrorBanner message="تعذر الاتصال بمزود الدفع. يرجى المحاولة مرة أخرى." detail={getServerMessage(paymobError)} />
      )}

      <div className="checkout-grid">
        <aside className="card checkout-aside">
          <span className="ms checkout-aside-icon" aria-hidden="true">
            shopping_bag
          </span>
          <div className="checkout-aside-body">
            <h2>ملخص الطلب</h2>
            <p className="meta">{item?.title ?? 'الدورة'}</p>
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
              <PaymobFrame url={paymentUrl} onClose={() => setPaymentUrl(null)} />
              <p className="ccard-frame-hint">
                أكمل الدفع في النافذة الآمنة — بعد الإتمام سيتم تحويلك تلقائياً إلى صفحة التأكيد.
              </p>
            </>
          ) : import.meta.env.DEV ? (
            <>
              <CreditCard3D
                number={formatCardNumber(cardNumber)}
                holderName={cardName}
                expiry={cardExpiry}
                cvv={cardCvv}
                brand={detectBrand(cardNumber)}
                flipped={cvvFocused}
              />
              <div className="ccard-form-wrap">
                <CardPaymentForm
                  name={cardName}
                  number={cardNumber}
                  expiry={cardExpiry}
                  cvv={cardCvv}
                  isConfirming={isConfirming}
                  onNameChange={setCardName}
                  onNumberChange={setCardNumber}
                  onExpiryChange={setCardExpiry}
                  onCvvChange={setCardCvv}
                  onCvvFocusChange={setCvvFocused}
                  onPay={pay}
                />
                <div className="ccard-or" aria-hidden="true">
                  <span>أو</span>
                </div>
                <button
                  type="button"
                  className="btn outlined"
                  onClick={() => void handlePaymob()}
                  disabled={isInitiatingPaymob || isConfirming}
                >
                  <span className="ms" aria-hidden="true">
                    payments
                  </span>
                  {isInitiatingPaymob ? 'جاري فتح بوابة الدفع...' : 'الدفع عبر بوابة Paymob'}
                </button>
              </div>
            </>
          ) : (
            <>
              <CreditCard3D
                number=""
                holderName=""
                expiry=""
                cvv=""
                brand="unknown"
                flipped={false}
              />
              <div className="ccard-form-wrap ccard-pay-cta">
                <p className="meta" style={{ textAlign: 'center' }}>
                  سيتم تحويلك إلى بوابة الدفع الآمنة لإتمام العملية — بيانات البطاقة لا تمر أبداً عبر
                  خوادمنا.
                </p>
                <button
                  type="button"
                  className="btn big"
                  onClick={() => void handlePaymob()}
                  disabled={isInitiatingPaymob}
                >
                  <span className="ms" aria-hidden="true">
                    lock
                  </span>
                  {isInitiatingPaymob ? 'جاري فتح بوابة الدفع...' : 'ادفع الآن'}
                </button>
              </div>
            </>
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