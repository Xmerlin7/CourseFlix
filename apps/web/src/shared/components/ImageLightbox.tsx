import { useEffect } from 'react'
import { sanitizeFilename } from '../utils/sanitizeFilename'

export interface ImageLightboxProps {
  isOpen: boolean
  src: string
  fileName?: string
  onClose: () => void
}

export function ImageLightbox({ isOpen, src, fileName = 'صورة', onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const cleanName = sanitizeFilename(fileName)

  return (
    <div
      className="image-lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="عرض الصورة بالحجم الكامل"
    >
      <div className="image-lightbox-header" onClick={(event) => event.stopPropagation()}>
        <span className="image-lightbox-title" title={cleanName}>
          {cleanName}
        </span>
        <div className="image-lightbox-controls">
          <a
            href={src}
            download={cleanName}
            target="_blank"
            rel="noopener noreferrer"
            className="image-lightbox-btn"
            title="تحميل الصورة"
            aria-label="تحميل الصورة"
          >
            <span className="ms sm" aria-hidden="true">download</span>
          </a>
          <button
            type="button"
            className="image-lightbox-btn"
            onClick={onClose}
            title="إغلاق"
            aria-label="إغلاق"
          >
            <span className="ms sm" aria-hidden="true">close</span>
          </button>
        </div>
      </div>

      <div className="image-lightbox-content" onClick={(event) => event.stopPropagation()}>
        <img
          src={src}
          alt={cleanName}
          className="image-lightbox-img"
        />
      </div>
    </div>
  )
}
