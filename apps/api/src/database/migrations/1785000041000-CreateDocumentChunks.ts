import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `document_chunks` table per `schemaV2.sql`.
 *
 * Stores metadata for indexed document chunks. The full chunk text and
 * embeddings live in ChromaDB; this table bridges the application
 * database with the vector store.
 */
export class CreateDocumentChunks1785000041000 implements MigrationInterface {
    name = 'CreateDocumentChunks1785000041000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE "document_chunks" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "document_id" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
        "chunk_index" INTEGER NOT NULL,
        "text_preview" TEXT,
        "vector_id" TEXT NOT NULL UNIQUE,
        "page_number" INTEGER,
        "token_count" INTEGER,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "deleted_at" TIMESTAMPTZ
      );
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_document_chunks_document_id"
      ON "document_chunks" ("document_id");
    `);

        await queryRunner.query(`
      CREATE INDEX "idx_document_chunks_vector_id"
      ON "document_chunks" ("vector_id");
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      DROP TABLE IF EXISTS "document_chunks";
    `);
    }
}