import { AttachmentPreview } from '../../../shared/components/AttachmentPreview'
import type { SupportTicketAttachment } from '../types/support.types'

export function AttachmentCard({ attachment }: { attachment: SupportTicketAttachment }) {
  return <AttachmentPreview attachment={attachment} />
}

