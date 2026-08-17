import '../../../shared/components/Skeleton.css'

/**
 * Suspense fallback for /login, rendered inside AuthLayout's form column.
 * Mirrors LoginPage's real block order — heading, two fields, submit,
 * divider, two social buttons — so the swap to the loaded page does not
 * shift anything vertically.
 */
export function LoginSkeleton() {
  return (
    <div
      className="skeleton-pulse"
      role="status"
      aria-label="جاري تحميل المحتوى"
      data-testid="login-skeleton"
    >
      <div className="cfa-head">
        <div className="skeleton" style={{ height: 30, width: 190, borderRadius: 8, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 15, width: 250, borderRadius: 6 }} />
      </div>

      <div className="cfa-fields">
        {[0, 1].map((index) => (
          <div className="cfa-field" key={index}>
            <div className="skeleton" style={{ height: 13, width: 110, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 14 }} />
          </div>
        ))}
      </div>

      <div className="skeleton" style={{ height: 50, width: '100%', borderRadius: 14, marginTop: 22 }} />

      <div className="skeleton" style={{ height: 14, width: 130, borderRadius: 6, margin: '24px auto 18px' }} />

      <div className="cfa-social">
        <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
      </div>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
