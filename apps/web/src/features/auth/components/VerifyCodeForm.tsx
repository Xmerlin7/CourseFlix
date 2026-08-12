import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'
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
}

// Shared code-entry step for the register-verification and passwordless-login
// flows: type the 6-digit code from the email, optionally resend it, and the
// parent is handed the freshly-authenticated user on success.
export function VerifyCodeForm({
  email,
  purpose,
  onResend,
  onVerified,
  onResendResult,
}: VerifyCodeFormProps) {
  const { verifyOtp } = useAuth()
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      onResendResult?.(response)
    } catch (caughtError) {
      setError(resolveVerifyError(caughtError))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="tf">
        <label htmlFor="otpCode">رمز التحقق</label>
        <input
          type="text"
          inputMode="numeric"
          id="otpCode"
          placeholder="000000"
          autoComplete="one-time-code"
          autoFocus
          required
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
        />
        {error && (
          <span className="error-text" role="alert">
            {error}
          </span>
        )}
      </div>

      <button className="btn big" type="submit" disabled={isVerifying} style={{ width: '100%' }}>
        {isVerifying ? 'جارٍ التحقق...' : 'تأكيد الرمز'}
      </button>

      <button
        type="button"
        className="btn text btn-compact"
        disabled={isResending}
        onClick={() => void handleResend()}
        style={{ marginTop: '0.5rem' }}
      >
        {isResending ? 'جارٍ الإرسال...' : 'لم يصلك الرمز؟ أعد الإرسال'}
      </button>
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
