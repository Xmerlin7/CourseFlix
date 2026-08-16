import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'
import { AuthAlert } from '../components/AuthUi'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { LoginForm } from '../components/LoginForm'
import { SocialLoginButtons } from '../components/SocialLoginButtons'
import { VerifyCodeForm } from '../components/VerifyCodeForm'
import { requestOtp } from '../api/auth.api'

type LoginMode = 'password' | 'reset'

export function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const oauth = searchParams.get('oauth')
  const [mode, setMode] = useState<LoginMode>('password')

  // The Google callback now pauses at a one-time code (no session yet): it
  // redirects here with `oauth=otp&email=<account>` while the code is
  // mailed. Show the shared code step; redeeming it signs the user in. In
  // dev mode the callback also carries `devCode` so the code shows inline
  // (mail isn't configured locally) — production never includes it.
  const oauthOtpEmail = useMemo(
    () => (oauth === 'otp' ? (searchParams.get('email') ?? '') : ''),
    [oauth, searchParams],
  )
  const oauthOtpDevCode = useMemo(
    () => (oauth === 'otp' ? (searchParams.get('devCode') ?? undefined) : undefined),
    [oauth, searchParams],
  )

  // Returned from the Google OAuth callback: a session cookie is already
  // set — once AuthContext bootstraps the user, head to their home.
  useEffect(() => {
    if (oauth === 'success' && user) {
      navigate(getRoleHomePath(user.role), { replace: true })
    }
  }, [oauth, user, navigate])

  // ---- Google sign-in, paused at the one-time code -----------------------
  if (oauthOtpEmail) {
    return (
      <div className="cfa-enter">
        <header className="cfa-head">
          <h1 className="cfa-title">خطوة أخيرة</h1>
          <p className="cfa-subtitle">
            تم التحقق من حسابك عبر Google — راسلنا رمزًا إلى{' '}
            <strong>{oauthOtpEmail}</strong> لاستكمال تسجيل الدخول.
          </p>
        </header>

        <VerifyCodeForm
          email={oauthOtpEmail}
          purpose="google_oauth"
          devCode={oauthOtpDevCode}
          onResend={(email) => requestOtp({ email, purpose: 'google_oauth' })}
          onVerified={(verifiedUser) =>
            navigate(getRoleHomePath(verifiedUser.role), { replace: true })
          }
        />

        <div className="cfa-row">
          <span />
          <button
            type="button"
            className="cfa-link-btn"
            onClick={() => navigate('/login', { replace: true })}
          >
            <span className="ms" aria-hidden="true">
              arrow_forward
            </span>
            استخدام طريقة أخرى
          </button>
        </div>
      </div>
    )
  }

  // ---- Forgot password --------------------------------------------------
  if (mode === 'reset') {
    return (
      <div className="cfa-enter">
        <header className="cfa-head">
          <h1 className="cfa-title">نسيت كلمة المرور؟</h1>
          <p className="cfa-subtitle">
            اكتب بريدك الإلكتروني وهنبعتلك رمزًا تقدر تعيّن بيه كلمة مرور جديدة.
          </p>
        </header>

        <ForgotPasswordForm onDone={() => setMode('password')} />
      </div>
    )
  }

  // ---- Password sign-in -------------------------------------------------
  return (
    <div className="cfa-enter">
      <header className="cfa-head">
        <h1 className="cfa-title">أهلًا بيك تاني</h1>
        <p className="cfa-subtitle">سجّل دخولك وكمّل من حيث ما وقفت.</p>
      </header>

      {oauth === 'success' && !user && (
        <AuthAlert tone="info">جارٍ إتمام تسجيل الدخول عبر جوجل...</AuthAlert>
      )}
      {oauth === 'error' && <AuthAlert>تعذّر تسجيل الدخول عبر جوجل، حاول مرة أخرى.</AuthAlert>}

      <LoginForm onForgotPassword={() => setMode('reset')} />

      <SocialLoginButtons />

      <p className="cfa-switch">
        مستخدم جديد؟<Link to="/register">إنشاء حساب</Link>
      </p>
    </div>
  )
}
