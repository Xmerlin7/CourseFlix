import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the Sprint 2 Tutor chat tables per `schemaV2.sql`.
 *
 * `chat_message_source_chunks.chunk_id` targets the Postgres
 * `document_chunks.id`, not the vector-store ID. That keeps citations
 * relationally auditable even when Chroma is rebuilt.
 */
export class CreateChatTables1785000050000 implements MigrationInterface {
  name = 'CreateChatTables1785000050000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "chat_conversation_status" AS ENUM ('active', 'closed');
    `);
    await queryRunner.query(`
      CREATE TYPE "chat_sender_type" AS ENUM ('student', 'ai_tutor');
    `);
    await queryRunner.query(`
      CREATE TYPE "chat_role" AS ENUM ('user', 'assistant', 'system');
    `);
    await queryRunner.query(`
      CREATE TYPE "moderation_status_type" AS ENUM ('pending', 'approved', 'blocked');
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_conversations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "status" chat_conversation_status NOT NULL DEFAULT 'active',
        "deleted_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "last_message_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_chat_conversations_active_student_course"
      ON "chat_conversations" ("student_id", "course_id")
      WHERE "status" = 'active' AND "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversation_id" UUID NOT NULL REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
        "sender_type" chat_sender_type NOT NULL,
        "role" chat_role NOT NULL,
        "message_text" TEXT NOT NULL,
        "summary_state" TEXT,
        "moderation_status" moderation_status_type,
        "model_name" TEXT,
        "provider" TEXT,
        "temperature" NUMERIC(3,2),
        "prompt_version" TEXT,
        "tokens_used" INTEGER,
        "flagged" BOOLEAN NOT NULL DEFAULT FALSE,
        "flag_reason" TEXT,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_messages_conversation_id"
      ON "chat_messages" ("conversation_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_message_source_chunks" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "message_id" UUID NOT NULL REFERENCES "chat_messages"("id") ON DELETE CASCADE,
        "chunk_id" UUID NOT NULL REFERENCES "document_chunks"("id") ON DELETE RESTRICT,
        "relevance_score" NUMERIC(5,4),
        "excerpt" TEXT,
        "vector_id" TEXT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_message_source_chunks_message_id"
      ON "chat_message_source_chunks" ("message_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "chat_message_source_chunks";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages";`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_chat_conversations_active_student_course";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_conversations";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "moderation_status_type";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chat_role";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chat_sender_type";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chat_conversation_status";`);
  }
}
