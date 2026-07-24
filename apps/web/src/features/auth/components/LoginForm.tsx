import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'

export function LoginForm() {
  const { login, isLoading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const user = await login({ email, password })
      navigate(getRoleHomePath(user.role), { replace: true })
    } catch {
      // Error message is already surfaced via `error` below.
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
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
        {error ? (
          <span className="error-text" role="alert">
            {error}
          </span>
        ) : (
          <span className="hint">يتم توجيهك تلقائيًا حسب نوع الحساب (طالب أو معلم)</span>
        )}
      </div>

      <button className="btn big" type="submit" disabled={isLoading} style={{ width: '100%' }}>
        <span className="ms">login</span>
        {isLoading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  )
}