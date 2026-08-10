import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { revokeOtherSessions } from '../../auth/api/auth.api'
import { changePassword } from '../api/settings.api'

export function SecuritySettingsForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة لازم تكون ٨ أحرف على الأقل')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور الجديدتان مش متطابقتين')
      return
    }

    setError(null)
    setIsSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('تم تغيير كلمة المرور بنجاح', 'success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('كلمة المرور الحالية غير صحيحة')
      } else {
        setError('حصل خطأ أثناء تغيير كلمة المرور، حاول تاني')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmSignOutEverywhere() {
    setIsSigningOut(true)
    try {
      await revokeOtherSessions()
      setIsSignOutModalOpen(false)
      showToast('تم تسجيل الخروج من كل الأجهزة الأخرى', 'success')
    } catch {
      showToast('حصل خطأ، حاول تاني', 'error')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <>
      <form onSubmit={(event) => void handleSubmit(event)} className="card" noValidate>
        <h3 style={{ marginBottom: 0 }}>تغيير كلمة المرور</h3>

        <div className="tf">
          <label htmlFor="settings-current-password">كلمة المرور الحالية</label>
          <input
            id="settings-current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </div>

        <div className="tf">
          <label htmlFor="settings-new-password">كلمة المرور الجديدة</label>
          <input
            id="settings-new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </div>

        <div className="tf">
          <label htmlFor="settings-confirm-password">تأكيد كلمة المرور الجديدة</label>
          <input
            id="settings-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        {error && (
          <span className="error-text" role="alert">
            {error}
          </span>
        )}

        <div className="actions">
          <button type="submit" disabled={isSaving} className="btn">
            <span className="ms">lock_reset</span>
            {isSaving ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </form>

      <div className="card">
        <h3 style={{ marginBottom: 0 }}>الأجهزة المسجّل بها الدخول</h3>
        <p className="meta">
          لو سجّلت دخولك من جهاز مش معاك دلوقتي، تقدر تسجّل الخروج من كل الأجهزة الأخرى فورًا.
        </p>
        <div className="actions">
          <button type="button" className="btn outlined" onClick={() => setIsSignOutModalOpen(true)}>
            <span className="ms">devices_off</span>
            تسجيل الخروج من كل الأجهزة الأخرى
          </button>
        </div>
      </div>

      <ConfirmModal
        open={isSignOutModalOpen}
        title="تسجيل الخروج من كل الأجهزة الأخرى"
        message="هيتم تسجيل الخروج فورًا من أي جهاز تاني مسجّل بحسابك، ما عدا الجهاز اللي بتستخدمه دلوقتي."
        confirmLabel="تسجيل الخروج من الباقي"
        isLoading={isSigningOut}
        onConfirm={() => void handleConfirmSignOutEverywhere()}
        onCancel={() => setIsSignOutModalOpen(false)}
      />
    </>
  )
}
