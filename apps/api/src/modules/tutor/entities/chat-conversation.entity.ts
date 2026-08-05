import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ChatConversationStatus = 'active' | 'closed';

@Entity({ name: 'chat_conversations' })
@Index('idx_chat_conversations_student_course', ['studentId', 'courseId'])
export class ChatConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'closed'],
    enumName: 'chat_conversation_status',
    default: 'active',
  })
  status!: ChatConversationStatus;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({
    name: 'started_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  startedAt!: Date;

  @Column({
    name: 'last_message_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  lastMessageAt!: Date;
}
