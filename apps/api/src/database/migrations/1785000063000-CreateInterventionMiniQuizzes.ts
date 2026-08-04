import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Nabile's N-1 addition (nabile-s3-plan.md §2.2) on top of the merged
 * interventions schema. `interventions.mini_quiz_id` exists (nullable)
 * since `1785000062000-CreateInterventions.ts` but stays null until this
 * table exists — `MiniQuizService.generateForIntervention` stamps it.
 *
 * The `question_type` enum is normally created by the runtime's
 * `synchronize: true` (the questions table has no dedicated migration),
 * so this migration recreates it defensively (DO block) rather than
 * assuming a fresh DB already has it. The two mini-quiz tables are the
 * only new schema here.
 */
export class CreateInterventionMiniQuizzes1785000063000 implements MigrationInterface {
  name = 'CreateInterventionMiniQuizzes1785000063000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
          CREATE TYPE "question_type" AS ENUM ('mcq', 'true_false');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TYPE "mini_quiz_status" AS ENUM ('active', 'completed');
    `);

    await queryRunner.query(`
      CREATE TABLE "intervention_mini_quizzes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "intervention_id" UUID NOT NULL REFERENCES "interventions"("id") ON DELETE CASCADE,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "weak_concept" TEXT NOT NULL,
        "status" mini_quiz_status NOT NULL DEFAULT 'active',
        "score" INTEGER,
        "total" INTEGER,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_mini_quiz_intervention" ON "intervention_mini_quizzes" ("intervention_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "intervention_mini_quiz_questions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "mini_quiz_id" UUID NOT NULL REFERENCES "intervention_mini_quizzes"("id") ON DELETE CASCADE,
        "text" TEXT NOT NULL,
        "type" question_type NOT NULL,
        "options" TEXT[],
        "correct_answer" TEXT NOT NULL,
        "order_index" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_mini_quiz_questions_quiz" ON "intervention_mini_quiz_questions" ("mini_quiz_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "intervention_mini_quiz_questions";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "intervention_mini_quizzes";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "mini_quiz_status";`);
  }
}
