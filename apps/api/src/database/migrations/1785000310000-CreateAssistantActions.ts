import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Assistant writes on the teacher surface no longer take effect
 * immediately — they are parked here until the teacher approves them, and
 * replayed on approval. See AssistantActionEntity and
 * assistant-action.registry.ts.
 *
 * Guarded (`IF NOT EXISTS` / duplicate_object catch) per this repo's
 * convention for coexisting with `synchronize: true` in app.module.ts.
 */
export class CreateAssistantActions1785000310000 implements MigrationInterface {
  name = 'CreateAssistantActions1785000310000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."assistant_action_status" AS ENUM('pending', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assistant_actions" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "assistant_id"    uuid NOT NULL,
        "teacher_id"      uuid NOT NULL,
        "route_key"       text NOT NULL,
        "params"          jsonb NOT NULL DEFAULT '{}'::jsonb,
        "body"            jsonb NOT NULL DEFAULT '{}'::jsonb,
        "summary"         text NOT NULL,
        "status"          text NOT NULL DEFAULT 'pending',
        "reviewed_by"     uuid,
        "reviewed_at"     TIMESTAMPTZ,
        "review_note"     text,
        "execution_error" text,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_assistant_actions_assistant_id"
        ON "assistant_actions" ("assistant_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_assistant_actions_teacher_id"
        ON "assistant_actions" ("teacher_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_assistant_actions_status"
        ON "assistant_actions" ("status");
    `);

    // The review queue is always read as "this teacher's pending items,
    // newest first" — the single-column indexes above can't serve that
    // ordering without a sort.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_assistant_actions_queue"
        ON "assistant_actions" ("teacher_id", "status", "created_at" DESC);
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "assistant_actions"
          ADD CONSTRAINT "fk_assistant_actions_assistant"
          FOREIGN KEY ("assistant_id") REFERENCES "users"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "assistant_actions"
          ADD CONSTRAINT "fk_assistant_actions_teacher"
          FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "assistant_actions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."assistant_action_status"`,
    );
  }
}
