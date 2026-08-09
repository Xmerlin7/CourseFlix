import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Single-teacher platform pivot. Adds `assistant` as a fourth value of the
 * existing `user_role` enum (see 1785000072000-AddAdminRole for why this
 * has to be a standalone migration — `ALTER TYPE ... ADD VALUE` cannot run
 * in the same transaction as a statement that *reads* the new value).
 *
 * Also adds `managed_by_teacher_id`, which only assistants populate (an
 * assistant is scoped to exactly one teacher's courses/students), and a
 * partial unique index that caps the platform at one active `teacher`
 * account — the product no longer supports more than one.
 */
export class AddAssistantRole1785000090000 implements MigrationInterface {
  name = 'AddAssistantRole1785000090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'assistant';
    `);
  }

  public async down(): Promise<void> {
    throw new Error(
      'AddAssistantRole1785000090000 is not reversible: Postgres cannot drop a ' +
        'single enum value without rebuilding the "user_role" type and every ' +
        'column/index that depends on it. Restore from a pre-migration backup instead.',
    );
  }
}
