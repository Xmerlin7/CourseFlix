import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { createTeacherAccount } from '../api/admin-users.api'

// The platform supports exactly one teacher account — the API rejects a
// second one with 409, surfaced below instead of a generic error.
export function AdminCreateTeacherPage() {
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
      const teacher = await createTeacherAccount({ fullName, email, password })
      navigate(`/admin/users/${teacher.id}`, { replace: true })
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 409) {
        setError('في معلم مسجل بالفعل — المنصة بتدعم معلم واحد بس')
      } else if (caughtError instanceof ApiError && caughtError.status === 400) {
        setError('البريد الإلكتروني مستخدم بالفعل أو البيانات غير صحيحة')
      } else {
        setError('تعذر إنشاء حساب المعلم، حاول مرة أخرى')
      }
      setIsSaving(false)
    }
  }

  return (
    <>
      <h1 className="page-title">حساب المعلم</h1>
      <p className="subtitle">
        المنصة بتدعم معلم واحد بس — الحساب ده هيكون عنده صلاحيات كاملة على الدورات، الطلاب، والمبيعات
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="card" style={{ maxWidth: 640, marginInline: 'auto' }}>
        <div className="tf">
          <label htmlFor="new-teacher-name">الاسم الكامل</label>
          <input
            id="new-teacher-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            minLength={3}
            maxLength={150}
            required
            autoFocus
          />
        </div>

        <div className="tf">
          <label htmlFor="new-teacher-email">البريد الإلكتروني</label>
          <input
            id="new-teacher-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="tf">
          <label htmlFor="new-teacher-password">كلمة المرور</label>
          <input
            id="new-teacher-password"
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
