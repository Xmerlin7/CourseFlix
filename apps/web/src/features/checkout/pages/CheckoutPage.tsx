import { Link, useParams } from 'react-router'
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

export function CheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { order, isCreating, isConfirming, createError, confirmError, pay, retryCreate } =
    useCheckout(courseId ?? '')

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
          <div className="flex flex-col items-center gap-4 py-12 px-6 text-center" role="status">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              أنت مسجل بالفعل في هذه الدورة
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              لا حاجة للشراء مرة أخرى — يمكنك متابعة الدورة الآن.
            </p>
            <Link
              to={`/student/courses/${courseId}`}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              الذهاب إلى الدورة
            </Link>
          </div>
        )
      }

      return (
        <div className="flex flex-col items-center gap-4 py-12 px-6 text-center" role="status">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            هذه الدورة غير متاحة للشراء حالياً
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            الدورة غير منشورة حالياً، حاول لاحقاً أو تواصل مع المعلم.
          </p>
          <Link
            to={ROUTE_PATHS.STUDENT.COURSES}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            الرجوع إلى دوراتي
          </Link>
        </div>
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
      <div className="flex flex-col gap-4 p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-green-300 p-8 text-center dark:border-green-700"
          role="status"
        >
          <h1 className="page-title">تم الدفع بنجاح</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            رقم الطلب: <span dir="ltr">{order.orderReference}</span>
          </p>
          <p className="text-2xl font-bold">{formatMoney(order.amountMinor, order.currency)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تم تسجيلك في {order.items[0]?.title ?? 'الدورة'} بنجاح.
          </p>
          <Link
            to={`/student/courses/${order.items[0]?.courseId ?? courseId}`}
            className="mt-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            بدء التعلم
          </Link>
        </div>
      </div>
    )
  }

  const declined = order.paymentStatus === 'failed'

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="page-title">إتمام الشراء</h1>

      <section className="rounded-lg border p-4">
        <p className="font-semibold">{order.items[0]?.title ?? 'الدورة'}</p>
        <p className="mt-1 text-2xl font-bold">{formatMoney(order.amountMinor, order.currency)}</p>
      </section>

      {declined && (
        <div
          className="rounded-lg border border-red-300 p-4 text-red-600 dark:border-red-700 dark:text-red-400"
          role="alert"
        >
          <p className="font-semibold">تم رفض عملية الدفع</p>
          <p className="mt-1 text-sm">لم تتم عملية الدفع بنجاح. يمكنك إعادة المحاولة.</p>
        </div>
      )}

      {confirmError && (
        <div
          className="rounded-lg border border-red-300 p-4 text-red-600 dark:border-red-700 dark:text-red-400"
          role="alert"
        >
          تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => void pay('success')}
          disabled={isConfirming}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isConfirming ? 'جاري الدفع...' : declined ? 'إعادة المحاولة' : 'ادفع الآن'}
        </button>

        {/* Test-only trigger for the deterministic adapter's decline path
            (docs/api/sprint3-commerce.md) — there is no real card entry in
            this sprint's checkout, so this is how the retryable-failure
            state gets exercised. */}
        <button
          onClick={() => void pay('decline')}
          disabled={isConfirming}
          className="rounded-lg border px-6 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          محاكاة رفض الدفع (تجريبي)
        </button>
      </div>
    </div>
  )
}
