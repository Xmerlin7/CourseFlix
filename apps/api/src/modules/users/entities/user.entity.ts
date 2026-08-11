import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { UserRole } from '../../auth/interfaces/authenticated-user.interface';

export type UserStatus = 'active' | 'suspended' | 'inactive';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'text' })
  fullName!: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  email!: string;

  // Argon2id hash only — never the plaintext password. Only ever
  // select this column on the login path, never in profile responses.
  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: ['student', 'teacher', 'admin', 'assistant'],
    enumName: 'user_role',
  })
  role!: UserRole;

  // Only set (and required) for role: 'assistant' — the one teacher this
  // assistant is scoped to. See CHK_users_assistant_has_teacher.
  @Column({ name: 'managed_by_teacher_id', type: 'uuid', nullable: true })
  managedByTeacherId!: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'inactive'],
    enumName: 'user_status',
    default: 'active',
  })
  status!: UserStatus;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  // Mirrors schemaV2.sql's settings_theme — client applies 'system' by
  // resolving prefers-color-scheme itself, the server just stores the
  // user's choice. settings_language/settings_email_notifications from
  // the same schema block are deferred: there's no i18n layer and no
  // email delivery channel yet for either to actually do anything.
  @Column({
    name: 'settings_theme',
    type: 'text',
    default: 'system',
  })
  settingsTheme!: 'light' | 'dark' | 'system';

  // Per-notification-type opt-out, e.g. {"hw_assigned": false}. A type
  // with no key here is treated as enabled — see NotificationsService.notify().
  @Column({
    name: 'settings_notification_preferences',
    type: 'jsonb',
    default: {},
  })
  settingsNotificationPreferences!: Record<string, boolean>;

  // Soft delete — every read query elsewhere in the app must filter
  // `deletedAt IS NULL`. Never hard-delete a user row.
  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
