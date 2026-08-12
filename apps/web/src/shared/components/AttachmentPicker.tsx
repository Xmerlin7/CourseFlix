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

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'image'
  if (type === 'application/pdf') return 'picture_as_pdf'
  return 'attach_file'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Shared "optional image/file attachment" picker for questions, announcements, and support tickets. */
export function AttachmentPicker({ file, onChange, disabled, label = 'إرفاق صورة أو ملف' }: AttachmentPickerProps) {
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
    <div className="attachment-picker">
      {file ? (
        <div className="selected-attachment-item">
          <span className="ms attachment-item-icon" aria-hidden="true">
            {getFileIcon(file.type)}
          </span>
          <div className="attachment-item-details">
            <span className="attachment-item-name" title={file.name}>
              {file.name}
            </span>
            <span className="attachment-item-size">{formatFileSize(file.size)}</span>
          </div>
          <button
            type="button"
            className="icon-btn attachment-item-remove"
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
          className="attachment-upload-btn"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <span className="ms" aria-hidden="true">attach_file</span>
          <div className="attachment-btn-text">
            <span>{label}</span>
            <span className="attachment-btn-hint">PDF, PNG, JPG, WEBP, GIF (حتى 15 ميجابايت)</span>
          </div>
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
        <p role="alert" className="attachment-error">
          {error}
        </p>
      )}
    </div>
  )
}


