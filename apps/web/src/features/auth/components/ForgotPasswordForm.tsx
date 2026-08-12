import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { requestPasswordReset, resetPassword } from '../api/auth.api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ResetStep {
  email: string
}

interface ForgotPasswordFormProps {
  onDone: () => void
}

// Forgot-password flow: email → reset code → new password. No session is
// created; the user signs back in normally afterwards.
export function ForgotPasswordForm({ onDone }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetStep, setResetStep] = useState<ResetStep | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('صيغة البريد الإلكتروني غير صحيحة')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await requestPasswordReset(trimmedEmail)
      setResetStep({ email: response.email })
    } catch (caughtError) {
      setError(resolveError(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedCode = code.trim()
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('الرمز لازم يكون ٦ أرقام')
      return
    }
    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة لازم تكون ٨ أحرف على الأقل')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }

    setIsSubmitting(true)
    try {
      if (!resetStep) throw new ApiError('Missing reset step', 0, null)
      await resetPassword({ email: resetStep.email, code: trimmedCode, newPassword })
      setIsDone(true)
    } catch (caughtError) {
      setError(resolveError(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return (
      <>
        <p className="subtitle" style={{ marginBottom: '1rem' }}>
          تم تغيير كلمة المرور بنجاح — سجّل الدخول بالكلمة الجديدة.
        </p>
        <button type="button" className="btn big" onClick={onDone} style={{ width: '100%' }}>
          العودة لتسجيل الدخول
        </button>
      </>
    )
  }

  if (resetStep) {
    return (
      <form onSubmit={(event) => void handleReset(event)} noValidate>
        <div className="tf">
          <label htmlFor="reset-code">رمز التحقق</label>
          <input
            type="text"
            inputMode="numeric"
            id="reset-code"
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div className="tf">
          <label htmlFor="reset-password">كلمة المرور الجديدة</label>
          <input
            type="password"
            id="reset-password"
            placeholder="********"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>

        <div className="tf">
          <label htmlFor="reset-confirm">تأكيد كلمة المرور</label>
          <input
            type="password"
            id="reset-confirm"
            placeholder="********"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {error && (
            <span className="error-text" role="alert">
              {error}
            </span>
          )}
        </div>

        <button className="btn big" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
          {isSubmitting ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={(event) => void handleRequestCode(event)} noValidate>
      <p className="subtitle" style={{ marginBottom: '1rem' }}>
        أدخل بريدك الإلكتروني وسنرسل لك رمزًا لإعادة تعيين كلمة المرور.
      </p>

      <div className="tf">
        <label htmlFor="reset-email">البريد الإلكتروني</label>
        <input
          type="email"
          id="reset-email"
          placeholder="name@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && (
          <span className="error-text" role="alert">
            {error}
          </span>
        )}
      </div>

      <button className="btn big" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
        {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الرمز'}
      </button>
    </form>
  )
}

function resolveError(error: unknown): string {
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
