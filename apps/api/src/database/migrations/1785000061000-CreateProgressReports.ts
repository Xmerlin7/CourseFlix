import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mirrors the `progress_reports` table in `schemaV2.sql` (lines
 * ~506-516), with one deviation: `related_quiz_id` has no enforced FK
 * to `quizzes(id)`. `quizzes` has entities but no migration yet (see
 * `1785000011000-CreateContentProgress.ts`'s identical `quiz_id`
 * narrowing for the same reason) — an enforced FK here would break
 * `migration:run` against a database that hasn't had `synchronize: true`
 * create `quizzes` first.
 *
 * `intervention_id` is a Sprint 3 addition beyond `schemaV2.sql`, back-
 * referencing the intervention this report belongs to (see
 * `1785000062000-CreateInterventions.ts`), so report/notification/log
 * all reconcile to one intervention.
 */
export class CreateProgressReports1785000061000 implements MigrationInterface {
  name = 'CreateProgressReports1785000061000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "progress_reports" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "teacher_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "flagged_concept" TEXT NOT NULL,
        "related_quiz_id" UUID,
        "teacher_notified" BOOLEAN NOT NULL DEFAULT FALSE,
        "email_sent_at" TIMESTAMPTZ,
        "intervention_id" UUID,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_progress_reports_student_course" ON "progress_reports" ("student_id", "course_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_progress_reports_teacher" ON "progress_reports" ("teacher_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "progress_reports";`);
  }
}
