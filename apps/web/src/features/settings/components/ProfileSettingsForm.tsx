import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { showToast } from '../../../shared/components/Toast'
import { useAuth } from '../../auth/hooks/useAuth'
import { updateProfile } from '../api/settings.api'
import type { UserRole } from '../../auth/types/auth.types'

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'طالب',
  teacher: 'معلم',
  admin: 'أدمن',
  assistant: 'مساعد',
}

export function ProfileSettingsForm() {
  const { user, refreshUser } = useAuth()

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = fullName.trim()
    if (trimmedName.length < 2) {
      setError('الاسم لازم يكون حرفين على الأقل')
      return
    }

    setError(null)
    setIsSaving(true)
    try {
      await updateProfile({
        fullName: trimmedName,
        avatarUrl: avatarUrl.trim().length > 0 ? avatarUrl.trim() : null,
      })
      await refreshUser()
      showToast('تم حفظ الملف الشخصي بنجاح', 'success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError('البيانات المدخلة غير صحيحة — تأكد من رابط الصورة والاسم')
      } else {
        setError('حصل خطأ أثناء الحفظ، حاول تاني')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="card" noValidate>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {avatarUrl.trim().length > 0 ? (
          <img src={avatarUrl.trim()} alt="" className="avatar-preview" />
        ) : (
          <span className="avatar-preview-fallback">
            <span className="ms">person</span>
          </span>
        )}
        <div>
          <p style={{ fontWeight: 700, marginBottom: 2 }}>{user.fullName}</p>
          <span className="chip outline">{ROLE_LABEL[user.role]}</span>
        </div>
      </div>

      <div className="tf">
        <label htmlFor="settings-full-name">الاسم الكامل</label>
        <input
          id="settings-full-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          minLength={2}
          maxLength={150}
          required
        />
      </div>

      <div className="tf">
        <label htmlFor="settings-avatar-url">رابط الصورة الشخصية</label>
        <input
          id="settings-avatar-url"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
        />
        <span className="hint">اتركه فارغًا لاستخدام الصورة الافتراضية</span>
      </div>

      <div className="tf">
        <label>البريد الإلكتروني</label>
        <input value={user.email} disabled readOnly />
        <span className="hint">مش متاح تغيير البريد الإلكتروني حاليًا</span>
      </div>

      {error && (
        <span className="error-text" role="alert">
          {error}
        </span>
      )}

      <div className="actions">
        <button type="submit" disabled={isSaving} className="btn">
          <span className="ms">save</span>
          {isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </form>
  )
}
