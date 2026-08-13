import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { UserRole } from '../../auth/interfaces/authenticated-user.interface';

@Entity({ name: 'discussion_replies' })
export class DiscussionReplyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_discussion_replies_thread_id')
  @Column({ name: 'thread_id', type: 'uuid' })
  threadId!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'author_role', type: 'text' })
  authorRole!: UserRole;

  @Column({ type: 'text' })
  body!: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
