import { useEffect, useRef, useState } from 'react'
import { showToast } from '../../../shared/components/Toast'
import { topUpTeacherQuota } from '../api/teacher-billing.api'
import type { TeacherQuota } from '../types/teacher-billing.types'

interface TopUpQuotaModalProps {
  open: boolean
  teacherId: string
  teacherName: string
  quota: TeacherQuota | null
  onSuccess: () => void
  onClose: () => void
}

/**
 * Admin-only modal for charging a teacher's AI-credit balance. Same
 * native-<dialog> pattern as ConfirmModal, plus a number input for the
 * amount. Top-ups are additive — they never touch the monthly cycle.
 */
export function TopUpQuotaModal({
  open,
  teacherId,
  teacherName,
  quota,
  onSuccess,
  onClose,
}: TopUpQuotaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [credits, setCredits] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleCancel(event: React.SyntheticEvent) {
    event.preventDefault()
    if (!isSaving) onClose()
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current && !isSaving) {
      onClose()
    }
  }

  const numericCredits = Number(credits)
  const isValid = Number.isInteger(numericCredits) && numericCredits > 0

  async function handleConfirm() {
    if (!isValid) return
    setIsSaving(true)
    setError(null)
    try {
      await topUpTeacherQuota(teacherId, { credits: numericCredits })
      showToast('تم شحن الحصة بنجاح', 'success')
      setCredits('')
      onSuccess()
      onClose()
    } catch {
      setError('حدث خطأ أثناء الشحن، حاول مرة أخرى')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="confirm-modal-dialog"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby="top-up-quota-title"
    >
      <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-icon">
          <span className="ms">bolt</span>
        </div>

        <h2 id="top-up-quota-title" className="confirm-modal-title">
          شحن حصة {teacherName}
        </h2>

        <p className="confirm-modal-message">
          {quota
            ? `الرصيد الحالي: متبقي ${quota.remainingCredits} من ${quota.totalCredits}. المبلغ يُضاف فوق الرصيد الحالي فوراً.`
            : 'لا توجد حصة لهذا المعلم بعد — الشحن هيُنشئها تلقائياً.'}
        </p>

        <div className="tf" style={{ marginBottom: 0 }}>
          <label htmlFor="top-up-credits">عدد الوحدات *</label>
          <input
            id="top-up-credits"
            type="number"
            inputMode="numeric"
            min={1}
            value={credits}
            onChange={(event) => {
              setCredits(event.target.value)
              setError(null)
            }}
            placeholder="مثال: 50"
            disabled={isSaving}
            required
          />
          {error && <span className="error-text">{error}</span>}
        </div>

        <div className="confirm-modal-actions">
          <button type="button" className="btn outlined" onClick={onClose} disabled={isSaving}>
            إلغاء
          </button>
          <button type="button" className="btn" onClick={() => void handleConfirm()} disabled={isSaving || !isValid}>
            {isSaving && <span className="ms spin">progress_activity</span>}
            {isSaving ? 'جارٍ الشحن...' : 'شحن الحصة'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
