import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { createAssistantAccount } from '../api/admin-users.api'

// No teacher picker — the platform has exactly one teacher, so the API
// links the new assistant to it automatically.
export function AdminCreateAssistantPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const assistant = await createAssistantAccount({ fullName, email, password })
      navigate(`/admin/users/${assistant.id}`, { replace: true })
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError && caughtError.status === 400
          ? 'تعذر الإنشاء — تأكد إن حساب المعلم موجود، والبريد الإلكتروني مش مستخدم من قبل'
          : 'تعذر إنشاء حساب المساعد، حاول مرة أخرى',
      )
      setIsSaving(false)
    }
  }

  return (
    <>
      <h1 className="page-title">مساعد جديد</h1>
      <p className="subtitle">
        هيقدر يدير الدورات والطلاب زي المعلم بالظبط، لكن من غير أي وصول للمبيعات أو الدفع
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="card" style={{ maxWidth: 640, marginInline: 'auto' }}>
        <div className="tf">
          <label htmlFor="new-assistant-name">الاسم الكامل</label>
          <input
            id="new-assistant-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            minLength={3}
            maxLength={150}
            required
            autoFocus
          />
        </div>

        <div className="tf">
          <label htmlFor="new-assistant-email">البريد الإلكتروني</label>
          <input
            id="new-assistant-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="tf">
          <label htmlFor="new-assistant-password">كلمة المرور</label>
          <input
            id="new-assistant-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
            {error}
          </p>
        )}

        <div className="actions">
          <button type="submit" disabled={isSaving} className="btn">
            <span className="ms">person_add</span>
            {isSaving ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
          </button>
          <button type="button" className="btn text" onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}>
            إلغاء
          </button>
        </div>
      </form>
    </>
  )
}
