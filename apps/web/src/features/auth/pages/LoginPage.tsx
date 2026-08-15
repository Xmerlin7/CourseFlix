import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'
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

  if (oauthOtpEmail) {
    return (
      <>
        <p className="subtitle" style={{ marginBottom: '1rem' }}>
          تم التحقق من حسابك عبر Google — راسلنا رمزًا إلى{' '}
          <strong>{oauthOtpEmail}</strong> لاستكمال تسجيل الدخول.
        </p>
        <VerifyCodeForm
          email={oauthOtpEmail}
          purpose="google_oauth"
          devCode={oauthOtpDevCode}
          onResend={(email) => requestOtp({ email, purpose: 'google_oauth' })}
          onVerified={(verifiedUser) =>
            navigate(getRoleHomePath(verifiedUser.role), { replace: true })
          }
        />
        <button
          type="button"
          className="btn text btn-compact"
          onClick={() => navigate('/login', { replace: true })}
          style={{ marginTop: '0.75rem' }}
        >
          استخدام طريقة أخرى
        </button>
      </>
    )
  }

  return (
    <>
      {oauth === 'success' && !user && (
        <p className="oauth-note" role="status">
          جارٍ إتمام تسجيل الدخول عبر جوجل...
        </p>
      )}
      {oauth === 'error' && (
        <p className="error-text" role="alert">
          تعذّر تسجيل الدخول عبر جوجل، حاول مرة أخرى.
        </p>
      )}

      {mode === 'password' && <LoginForm />}
      {mode === 'reset' && <ForgotPasswordForm onDone={() => setMode('password')} />}

      {mode !== 'reset' && (
        <button
          type="button"
          className="btn text btn-compact"
          onClick={() => setMode('reset')}
          style={{ marginTop: '0.75rem' }}
        >
          نسيت كلمة المرور؟
        </button>
      )}

      <SocialLoginButtons />

      <p className="auth-switch">
        مستخدم جديد؟ <Link to="/register">إنشاء حساب</Link>
      </p>
    </>
  )
}