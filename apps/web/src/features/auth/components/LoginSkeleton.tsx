import '../../../shared/components/Skeleton.css'

/** Mirrors LoginForm's two fields + submit button, and the "إنشاء حساب" switch line below it. */
export function LoginSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="login-skeleton">
      <div className="tf">
        <div className="skeleton" style={{ height: 13, width: 120, borderRadius: 6, marginBottom: 7 }} />
        <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
      </div>

      <div className="tf">
        <div className="skeleton" style={{ height: 13, width: 90, borderRadius: 6, marginBottom: 7 }} />
        <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
      </div>

      <div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 999 }} />

      <div className="auth-switch">
        <div className="skeleton" style={{ height: 14, width: 200, borderRadius: 6, margin: '0 auto' }} />
      </div>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
