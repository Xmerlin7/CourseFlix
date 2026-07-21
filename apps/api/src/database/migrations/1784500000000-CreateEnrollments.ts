import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `enrollments` table per `schemaV2.sql`.
 *
 * PREREQUISITE: `users` and `courses` tables must already exist (this
 * migration references both via FK). Confirm merge order with the team
 * before this lands — it will fail on a fresh DB otherwise.
 */
export class CreateEnrollments1784500000000 implements MigrationInterface {
  name = 'CreateEnrollments1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "enrollment_status" AS ENUM ('active', 'suspended', 'completed');
    `);

    await queryRunner.query(`
      CREATE TYPE "status_changed_by_type" AS ENUM ('system_agent', 'teacher');
    `);

    await queryRunner.query(`
      CREATE TABLE "enrollments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "status" enrollment_status NOT NULL DEFAULT 'active',
        "suspended_reason" TEXT,
        "suspended_at" TIMESTAMPTZ,
        "suspended_by_submission_id" UUID,
        "status_changed_by" status_changed_by_type,
        "override_active" BOOLEAN NOT NULL DEFAULT FALSE,
        "progress_percentage" NUMERIC(5,2),
        "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "uq_enrollments_student_course" UNIQUE ("student_id", "course_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_enrollments_student_id" ON "enrollments" ("student_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_enrollments_course_id" ON "enrollments" ("course_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "enrollments";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "status_changed_by_type";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enrollment_status";`);
  }
}