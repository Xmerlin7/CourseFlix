import { TICKET_STATUS_META } from '../lib/support-status-labels'
import type { SupportTicketStatus } from '../types/support.types'

export function TicketStatusBadge({ status }: { status: SupportTicketStatus }) {
  const meta = TICKET_STATUS_META[status]
  return (
    <span className={`chip${meta.chipClass ? ` ${meta.chipClass}` : ''}`}>
      <span className="ms">{meta.icon}</span>
      {meta.label}
    </span>
  )
}
