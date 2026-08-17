import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { AuthField, AuthPasswordField } from './AuthField'
import { AuthAlert, AuthSubmit } from './AuthUi'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  email?: string
  password?: string
}

// Client-side mirror of LoginDto's shape (IsEmail + MinLength(8)) so
// "required"/format problems are caught before a round trip — never the
// actual authority, the API still validates independently.
//
// Split per field (rather than the single combined string this used to
// return) so each message can be rendered against the input it belongs to
// and announced through that input's aria-describedby.
function resolveClientErrors(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    errors.email = 'البريد الإلكتروني مطلوب'
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
  }

  if (!password) {
    errors.password = 'كلمة المرور مطلوبة'
  } else if (password.length < 8) {
    errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
  }

  return errors
}

// Never distinguish "email not found" from "wrong password" — that would
// let an attacker enumerate registered emails. 401 always stays this one
// combined message; everything else can be as specific as it wants.
function resolveApiError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت وحاول مرة أخرى'
  }
  if (error.status === 401) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
  }
  if (error.status === 400) {
    return 'تأكد من صحة البريد الإلكتروني وكلمة المرور وحاول مرة أخرى'
  }
  if (error.status === 429) {
    return 'محاولات كثيرة جدًا، حاول مرة أخرى بعد قليل'
  }
  if (error.status === 0 || error.status >= 500) {
    return 'تعذر الوصول إلى الخادم الآن، حاول مرة أخرى لاحقًا'
  }
  return 'حدث خطأ ما، حاول مرة أخرى'
}

interface LoginFormProps {
  /** Switches the page to the forgot-password flow. */
  onForgotPassword?: () => void
}

// Standard login: email + password, straight to a session. The password is
// verified server-side; a session cookie is set on success.
export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const clientErrors = resolveClientErrors(email, password)
    setFieldErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const user = await login({ email, password })
      navigate(getRoleHomePath(user.role), { replace: true })
    } catch (caughtError) {
      setFormError(resolveApiError(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      {formError && <AuthAlert>{formError}</AuthAlert>}

      <div className="cfa-fields">
        <AuthField
          id="email"
          label="البريد الإلكتروني"
          icon="mail"
          type="email"
          inputMode="email"
          placeholder="name@example.com"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />

        <AuthPasswordField
          id="password"
          label="كلمة المرور"
          placeholder="أدخل كلمة المرور"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />
      </div>

      {onForgotPassword && (
        <div className="cfa-row">
          <span />
          <button type="button" className="cfa-link-btn" onClick={onForgotPassword}>
            نسيت كلمة المرور؟
          </button>
        </div>
      )}

      <AuthSubmit icon="login" isPending={isSubmitting} pendingLabel="جارٍ الدخول...">
        تسجيل الدخول
      </AuthSubmit>
    </form>
  )
}
