import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Single-teacher platform pivot. Adds `assistant` as a fourth value of the
 * existing `user_role` enum (see 1785000072000-AddAdminRole for why this
 * has to be a standalone migration — Postgres refuses to *reference* a
 * newly added enum value until the transaction that added it commits, so
 * the ADD VALUE must be in a different transaction from any DDL that reads
 * `'assistant'` (error 55P04, "unsafe use of new value").
 *
 * The data-source runs migrations with `migrationsTransactionMode: 'each'`,
 * so each migration commits on its own — this one only adds the value, and
 * 1785000091000-AddManagedByTeacherIdAndSingleTeacherConstraint (which
 * references it in a CHECK constraint) runs in a later, committed
 * transaction.
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
