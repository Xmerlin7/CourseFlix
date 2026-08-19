import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the mail-reporting agent to the lesson pipeline.
 *
 * Two changes, both additive:
 *
 * 1. A new `notifier` value on the `lesson_agent_key` enum, so the
 *    worker can record a step and events for the agent that emails the
 *    teacher a summary of the pass.
 * 2. A `teacher_agent_settings.notifier_enabled` toggle, so the agent is
 *    optional exactly like `handout` and `quizmaster` — off by nothing,
 *    on by default.
 *
 * Postgres 12+ allows `ALTER TYPE ... ADD VALUE` inside a transaction as
 * long as the new value isn't *used* in that same transaction, and this
 * migration only defines it — `data-source.ts` also commits each
 * migration in its own transaction, so a later migration can store the
 * value freely.
 */
export class AddNotifierAgent1787110900000 implements MigrationInterface {
  name = 'AddNotifierAgent1787110900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // DO-block guard, same defensive style as the original pipeline
    // migration: a partially-applied database can be re-run safely.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'notifier'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lesson_agent_key')
        ) THEN
          ALTER TYPE "lesson_agent_key" ADD VALUE 'notifier';
        END IF;
      END
      $$;
    `);

    const hasColumn = await queryRunner.hasColumn(
      'teacher_agent_settings',
      'notifier_enabled',
    );
    if (!hasColumn) {
      await queryRunner.query(`
        ALTER TABLE "teacher_agent_settings"
          ADD COLUMN "notifier_enabled" BOOLEAN NOT NULL DEFAULT true;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teacher_agent_settings"
        DROP COLUMN IF EXISTS "notifier_enabled";
    `);

    // Postgres cannot drop a single enum value, so the type is rebuilt
    // without it, with the columns cast back through text.
    await queryRunner.query(`
      ALTER TABLE "lesson_agent_steps" ALTER COLUMN "agent_key" TYPE TEXT;
      ALTER TABLE "lesson_agent_events" ALTER COLUMN "agent_key" TYPE TEXT;
      ALTER TABLE "lesson_agent_events" ALTER COLUMN "to_agent_key" TYPE TEXT;
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_agent_key";`);
    await queryRunner.query(`
      CREATE TYPE "lesson_agent_key" AS ENUM (
        'transcript', 'reviewer', 'indexer', 'handout', 'quizmaster'
      );
    `);
    await queryRunner.query(`
      ALTER TABLE "lesson_agent_steps"
        ALTER COLUMN "agent_key" TYPE "lesson_agent_key"
        USING "agent_key"::"lesson_agent_key";
      ALTER TABLE "lesson_agent_events"
        ALTER COLUMN "agent_key" TYPE "lesson_agent_key"
        USING "agent_key"::"lesson_agent_key";
      ALTER TABLE "lesson_agent_events"
        ALTER COLUMN "to_agent_key" TYPE "lesson_agent_key"
        USING "to_agent_key"::"lesson_agent_key";
    `);
  }
}
