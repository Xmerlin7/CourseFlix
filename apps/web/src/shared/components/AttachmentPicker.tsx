import { useRef, useState } from 'react'

// Mirrors MAX_ATTACHMENT_BYTES=15728640 in AttachmentsService (apps/api) —
// client-side pre-check only, the API enforces the real limit.
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']

interface AttachmentPickerProps {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  label?: string
}

function validate(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'الأنواع المسموح بها: صور أو PDF فقط'
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return 'حجم الملف يتجاوز الحد المسموح به (15 ميجابايت)'
  }
  return null
}

/** Shared "optional image/file attachment" picker for questions, announcements, and support tickets. */
export function AttachmentPicker({ file, onChange, disabled, label = 'إضافة صورة أو ملف' }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSelect(selected: File | null) {
    if (!selected) return
    const validationError = validate(selected)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onChange(selected)
  }

  function handleRemove() {
    setError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      {file ? (
        <div className="chip" style={{ justifyContent: 'space-between', width: 'fit-content' }}>
          <span className="ms">attach_file</span>
          {file.name}
          <button
            type="button"
            className="icon-btn"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="إزالة المرفق"
          >
            <span className="ms">close</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <span className="ms">attach_file</span>
          {label}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        hidden
        disabled={disabled}
        onChange={(event) => handleSelect(event.target.files?.[0] ?? null)}
      />
      {error && (
        <p role="alert" style={{ color: 'var(--error)', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </p>
      )}
    </div>
  )
}
