import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { AuthField, AuthPasswordField } from './AuthField'
import { AuthAlert, AuthSubmit } from './AuthUi'
import { requestPasswordReset, resetPassword } from '../api/auth.api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ResetStep {
  email: string
  devCode?: string
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
      setResetStep({ email: response.email, devCode: response.devCode })
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
        <AuthAlert tone="success">
          تم تغيير كلمة المرور بنجاح — سجّل الدخول بالكلمة الجديدة.
        </AuthAlert>
        <button type="button" className="cfa-btn" onClick={onDone}>
          <span className="ms" aria-hidden="true">
            login
          </span>
          العودة لتسجيل الدخول
        </button>
      </>
    )
  }

  if (resetStep) {
    return (
      <form onSubmit={(event) => void handleReset(event)} noValidate>
        {resetStep.devCode && (
          <p className="cfa-devcode" role="note">
            <span className="ms" aria-hidden="true">
              code
            </span>
            وضع التطوير: إرسال الإيميل مش متظبط، الكود هو
            <button type="button" onClick={() => setCode(resetStep.devCode ?? '')}>
              {resetStep.devCode}
            </button>
          </p>
        )}

        <p className="cfa-sent-to">
          <span className="ms" aria-hidden="true">
            mark_email_unread
          </span>
          <span>
            راسلنا رمز إعادة التعيين إلى <strong>{resetStep.email}</strong>
          </span>
        </p>

        {error && <AuthAlert>{error}</AuthAlert>}

        <div className="cfa-fields">
          <div className="cfa-field">
            <label className="cfa-label" htmlFor="reset-code">
              رمز التحقق
            </label>
            <input
              type="text"
              inputMode="numeric"
              id="reset-code"
              className="cfa-otp"
              placeholder="––––––"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            />
          </div>

          <AuthPasswordField
            id="reset-password"
            label="كلمة المرور الجديدة"
            placeholder="٨ أحرف على الأقل"
            autoComplete="new-password"
            required
            showStrength
            value={newPassword}
            onChange={setNewPassword}
          />

          <AuthPasswordField
            id="reset-confirm"
            label="تأكيد كلمة المرور"
            placeholder="٨ أحرف على الأقل"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>

        <AuthSubmit icon="lock_reset" isPending={isSubmitting} pendingLabel="جارٍ الحفظ...">
          تغيير كلمة المرور
        </AuthSubmit>
      </form>
    )
  }

  return (
    <form onSubmit={(event) => void handleRequestCode(event)} noValidate>
      {error && <AuthAlert>{error}</AuthAlert>}

      <div className="cfa-fields">
        <AuthField
          id="reset-email"
          label="البريد الإلكتروني"
          icon="mail"
          type="email"
          inputMode="email"
          placeholder="name@example.com"
          autoComplete="email"
          dir="ltr"
          autoFocus
          required
          value={email}
          onChange={setEmail}
          hint="هنبعتلك رمزًا من ٦ أرقام على البريد ده."
        />
      </div>

      <AuthSubmit icon="send" isPending={isSubmitting} pendingLabel="جارٍ الإرسال...">
        إرسال الرمز
      </AuthSubmit>

      <div className="cfa-row">
        <span />
        <button type="button" className="cfa-link-btn" onClick={onDone}>
          <span className="ms" aria-hidden="true">
            arrow_forward
          </span>
          رجوع لتسجيل الدخول
        </button>
      </div>
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
