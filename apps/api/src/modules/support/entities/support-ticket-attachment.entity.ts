import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'support_ticket_attachments' })
export class SupportTicketAttachmentEntity {
  @PrimaryColumn({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @PrimaryColumn({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  @Column({ name: 'order_index', type: 'integer', default: 0 })
  orderIndex!: number;
}
