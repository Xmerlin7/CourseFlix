import { useEffect, useRef } from 'react'

export interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  isLoading?: boolean
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Accessible confirmation dialog built on the native `<dialog>` element.
 *
 * - Traps focus automatically (browser-native behaviour).
 * - Closes on Escape (browser-native behaviour).
 * - Backdrop uses the project's `--scrim` token.
 * - Card styling reuses the existing `.card` border-radius / spacing.
 * - The confirm button supports a `danger` variant for destructive actions.
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'إلغاء',
  isLoading = false,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Native <dialog> fires `cancel` on Escape — route it to onCancel.
  function handleCancel(event: React.SyntheticEvent) {
    event.preventDefault()
    if (!isLoading) onCancel()
  }

  // Close when clicking the backdrop (the <dialog> itself, not its children).
  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current && !isLoading) {
      onCancel()
    }
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="confirm-modal-dialog"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-icon">
          <span className="ms">{variant === 'danger' ? 'warning' : 'help'}</span>
        </div>

        <h2 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h2>

        <p id="confirm-modal-message" className="confirm-modal-message">
          {message}
        </p>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`btn ${variant === 'danger' ? 'danger' : ''}`}
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="confirm-modal-confirm"
          >
            {isLoading && <span className="ms spin">progress_activity</span>}
            {isLoading ? 'جارٍ التنفيذ...' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
