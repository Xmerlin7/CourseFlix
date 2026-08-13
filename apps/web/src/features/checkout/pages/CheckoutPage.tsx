import { Link, useNavigate, useParams } from 'react-router'
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

export function CheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>()
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
  } = useCheckout(courseId ?? '')

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

  return (
    <>
      <h1 className="page-title">إتمام الشراء</h1>
      <p className="subtitle">راجع تفاصيل الطلب وأكمل الدفع</p>

      <div className="card section" style={{ gap: 8 }}>
        <span className="meta">{order.items[0]?.title ?? 'الدورة'}</span>
        <span style={{ fontSize: 26, fontWeight: 700 }}>
          {formatMoney(order.amountMinor, order.currency)}
        </span>
      </div>

      {declined && (
        <div className="card section" role="alert" style={{ borderInlineStart: '4px solid var(--error)' }}>
          <p style={{ fontWeight: 700, color: 'var(--on-error-container)' }}>تم رفض عملية الدفع</p>
          <p className="meta">لم تتم عملية الدفع بنجاح. يمكنك إعادة المحاولة.</p>
        </div>
      )}

      {confirmError && (
        <div className="card section" role="alert" style={{ borderInlineStart: '4px solid var(--error)' }}>
          <p style={{ color: 'var(--on-error-container)' }}>تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى.</p>
        </div>
      )}

      {paymobError && (
        <div className="card section" role="alert" style={{ borderInlineStart: '4px solid var(--error)' }}>
          <p style={{ color: 'var(--on-error-container)' }}>
            تعذر الاتصال بمزود الدفع. يرجى المحاولة مرة أخرى.
          </p>
        </div>
      )}

      <div className="actions">
        <button
          className="btn big"
          onClick={() => void payWithPaymob()}
          disabled={isInitiatingPaymob || isConfirming}
        >
          <span className="ms" aria-hidden="true">payments</span>
          {isInitiatingPaymob ? 'جاري التحويل إلى صفحة الدفع...' : declined ? 'إعادة المحاولة' : 'ادفع الآن'}
        </button>

        <button className="btn text" onClick={() => navigate(ROUTE_PATHS.STUDENT.BROWSE)}>
          الرجوع للدورات
        </button>
      </div>

      {/* Development-only shortcuts around the payment provider.
          `POST /checkout/orders/:ref/confirm` takes a `simulate` flag that
          the deterministic test adapter honours, so both outcomes can be
          reached without Paymob credentials or a real card — which is the
          only way to exercise the post-purchase flows (enrollment, the
          paid-order receipt, the decline retry) locally.

          Gated on import.meta.env.DEV so the block is dropped at build
          time and can never reach a production bundle. The previous
          "محاكاة رفض الدفع" button shipped to every user and did not
          simulate anything — it navigated to /student/browse. */}
      {import.meta.env.DEV && (
        <div className="card section dev-tools">
          <p className="dev-tools-title">
            <span className="ms sm">construction</span>
            أدوات المطوّر — لا تظهر في الإصدار النهائي
          </p>
          <div className="actions">
            <button
              className="btn tonal"
              onClick={() => void pay('success')}
              disabled={isConfirming || isInitiatingPaymob}
            >
              <span className="ms" aria-hidden="true">check_circle</span>
              {isConfirming ? 'جارٍ التأكيد...' : 'محاكاة نجاح الدفع'}
            </button>
            <button
              className="btn outlined"
              onClick={() => void pay('decline')}
              disabled={isConfirming || isInitiatingPaymob}
            >
              <span className="ms" aria-hidden="true">cancel</span>
              محاكاة رفض الدفع
            </button>
          </div>
        </div>
      )}
    </>
  )
}
