import { useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { showToast } from '../../../shared/components/Toast'
import { useAuth } from '../../auth/hooks/useAuth'
import { updateProfile } from '../api/profile.api'

export function TeacherWhatsappContactForm() {
  const { user, updateUser } = useAuth()
  const currentUser = user!
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser.whatsappNumber ?? '')
  const [savedWhatsappNumber, setSavedWhatsappNumber] = useState(currentUser.whatsappNumber ?? '')
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)

  const normalizedWhatsappInput = whatsappNumber.trim()
  const whatsappDigits = normalizedWhatsappInput.replace(/\D/g, '')
  const isWhatsappDirty = normalizedWhatsappInput !== savedWhatsappNumber
  const isWhatsappValid =
    normalizedWhatsappInput.length === 0 ||
    (/^[+\d\s().-]+$/.test(normalizedWhatsappInput) &&
      whatsappDigits.length >= 8 &&
      whatsappDigits.length <= 15)

  async function handleSaveWhatsapp(event: React.FormEvent) {
    event.preventDefault()
    if (!isWhatsappDirty || !isWhatsappValid) return

    setIsSavingWhatsapp(true)
    setWhatsappError(null)
    try {
      const updated = await updateProfile({
        whatsappNumber: normalizedWhatsappInput.length > 0 ? normalizedWhatsappInput : null,
      })
      updateUser(updated)
      setWhatsappNumber(updated.whatsappNumber ?? '')
      setSavedWhatsappNumber(updated.whatsappNumber ?? '')
      showToast(
        updated.whatsappNumber ? 'اتحفظ رقم واتساب بنجاح' : 'تم إخفاء زر واتساب من الطلاب',
        'success',
      )
    } catch (err) {
      setWhatsappError('تعذر حفظ رقم واتساب، تأكد من الرقم وحاول مرة أخرى')
      showToast(err instanceof ApiError ? 'حصل خطأ أثناء الحفظ' : 'حصل خطأ غير متوقع', 'error')
    } finally {
      setIsSavingWhatsapp(false)
    }
  }

  return (
    <form className="card profile-form-card" onSubmit={(event) => void handleSaveWhatsapp(event)}>
      <div className="profile-card-head">
        <h3 className="profile-card-title">زر واتساب للطلاب</h3>
        <p className="profile-card-sub">
          يظهر زر عائم للطلاب فقط عند إضافة رقم واتساب صالح.
        </p>
      </div>

      <div className={`tf${whatsappError ? ' invalid' : ''}`}>
        <label htmlFor="profile-whatsapp-number">رقم واتساب</label>
        <input
          id="profile-whatsapp-number"
          type="tel"
          dir="ltr"
          inputMode="tel"
          value={whatsappNumber}
          onChange={(event) => {
            setWhatsappNumber(event.target.value)
            setWhatsappError(null)
          }}
          placeholder="201012345678"
          disabled={isSavingWhatsapp}
          aria-describedby="profile-whatsapp-hint"
        />
        <span id="profile-whatsapp-hint" className="hint">
          اتركه فارغًا لإخفاء زر واتساب. يفضل كتابة الرقم بصيغة دولية.
        </span>
        {!isWhatsappValid && (
          <span className="error-text">اكتب رقم واتساب صحيح أو اترك الحقل فارغًا.</span>
        )}
        {whatsappError && <span className="error-text">{whatsappError}</span>}
      </div>

      {isWhatsappDirty && (
        <div className="profile-form-actions">
          <button
            type="button"
            className="btn text"
            onClick={() => {
              setWhatsappNumber(savedWhatsappNumber)
              setWhatsappError(null)
            }}
            disabled={isSavingWhatsapp}
          >
            تراجع
          </button>
          <button type="submit" className="btn" disabled={isSavingWhatsapp || !isWhatsappValid}>
            {isSavingWhatsapp && <span className="ms spin">progress_activity</span>}
            {isSavingWhatsapp ? 'جارٍ الحفظ...' : 'حفظ رقم واتساب'}
          </button>
        </div>
      )}
    </form>
  )
}
