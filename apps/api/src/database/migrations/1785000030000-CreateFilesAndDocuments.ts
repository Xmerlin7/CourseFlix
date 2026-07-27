import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `files` and `documents` tables per `schemaV2.sql`.
 *
 * PREREQUISITE: `users`, `courses`, `sections`, `lessons` must already
 * exist (referenced via FK). `document_chunks` (Elgendy's
 * 1785000040000 block) references `documents(id)` and must run after
 * this migration — do not reorder.
 */
export class CreateFilesAndDocuments1785000030000 implements MigrationInterface {
  name = 'CreateFilesAndDocuments1785000030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "document_file_type" AS ENUM ('pdf', 'pptx');
    `);

    await queryRunner.query(`
      CREATE TYPE "processing_status_type" AS ENUM ('pending', 'processing', 'completed', 'failed');
    `);

    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "file_name" TEXT NOT NULL,
        "mime_type" TEXT NOT NULL,
        "size_bytes" BIGINT NOT NULL,
        "storage_provider" TEXT NOT NULL,
        "storage_path" TEXT NOT NULL,
        "checksum" TEXT NOT NULL,
        "uploaded_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_files_uploaded_by" ON "files" ("uploaded_by");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_files_checksum" ON "files" ("checksum");
    `);

    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "section_id" UUID REFERENCES "sections"("id") ON DELETE SET NULL,
        "lesson_id" UUID REFERENCES "lessons"("id") ON DELETE SET NULL,
        "uploaded_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "file_id" UUID REFERENCES "files"("id") ON DELETE SET NULL,
        "file_name" TEXT NOT NULL,
        "file_type" document_file_type NOT NULL,
        "processing_status" processing_status_type NOT NULL DEFAULT 'pending',
        "vector_namespace" TEXT,
        "checksum" TEXT,
        "version" INTEGER NOT NULL DEFAULT 1,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_documents_course_id" ON "documents" ("course_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_documents_uploaded_by" ON "documents" ("uploaded_by");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_documents_checksum" ON "documents" ("checksum");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "documents";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "files";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "processing_status_type";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "document_file_type";`);
  }
}
