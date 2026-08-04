import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mirrors the `agent_logs` table in `schemaV2.sql` (lines ~535-546),
 * extended with `correlation_id`, `duration_ms`, `row_count`, and
 * `metadata` for Sprint 3's traceability/redaction requirements
 * (sprint3-plan.md §4 H-3, CF-TASK-074) — those columns don't exist in
 * the canonical schema, since it predates the correlation-ID and
 * Analytics Agent logging contracts.
 *
 * `agent_type` and `agent_log_status` are extended past their
 * schemaV2.sql values with `analytics_agent` and `skipped`
 * respectively, so Nabile's Analytics Agent (N-3) can log an
 * unsupported-question answer without a fake "failed" status.
 */
export class CreateAgentLogs1785000060000 implements MigrationInterface {
  name = 'CreateAgentLogs1785000060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "agent_type" AS ENUM (
        'content_scout', 'proactive_proctor', 'tutor_llm', 'analytics_agent'
      );
    `);
    await queryRunner.query(`
      CREATE TYPE "agent_log_status" AS ENUM ('success', 'failed', 'retrying', 'skipped');
    `);
    await queryRunner.query(`
      CREATE TABLE "agent_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "agent_type" agent_type NOT NULL,
        "course_id" UUID REFERENCES "courses"("id") ON DELETE SET NULL,
        "target_entity_type" TEXT,
        "target_entity_id" UUID,
        "action" TEXT NOT NULL,
        "status" agent_log_status NOT NULL,
        "tokens_used" INTEGER,
        "duration_ms" INTEGER,
        "row_count" INTEGER,
        "correlation_id" TEXT,
        "metadata" JSONB,
        "error_message" TEXT,
        "executed_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_agent_logs_course_executed" ON "agent_logs" ("course_id", "executed_at" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_agent_logs_agent_type_executed" ON "agent_logs" ("agent_type", "executed_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "agent_logs";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agent_log_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agent_type";`);
  }
}
