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

/**
 * A student's question inside a course's Community tab.
 *
 * `courseId` / `authorId` are kept as plain UUID columns (no relations),
 * matching `enrollment.entity.ts` / `notification.entity.ts`, to avoid a
 * module import cycle with CoursesModule/UsersModule.
 *
 * `authorRole` is a snapshot of the poster's role at post time — drives
 * the "Teacher" badge without joining `users`, see the migration's
 * docblock.
 */
@Entity({ name: 'discussion_threads' })
export class DiscussionThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_discussion_threads_course_id')
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Index('idx_discussion_threads_author_id')
  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'author_role', type: 'text' })
  authorRole!: UserRole;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  @Column({ name: 'accepted_reply_id', type: 'uuid', nullable: true })
  acceptedReplyId!: string | null;

  @Column({ name: 'reply_count', type: 'integer', default: 0 })
  replyCount!: number;

  @Column({ name: 'helpful_count', type: 'integer', default: 0 })
  helpfulCount!: number;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned!: boolean;

  // Every read query must filter `deletedAt: IsNull()`.
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
