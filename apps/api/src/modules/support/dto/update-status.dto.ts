import { IsIn } from 'class-validator';
import { SupportTicketStatus } from '../entities/support-ticket.entity';

const TICKET_STATUSES: SupportTicketStatus[] = [
  'open',
  'in_progress',
  'waiting_for_student',
  'resolved',
  'closed',
];

export class UpdateStatusDto {
  @IsIn(TICKET_STATUSES)
  status!: SupportTicketStatus;
}
