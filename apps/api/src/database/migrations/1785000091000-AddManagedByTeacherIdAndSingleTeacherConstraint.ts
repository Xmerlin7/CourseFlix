import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Runs after 1785000090000-AddAssistantRole (which only adds the enum
 * value — the value can't be referenced by DDL in that same transaction).
 *
 * `managed_by_teacher_id` is nullable and only ever set for `assistant`
 * accounts, enforced by the CHECK constraint below rather than a trigger.
 * The partial unique index caps the platform at one active `teacher`
 * account — `deleted_at IS NULL` means soft-deleting or role-changing the
 * current teacher frees the slot for a replacement.
 *
 * Every step below checks for prior existence first: this app also runs
 * with `synchronize: true` (see app.module.ts), so on a dev box that's
 * already booted the API once since `UserEntity` picked up the
 * `managedByTeacherId` column, TypeORM's own schema sync can beat this
 * migration to creating the column (without the FK/CHECK/index, which
 * aren't decorator-driven and synchronize doesn't know about) — a plain
 * unguarded `ADD COLUMN` would then fail with "already exists".
 *
 * Also demotes every non-deleted 'teacher' row but the oldest into an
 * 'assistant' before creating the unique index — a database seeded
 * before this migration existed can have more than one, which would
 * otherwise make the index creation fail outright.
 */
export class AddManagedByTeacherIdAndSingleTeacherConstraint1785000091000 implements MigrationInterface {
  name = 'AddManagedByTeacherIdAndSingleTeacherConstraint1785000091000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn(
      'users',
      'managed_by_teacher_id',
    );
    if (!hasColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "managed_by_teacher_id" uuid;
      `);
    }

    const foreignKeyRows = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_users_managed_by_teacher_id'
      ) AS exists;
    `)) as Array<{ exists: boolean }>;
    if (!foreignKeyRows[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_managed_by_teacher_id"
        FOREIGN KEY ("managed_by_teacher_id") REFERENCES "users"("id");
      `);
    }

    const checkRows = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CHK_users_assistant_has_teacher'
      ) AS exists;
    `)) as Array<{ exists: boolean }>;
    if (!checkRows[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD CONSTRAINT "CHK_users_assistant_has_teacher" CHECK (
          (role = 'assistant' AND managed_by_teacher_id IS NOT NULL)
          OR (role <> 'assistant' AND managed_by_teacher_id IS NULL)
        );
      `);
    }

    // Pre-existing databases seeded before this migration can have more
    // than one non-deleted 'teacher' row (the old fixture's second demo
    // teacher) — the unique index below would fail outright on that
    // data. Demote every teacher but the oldest into an assistant
    // managed by it, the same outcome the updated seed produces for a
    // fresh database, instead of just erroring out or deleting rows.
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'assistant',
          "managed_by_teacher_id" = (
            SELECT "id" FROM "users"
            WHERE "role" = 'teacher' AND "deleted_at" IS NULL
            ORDER BY "created_at" ASC
            LIMIT 1
          )
      WHERE "role" = 'teacher' AND "deleted_at" IS NULL
        AND "id" <> (
          SELECT "id" FROM "users"
          WHERE "role" = 'teacher' AND "deleted_at" IS NULL
          ORDER BY "created_at" ASC
          LIMIT 1
        );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ux_users_single_teacher"
      ON "users" ("role")
      WHERE "role" = 'teacher' AND "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "ux_users_single_teacher";`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_assistant_has_teacher";`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_managed_by_teacher_id";`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "managed_by_teacher_id";`,
    );
  }
}
