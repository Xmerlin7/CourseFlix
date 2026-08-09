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
 */
export class AddManagedByTeacherIdAndSingleTeacherConstraint1785000091000
  implements MigrationInterface
{
  name = 'AddManagedByTeacherIdAndSingleTeacherConstraint1785000091000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "managed_by_teacher_id" uuid REFERENCES "users"("id");
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "CHK_users_assistant_has_teacher" CHECK (
        (role = 'assistant' AND managed_by_teacher_id IS NOT NULL)
        OR (role <> 'assistant' AND managed_by_teacher_id IS NULL)
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "ux_users_single_teacher"
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
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "managed_by_teacher_id";`,
    );
  }
}
