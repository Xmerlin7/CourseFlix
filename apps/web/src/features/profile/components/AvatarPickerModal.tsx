import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getAvatarPresets } from '../lib/avatar-presets'

export interface AvatarPickerModalProps {
  open: boolean
  selectedUrl: string | null
  isSaving?: boolean
  onSelect: (url: string) => void
  onUpload: (file: File) => Promise<void>
  onClose: () => void
}

// Mirrors the backend's own 5 MiB limit (users.service.ts's
// MAX_AVATAR_BYTES) — this is only a client-side pre-check, the API is
// still the real enforcement point.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'الصور المسموح بها PNG أو JPEG أو GIF أو WEBP فقط'
  }
  if (file.size === 0) {
    return 'لا يمكن رفع صورة فارغة'
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return 'حجم الصورة يتجاوز الحد المسموح به (5 ميجابايت)'
  }
  return null
}

/**
 * Preset avatar grid, built on the same native `<dialog>` technique as
 * `ConfirmModal` (focus trap + Escape-to-close are browser-native) but
 * with grid content instead of a confirm/cancel message — the two don't
 * share a shape, so this is a sibling component rather than a variant.
 *
 * The "+" tile uploads straight to the backend's own /users/me/avatar
 * route (Cloudinary-backed) — see users.service.ts's uploadAvatar.
 */
export function AvatarPickerModal({
  open,
  selectedUrl,
  isSaving,
  onSelect,
  onUpload,
  onClose,
}: AvatarPickerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const presets = getAvatarPresets()

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const isBusy = Boolean(isSaving) || isUploading

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Clears stale error state on the way out (not "on open" via an
  // effect) — the component stays mounted between opens, since `open`
  // only gates a `return null`, so this is what keeps a leftover error
  // from a previous visit from flashing before the next one clears it.
  function handleClose() {
    setUploadError(null)
    onClose()
  }

  function handleCancel(event: React.SyntheticEvent) {
    event.preventDefault()
    if (!isBusy) handleClose()
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current && !isBusy) {
      handleClose()
    }
  }

  async function handleFileSelected(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }

    setUploadError(null)
    setIsUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      setUploadError(
        err instanceof ApiError && err.status === 413
          ? 'حجم الصورة يتجاوز الحد المسموح به من الخادم'
          : 'تعذر رفع الصورة، حاول مرة أخرى',
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="avatar-picker-dialog"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby="avatar-picker-title"
    >
      <div className="avatar-picker-card" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-picker-head">
          <h2 id="avatar-picker-title">اختر صورة رمزية</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            disabled={isBusy}
            aria-label="إغلاق"
          >
            <span className="ms">close</span>
          </button>
        </div>

        <div className="avatar-picker-grid" role="group" aria-label="الصور الرمزية المتاحة">
          {presets.map((preset) => {
            const isSelected = preset.url === selectedUrl
            return (
              <button
                key={preset.id}
                type="button"
                className={`avatar-picker-option${isSelected ? ' selected' : ''}`}
                onClick={() => onSelect(preset.url)}
                disabled={isBusy}
                aria-pressed={isSelected}
                aria-label={preset.label}
              >
                <img src={preset.url} alt="" />
                {isSelected && (
                  <span className="avatar-picker-check" aria-hidden="true">
                    <span className="ms fill">check</span>
                  </span>
                )}
              </button>
            )
          })}

          <button
            type="button"
            className="avatar-picker-option avatar-picker-upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            aria-label="رفع صورة من جهازك"
          >
            <span className="ms">{isUploading ? 'progress_activity' : 'add'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            aria-label="رفع صورة من جهازك"
            hidden
            disabled={isBusy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void handleFileSelected(file)
              }
            }}
          />
        </div>

        {uploadError && (
          <p role="alert" className="avatar-picker-error">
            {uploadError}
          </p>
        )}
      </div>
    </dialog>
  )
}
