import { useState } from 'react'
import { env } from '../lib/env'
import { sanitizeFilename } from '../utils/sanitizeFilename'
import './AttachmentPreview.css'
import { ImageLightbox } from './ImageLightbox'

export interface AttachmentItemData {
  id: string
  fileName: string
  mimeType?: string
  sizeBytes?: string | number
  fileUrl?: string
}

function isImageMime(mimeType?: string, fileName?: string): boolean {
  if (mimeType && mimeType.startsWith('image/')) return true
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop()
    if (ext && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
      return true
    }
  }
  return false
}

function getFileIconInfo(mimeType?: string, fileName?: string): {
  icon: string
  classModifier: string
  label: string
} {
  const ext = fileName ? fileName.toLowerCase().split('.').pop() : ''

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return { icon: 'picture_as_pdf', classModifier: 'pdf', label: 'مستند PDF' }
  }
  if (
    mimeType?.includes('word') ||
    mimeType?.includes('officedocument.wordprocessingml') ||
    ['doc', 'docx'].includes(ext || '')
  ) {
    return { icon: 'description', classModifier: 'word', label: 'مستند Word' }
  }
  if (
    mimeType?.includes('excel') ||
    mimeType?.includes('spreadsheet') ||
    ['xls', 'xlsx', 'csv'].includes(ext || '')
  ) {
    return { icon: 'table_chart', classModifier: 'excel', label: 'جدول بيانات' }
  }
  if (
    mimeType?.includes('presentation') ||
    mimeType?.includes('powerpoint') ||
    ['ppt', 'pptx'].includes(ext || '')
  ) {
    return { icon: 'slideshow', classModifier: 'ppt', label: 'عرض تقديمي' }
  }
  if (
    mimeType?.includes('zip') ||
    mimeType?.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')
  ) {
    return { icon: 'folder_zip', classModifier: 'zip', label: 'ملف مضغوط' }
  }
  if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) {
    return { icon: 'audio_file', classModifier: 'audio', label: 'ملف صوتي' }
  }
  if (mimeType?.startsWith('video/') || ['mp4', 'mkv', 'mov', 'avi'].includes(ext || '')) {
    return { icon: 'video_file', classModifier: 'video', label: 'ملف فيديو' }
  }
  if (['txt', 'log', 'md', 'json'].includes(ext || '')) {
    return { icon: 'article', classModifier: 'text', label: 'ملف نصي' }
  }

  return { icon: 'attach_file', classModifier: 'default', label: 'ملف مرفق' }
}

function formatBytes(bytes?: string | number): string | null {
  if (!bytes) return null
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (isNaN(num) || num <= 0) return null

  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / (1024 * 1024)).toFixed(1)} MB`
}

export interface AttachmentPreviewProps {
  attachment: AttachmentItemData
  variant?: 'compact' | 'feed'
  className?: string
}

export function AttachmentPreview({
  attachment,
  variant = 'compact',
  className = '',
}: AttachmentPreviewProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const cleanName = sanitizeFilename(attachment.fileName)
  const isImage = isImageMime(attachment.mimeType, attachment.fileName) && !imageError
  const fileUrl = attachment.fileUrl ?? `${env.apiBaseUrl}/attachments/${attachment.id}`
  const fileInfo = getFileIconInfo(attachment.mimeType, attachment.fileName)
  const sizeFormatted = formatBytes(attachment.sizeBytes)

  if (isImage) {
    const feedModifier = variant === 'feed' ? 'attachment-image-wrapper--feed' : ''
    return (
      <>
        <div
          className={`attachment-image-wrapper ${feedModifier} ${className}`.trim()}
          onClick={() => setIsLightboxOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setIsLightboxOpen(true)
            }
          }}
          title={`${cleanName} (انقر للتكبير)`}
          aria-label={`عرض ${cleanName} بالحجم الكامل`}
        >
          <img
            src={fileUrl}
            alt={cleanName}
            className="attachment-image-thumb"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <div className="attachment-image-overlay" aria-hidden="true">
            <span className="ms">zoom_in</span>
          </div>
        </div>

        <ImageLightbox
          isOpen={isLightboxOpen}
          src={fileUrl}
          fileName={cleanName}
          onClose={() => setIsLightboxOpen(false)}
        />
      </>
    )
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`attachment-file-card ${className}`.trim()}
      title={cleanName}
    >
      <div className={`attachment-file-icon-box ${fileInfo.classModifier}`} aria-hidden="true">
        <span className="ms">{fileInfo.icon}</span>
      </div>

      <div className="attachment-file-info">
        <span className="attachment-file-name">{cleanName}</span>
        <span className="attachment-file-meta">
          {sizeFormatted ? `${fileInfo.label} • ${sizeFormatted}` : fileInfo.label}
        </span>
      </div>

      <span className="attachment-file-action">
        <span className="ms" aria-hidden="true">open_in_new</span>
        فتح / تحميل
      </span>
    </a>
  )
}

export interface AttachmentPreviewListProps {
  attachments: AttachmentItemData[]
  layout?: 'vertical' | 'horizontal'
  variant?: 'compact' | 'feed'
  className?: string
}

export function AttachmentPreviewList({
  attachments,
  layout = 'vertical',
  variant = 'compact',
  className = '',
}: AttachmentPreviewListProps) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div
      className={`attachment-preview-list attachment-preview-list--${layout} ${className}`.trim()}
    >
      {attachments.map((att) => (
        <AttachmentPreview key={att.id} attachment={att} variant={variant} />
      ))}
    </div>
  )
}
