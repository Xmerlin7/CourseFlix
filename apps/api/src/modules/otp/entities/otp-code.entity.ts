import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type OtpPurpose =
  'login' | 'register' | 'password_reset' | 'google_oauth';

@Entity('otp_codes')
@Index(['userId', 'purpose', 'createdAt'])
export class OtpCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ['login', 'register', 'password_reset', 'google_oauth'],
    enumName: 'otp_purpose',
  })
  purpose!: OtpPurpose;

  // Argon2id hash of the 6-digit code — never the code itself.
  @Column({ name: 'code_hash', type: 'text' })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  // Set when the code is redeemed or deliberately invalidated (a newer
  // code supersedes all older unconsumed ones for the same user+purpose).
  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
