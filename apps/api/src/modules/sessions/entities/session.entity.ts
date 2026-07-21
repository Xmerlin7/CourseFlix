import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  // Opaque, server-generated session token — only the hash is stored,
  // never the raw cookie value. This is a same-site session cookie,
  // not an OAuth-style refresh token (per CF-US-002's opaque-session
  // design), so this deviates from the `refresh_token_hash` naming
  // in schemaV2.sql on purpose.
  @Index()
  @Column({ name: 'token_hash', type: 'text' })
  tokenHash!: string;

  @Column({ name: 'device_info', type: 'text', nullable: true })
  deviceInfo!: string | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // Set on logout (or forced revocation). A non-null value means the
  // session is invalid even if expiresAt is still in the future.
  // This column is not in schemaV2.sql — added here because CF-US-002
  // acceptance criterion 5 requires server-side logout invalidation.
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}