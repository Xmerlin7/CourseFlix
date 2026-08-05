import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const user = await login({ email, password })
      navigate(getRoleHomePath(user.role), { replace: true })
    } catch (caughtError) {
      // Same generic message regardless of the underlying reason — never
      // reveal whether the email exists or the password was wrong.
      setError(
        caughtError instanceof ApiError && caughtError.status === 401
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'حدث خطأ ما، حاول مرة أخرى',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="tf">
        <label htmlFor="email">البريد الإلكتروني</label>
        <input
          type="email"
          id="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="tf">
        <label htmlFor="password">كلمة المرور</label>
        <input
          type="password"
          id="password"
          placeholder="********"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <span className="error-text" role="alert">
            {error}
          </span>
        )}
      </div>

      <button className="btn big" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
        <span className="ms">login</span>
        {isSubmitting ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  )
}
