import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ChatSenderType = 'student' | 'ai_tutor';
export type ChatRole = 'user' | 'assistant' | 'system';
export type ModerationStatus = 'pending' | 'approved' | 'blocked';

@Entity({ name: 'chat_messages' })
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({
    name: 'sender_type',
    type: 'enum',
    enum: ['student', 'ai_tutor'],
    enumName: 'chat_sender_type',
  })
  senderType!: ChatSenderType;

  @Column({
    type: 'enum',
    enum: ['user', 'assistant', 'system'],
    enumName: 'chat_role',
  })
  role!: ChatRole;

  @Column({ name: 'message_text', type: 'text' })
  messageText!: string;

  @Column({ name: 'summary_state', type: 'text', nullable: true })
  summaryState!: string | null;

  @Column({
    name: 'moderation_status',
    type: 'enum',
    enum: ['pending', 'approved', 'blocked'],
    enumName: 'moderation_status_type',
    nullable: true,
  })
  moderationStatus!: ModerationStatus | null;

  @Column({ name: 'model_name', type: 'text', nullable: true })
  modelName!: string | null;

  @Column({ type: 'text', nullable: true })
  provider!: string | null;

  @Column({ type: 'numeric', precision: 3, scale: 2, nullable: true })
  temperature!: string | null;

  @Column({ name: 'prompt_version', type: 'text', nullable: true })
  promptVersion!: string | null;

  @Column({ name: 'tokens_used', type: 'integer', nullable: true })
  tokensUsed!: number | null;

  @Column({ type: 'boolean', default: false })
  flagged!: boolean;

  @Column({ name: 'flag_reason', type: 'text', nullable: true })
  flagReason!: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
