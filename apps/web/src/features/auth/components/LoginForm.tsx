import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { useAuth } from '../hooks/useAuth'

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
      navigate(
        user.role === 'teacher' ? ROUTE_PATHS.TEACHER.DASHBOARD : ROUTE_PATHS.STUDENT.DASHBOARD,
        { replace: true },
      )
    } catch {
      // Generic on purpose — never reveal whether the email exists.
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex w-full max-w-sm flex-col gap-4"
      dir="rtl"
    >
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">تسجيل الدخول</h1>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600 dark:text-gray-400">البريد الإلكتروني</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600 dark:text-gray-400">كلمة المرور</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          autoComplete="current-password"
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'جارٍ الدخول...' : 'دخول'}
      </button>
    </form>
  )
}
