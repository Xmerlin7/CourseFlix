import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Mirrors the `files` table in `schemaV2.sql` exactly — centralised
 * asset metadata, storage-provider agnostic.
 *
 * `uploadedBy` / no relations: kept as a plain UUID column, matching
 * the pattern in `enrollment.entity.ts`, to avoid a module import
 * cycle with `UsersModule`.
 */
@Entity({ name: 'files' })
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'file_name', type: 'text' })
  fileName!: string;

  @Column({ name: 'mime_type', type: 'text' })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  // e.g. 'local' for Sprint 2's LocalStorageAdapter; 's3' when that adapter lands.
  @Column({ name: 'storage_provider', type: 'text' })
  storageProvider!: string;

  @Column({ name: 'storage_path', type: 'text' })
  storagePath!: string;

  // SHA-256, dedup key.
  @Index('idx_files_checksum')
  @Column({ type: 'text' })
  checksum!: string;

  @Index('idx_files_uploaded_by')
  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
