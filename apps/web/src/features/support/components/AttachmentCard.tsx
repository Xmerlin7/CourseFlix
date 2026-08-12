import type { SupportTicketAttachment } from '../types/support.types'

function iconForMimeType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'picture_as_pdf'
  return 'attach_file'
}

export function AttachmentCard({ attachment }: { attachment: SupportTicketAttachment }) {
  return (
    <span className="attachment-card" title={attachment.fileName}>
      <span className="ms" aria-hidden="true">
        {iconForMimeType(attachment.mimeType)}
      </span>
      <span className="attachment-card-name">{attachment.fileName}</span>
    </span>
  )
}
