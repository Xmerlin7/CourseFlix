import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `ai_jobs` table per `schemaV2.sql`.
 *
 * This table tracks every asynchronous AI task processed by the worker
 * (document ingestion, embeddings, quiz generation, etc.).
 */
export class CreateAiJobs1785000040000 implements MigrationInterface {
  name = 'CreateAiJobs1785000040000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "ai_job_status" AS ENUM (
        'queued',
        'processing',
        'completed',
        'failed'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_jobs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "job_type" TEXT NOT NULL,
        "status" ai_job_status NOT NULL DEFAULT 'queued',
        "priority" INTEGER NOT NULL DEFAULT 0,
        "retries" INTEGER NOT NULL DEFAULT 0,
        "target_entity_type" TEXT,
        "target_entity_id" UUID NOT NULL,
        "started_at" TIMESTAMPTZ,
        "finished_at" TIMESTAMPTZ,
        "error_message" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Speeds up "get all jobs for entity X" lookups
    await queryRunner.query(`
      CREATE INDEX "idx_ai_jobs_target_entity_id"
      ON "ai_jobs" ("target_entity_id");
    `);

    // Speeds up worker polling queries (e.g. "get next queued job")
    await queryRunner.query(`
      CREATE INDEX "idx_ai_jobs_status"
      ON "ai_jobs" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "ai_jobs";
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "ai_job_status";
    `);
  }
}