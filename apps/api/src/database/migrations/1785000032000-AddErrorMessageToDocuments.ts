import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `schemaV2.sql` has no failure-reason column on `documents`. Sprint 2's
 * endpoint contract (sprint2-plan.md §8, `GET .../documents`) requires
 * one so the teacher sees why processing failed, so this is a deviation
 * from the base schema, applied additively rather than editing the
 * already-merged `1785000030000-CreateFilesAndDocuments` migration.
 */
export class AddErrorMessageToDocuments1785000032000 implements MigrationInterface {
  name = 'AddErrorMessageToDocuments1785000032000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents" ADD COLUMN "error_message" TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents" DROP COLUMN IF EXISTS "error_message";
    `);
  }
}
