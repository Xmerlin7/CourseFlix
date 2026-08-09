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
