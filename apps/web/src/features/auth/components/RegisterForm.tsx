import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'

export function RegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const user = await register({ fullName, email, password })
      navigate(getRoleHomePath(user.role), { replace: true })
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 409) {
        setError('البريد الإلكتروني مستخدم بالفعل')
      } else if (caughtError instanceof ApiError && caughtError.status === 400) {
        setError('البيانات غير صحيحة، راجع الحقول من فضلك')
      } else {
        setError('حدث خطأ ما، حاول مرة أخرى')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="tf">
        <label htmlFor="fullName">الاسم الكامل</label>
        <input
          type="text"
          id="fullName"
          placeholder="أحمد محمد"
          autoComplete="name"
          required
          minLength={3}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>

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
          autoComplete="new-password"
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
        <span className="ms">person_add</span>
        {isSubmitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب'}
      </button>
    </form>
  )
}
