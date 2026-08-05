import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'

// Mirrors MAX_UPLOAD_BYTES=20971520 from .env.example (sprint2-plan.md §2.1) —
// this is only a client-side pre-check, the API enforces the real limit.
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

interface DocumentUploaderProps {
  onUpload: (file: File) => Promise<void>
}

function validate(file: File): string | null {
  if (file.type !== 'application/pdf') {
    return 'الملفات المسموح بها PDF فقط'
  }
  if (file.size === 0) {
    return 'لا يمكن رفع ملف فارغ'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'حجم الملف يتجاوز الحد المسموح به (20 ميجابايت)'
  }
  return null
}

export function DocumentUploader({ onUpload }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    const validationError = validate(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      await onUpload(file)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 413
          ? 'حجم الملف يتجاوز الحد المسموح به من الخادم'
          : 'تعذر رفع الملف، حاول مرة أخرى',
      )
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(event: DragEvent<HTMLLabelElement>) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event: DragEvent<HTMLLabelElement>) => {
          event.preventDefault()
          setIsDragging(false)
          const file = event.dataTransfer.files[0]
          if (file) {
            void handleFile(file)
          }
        }}
        className={`dropzone${isDragging ? ' dragging' : ''}`}
      >
        <span className="ms">{isUploading ? 'progress_activity' : 'upload_file'}</span>
        <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>
          {isUploading ? 'جارٍ الرفع...' : 'اسحب ملف PDF هنا أو اضغط للاختيار'}
        </span>
        <span style={{ fontSize: 12.5 }}>PDF فقط، بحد أقصى 20 ميجابايت</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void handleFile(file)
            }
          }}
        />
      </label>

      {error && (
        <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
          {error}
        </p>
      )}
    </div>
  )
}
