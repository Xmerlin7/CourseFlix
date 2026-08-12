import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type NotificationType =
  | 'hw_assigned'
  | 'quiz_ready'
  | 'progress_report'
  | 'announcement'
  | 'course_update'
  | 'system'
  | 'discussion_reply'
  | 'discussion_accepted'
  | 'support_ticket_update';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Mirrors the `notifications` table in `schemaV2.sql` exactly.
 *
 * `userId` is kept as a plain UUID column, matching the pattern in
 * `enrollment.entity.ts`, to avoid a module import cycle with
 * `UsersModule`. `relatedEntityType`/`relatedEntityId` are intentionally
 * polymorphic with no FK, per the schema comment.
 *
 * `deliveryStatus`/`scheduledAt` exist because `schemaV2.sql` has them,
 * but Sprint 2 has no delivery channel or scheduler — every notification
 * is written synchronously by `NotificationsService.notify()` and both
 * columns stay `null` this sprint.
 */
@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_notifications_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: [
      'hw_assigned',
      'quiz_ready',
      'progress_report',
      'announcement',
      'course_update',
      'system',
      'discussion_reply',
      'discussion_accepted',
      'support_ticket_update',
    ],
    enumName: 'notification_type',
  })
  type!: NotificationType;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'related_entity_type', type: 'text', nullable: true })
  relatedEntityType!: string | null;

  @Column({ name: 'related_entity_id', type: 'uuid', nullable: true })
  relatedEntityId!: string | null;

  @Column({
    type: 'enum',
    enum: ['low', 'normal', 'high', 'critical'],
    enumName: 'notification_priority',
    default: 'normal',
  })
  priority!: NotificationPriority;

  @Column({ name: 'delivery_status', type: 'text', nullable: true })
  deliveryStatus!: string | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  // Soft delete — every read query must filter `deletedAt IS NULL`.
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
