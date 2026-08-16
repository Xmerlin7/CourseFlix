import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { AuthSubmit } from './AuthUi'
import { useAuth } from '../hooks/useAuth'
import type { AuthUser, OtpPurpose, OtpResponse } from '../types/auth.types'

const CODE_PATTERN = /^\d{6}$/

interface VerifyCodeFormProps {
  email: string
  purpose: OtpPurpose
  onResend: (email: string) => Promise<OtpResponse>
  onVerified: (user: AuthUser) => void
  // Called after a successful resend so the parent can react to whether a
  // code was actually issued (e.g. register-resume: accountStatus 'active'
  // means the account is already verified, not pending verification).
  onResendResult?: (response: OtpResponse) => void
  // Only ever set when the API isn't configured to actually send email
  // (local/dev) — the backend echoes the code back in the response instead
  // of mailing it. Never present in production.
  devCode?: string
}

// Shared code-entry step for the register-verification and Google sign-in
// flows: type the 6-digit code from the email, optionally resend it, and the
// parent is handed the freshly-authenticated user on success.
export function VerifyCodeForm({
  email,
  purpose,
  onResend,
  onVerified,
  onResendResult,
  devCode,
}: VerifyCodeFormProps) {
  const { verifyOtp } = useAuth()
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDevCode, setCurrentDevCode] = useState(devCode)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedCode = code.trim()
    if (!CODE_PATTERN.test(trimmedCode)) {
      setError('الرمز لازم يكون ٦ أرقام')
      return
    }

    setIsVerifying(true)
    try {
      const user = await verifyOtp({ email, code: trimmedCode, purpose })
      onVerified(user)
    } catch (caughtError) {
      setError(resolveVerifyError(caughtError))
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResend() {
    setError(null)
    setIsResending(true)
    try {
      const response = await onResend(email)
      setCurrentDevCode(response.devCode)
      onResendResult?.(response)
    } catch (caughtError) {
      setError(resolveVerifyError(caughtError))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      {currentDevCode && (
        <p className="cfa-devcode" role="note">
          <span className="ms" aria-hidden="true">
            code
          </span>
          وضع التطوير: إرسال الإيميل مش متظبط، الكود هو
          <button type="button" onClick={() => setCode(currentDevCode)}>
            {currentDevCode}
          </button>
        </p>
      )}

      <div className={`cfa-field${error ? ' invalid' : ''}`}>
        <label className="cfa-label" htmlFor="otpCode">
          رمز التحقق
        </label>
        <input
          type="text"
          inputMode="numeric"
          id="otpCode"
          className="cfa-otp"
          placeholder="––––––"
          autoComplete="one-time-code"
          autoFocus
          required
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'otp-error' : undefined}
        />
        {error && (
          <span className="cfa-error" id="otp-error" role="alert">
            <span className="ms" aria-hidden="true">
              error
            </span>
            {error}
          </span>
        )}
      </div>

      <AuthSubmit icon="verified" isPending={isVerifying} pendingLabel="جارٍ التحقق...">
        تأكيد الرمز
      </AuthSubmit>

      <div className="cfa-row">
        <span className="cfa-hint">لم يصلك الرمز؟</span>
        <button
          type="button"
          className="cfa-link-btn"
          disabled={isResending}
          onClick={() => void handleResend()}
        >
          <span className="ms" aria-hidden="true">
            refresh
          </span>
          {isResending ? 'جارٍ الإرسال...' : 'إعادة الإرسال'}
        </button>
      </div>
    </form>
  )
}

function resolveVerifyError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'تعذر الاتصال بالخادم، حاول مرة أخرى'
  }
  if (error.status === 401) {
    return 'الرمز غير صحيح أو منتهي — اطلب رمزًا جديدًا'
  }
  if (error.status === 429) {
    return 'محاولات كثيرة جدًا، حاول مرة أخرى بعد قليل'
  }
  if (error.status === 0 || error.status >= 500) {
    return 'تعذر الوصول إلى الخادم الآن، حاول مرة أخرى لاحقًا'
  }
  return 'حدث خطأ ما، حاول مرة أخرى'
}
