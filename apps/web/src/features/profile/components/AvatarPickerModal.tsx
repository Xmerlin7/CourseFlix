import { useEffect, useRef } from 'react'
import { getAvatarPresets } from '../lib/avatar-presets'

export interface AvatarPickerModalProps {
  open: boolean
  selectedUrl: string | null
  isSaving?: boolean
  onSelect: (url: string) => void
  onClose: () => void
}

/**
 * Preset avatar grid, built on the same native `<dialog>` technique as
 * `ConfirmModal` (focus trap + Escape-to-close are browser-native) but
 * with grid content instead of a confirm/cancel message — the two don't
 * share a shape, so this is a sibling component rather than a variant.
 *
 * No "add custom photo" option: the backend has no avatar upload route
 * (`PATCH /users/me/profile` only accepts a string URL via
 * `UpdateProfileDto.avatarUrl`, validated with @IsUrl()), so there's
 * nowhere for an uploaded file to go yet. This is the integration point
 * for that later — swap `getAvatarPresets()` for real uploaded options
 * and add an upload action here once the backend exists.
 */
export function AvatarPickerModal({ open, selectedUrl, isSaving, onSelect, onClose }: AvatarPickerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const presets = getAvatarPresets()

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
            onClick={onClose}
            disabled={isSaving}
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
                disabled={isSaving}
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
        </div>
      </div>
    </dialog>
  )
}
