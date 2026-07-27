import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type DocumentFileType = 'pdf' | 'pptx';
export type DocumentProcessingStatus =
  'pending' | 'processing' | 'completed' | 'failed';

/**
 * Mirrors the `documents` table in `schemaV2.sql` exactly.
 *
 * Sprint 2 (CF-TASK-005 upload) only ever writes `fileType: 'pdf'` —
 * `'pptx'` stays in the enum because `schemaV2.sql` defines it, but
 * PPTX ingestion is explicitly out of scope this sprint (see
 * "Explicitly out of scope for Sprint 2" in sprint2-plan.md). Reject
 * non-PDF uploads at the DTO/service layer, not here.
 *
 * All FKs (`courseId`, `sectionId`, `lessonId`, `uploadedBy`,
 * `fileId`) are kept as plain UUID columns, matching the pattern in
 * `enrollment.entity.ts`, to avoid module import cycles with
 * `CoursesModule` / `UsersModule`.
 *
 * `deletedAt` being set is also the trigger for an async ChromaDB
 * vector purge (Elgendy's ingestion worker) — not enforced by this
 * entity, documented here so the contract is visible in one place.
 */
@Entity({ name: 'documents' })
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_documents_course_id')
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ name: 'section_id', type: 'uuid', nullable: true })
  sectionId!: string | null;

  @Column({ name: 'lesson_id', type: 'uuid', nullable: true })
  lessonId!: string | null;

  @Index('idx_documents_uploaded_by')
  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @Column({ name: 'file_id', type: 'uuid', nullable: true })
  fileId!: string | null;

  @Column({ name: 'file_name', type: 'text' })
  fileName!: string;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: ['pdf', 'pptx'],
    enumName: 'document_file_type',
  })
  fileType!: DocumentFileType;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    enumName: 'processing_status_type',
    default: 'pending',
  })
  processingStatus!: DocumentProcessingStatus;

  @Column({ name: 'vector_namespace', type: 'text', nullable: true })
  vectorNamespace!: string | null;

  // SHA-256, dedup key — a re-upload with a matching checksum bumps `version`
  // instead of creating a new row (see H-2 in sprint2-plan.md).
  @Index('idx_documents_checksum')
  @Column({ type: 'text', nullable: true })
  checksum!: string | null;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  // Soft delete — every read query must filter `deletedAt IS NULL`.
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
