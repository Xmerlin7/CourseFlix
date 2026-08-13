import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Append-only conversation history for a ticket — never edited or deleted. */
@Entity({ name: 'support_messages' })
export class SupportMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_support_messages_ticket_id')
  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'is_staff_reply', type: 'boolean', default: false })
  isStaffReply!: boolean;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
