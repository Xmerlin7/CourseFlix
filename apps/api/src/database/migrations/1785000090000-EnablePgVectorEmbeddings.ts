import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Moves CourseFlix from an external ChromaDB vector store to pgvector.
 *
 * Document/video chunk embeddings previously lived in ChromaDB (whose
 * only free hosts are ephemeral or self-managed). This migration enables
 * the Postgres `vector` extension and stores each chunk's embedding
 * directly on its existing `document_chunks` / `video_chunks` row, plus a
 * `text_content` column holding the full chunk text (ChromaDB was the
 * only place the full text was kept).
 *
 * Local dev and the Render free deploy both use Postgres, so this removes
 * the Chroma dependency entirely.
 */
export class EnablePgVectorEmbeddings1785000090000 implements MigrationInterface {
  name = 'EnablePgVectorEmbeddings1785000090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(
      `ALTER TABLE "document_chunks" ADD COLUMN IF NOT EXISTS "embedding" vector(1536)`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" ADD COLUMN IF NOT EXISTS "text_content" TEXT`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_chunks" ADD COLUMN IF NOT EXISTS "embedding" vector(1536)`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_chunks" ADD COLUMN IF NOT EXISTS "text_content" TEXT`,
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_document_chunks_embedding_hnsw"
        ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_video_chunks_embedding_hnsw"
        ON "video_chunks" USING hnsw ("embedding" vector_cosine_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_video_chunks_embedding_hnsw"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_document_chunks_embedding_hnsw"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_chunks" DROP COLUMN IF EXISTS "embedding"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_chunks" DROP COLUMN IF EXISTS "text_content"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" DROP COLUMN IF EXISTS "embedding"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" DROP COLUMN IF EXISTS "text_content"`,
    );
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
  }
}
