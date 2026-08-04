import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sprint 3 addition (sprint3-plan.md §1/§4 H-1, CF-US-014) — not in
 * `schemaV2.sql`, which has `progress_reports`/`notifications`/
 * `agent_logs` but no umbrella record tying a rule trigger to all
 * three plus the mini quiz. `interventions` is that umbrella;
 * `intervention_evidence` holds short, deterministic evidence
 * descriptions (never raw chat/answer text — see H-3's redaction rule,
 * applied here defensively even though this table isn't teacher-read
 * through the redacted agent-logs API).
 *
 * `dedup_key` + the partial unique index is the "duplicate signals in
 * the same rule window must not create duplicate active interventions"
 * guard: a second signal for the same student/course/rule/concept while
 * the first is still `active` hits a unique-violation on insert, which
 * `InterventionsService.evaluateSignal` catches and treats as a no-op.
 *
 * `mini_quiz_id` has no enforced FK to `quizzes(id)` for the same
 * reason as `progress_reports.related_quiz_id` (see that migration's
 * docblock) — it stays null until Nabile's N-1 populates it.
 */
export class CreateInterventions1785000062000 implements MigrationInterface {
  name = 'CreateInterventions1785000062000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "intervention_rule_key" AS ENUM (
        'low_quiz_score', 'explicit_confusion_phrase', 'repeated_concept_question'
      );
    `);
    await queryRunner.query(`
      CREATE TYPE "intervention_status" AS ENUM ('active', 'resolved');
    `);
    await queryRunner.query(`
      CREATE TABLE "interventions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "teacher_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "rule_key" intervention_rule_key NOT NULL,
        "rule_version" INTEGER NOT NULL,
        "weak_concept" TEXT NOT NULL,
        "status" intervention_status NOT NULL DEFAULT 'active',
        "dedup_key" TEXT NOT NULL,
        "mini_quiz_id" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "resolved_at" TIMESTAMPTZ
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_interventions_active_dedup" ON "interventions" ("dedup_key") WHERE "status" = 'active';
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_interventions_student" ON "interventions" ("student_id", "course_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_interventions_teacher" ON "interventions" ("teacher_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "progress_reports"
        ADD CONSTRAINT "fk_progress_reports_intervention"
        FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE "intervention_evidence" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "intervention_id" UUID NOT NULL REFERENCES "interventions"("id") ON DELETE CASCADE,
        "evidence_type" TEXT NOT NULL,
        "evidence_ref_id" UUID,
        "detail" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_intervention_evidence_intervention" ON "intervention_evidence" ("intervention_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "intervention_evidence";`);
    await queryRunner.query(`
      ALTER TABLE "progress_reports" DROP CONSTRAINT IF EXISTS "fk_progress_reports_intervention";
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "interventions";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "intervention_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "intervention_rule_key";`);
  }
}
