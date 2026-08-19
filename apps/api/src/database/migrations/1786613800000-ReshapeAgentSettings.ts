import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Two teacher-facing reshapes of `teacher_agent_settings`, from using the
 * agent settings form for real:
 *
 * 1. **Per-type question counts.** `quiz_question_count` + `quiz_types`
 *    made the teacher pick a total and let the quizmaster split it across
 *    the enabled types. Teachers think in "5 MCQ and 3 true/false", not
 *    "8 questions, divided somehow" — and the split was invisible until
 *    the draft came back. Replaced by two explicit counts, which is also
 *    the shape the manual exam-generation form has always used.
 *
 * 2. **Detail level instead of tone.** `handout_tone`
 *    (simple/academic/exam_focused) asked about voice; what teachers
 *    actually want to control is how much the handout says. Replaced by
 *    `handout_detail_level` (concise/standard/deep).
 *
 * A separate migration rather than an edit to 1786613700000, which has
 * already been applied.
 */
export class ReshapeAgentSettings1786613800000 implements MigrationInterface {
  name = 'ReshapeAgentSettings1786613800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.splitQuestionCounts(queryRunner);
    await this.replaceToneWithDetailLevel(queryRunner);
  }

  private async splitQuestionCounts(queryRunner: QueryRunner): Promise<void> {
    const hasMcq = await queryRunner.hasColumn(
      'teacher_agent_settings',
      'quiz_mcq_count',
    );
    if (hasMcq) return;

    await queryRunner.query(`
      ALTER TABLE "teacher_agent_settings"
        ADD COLUMN "quiz_mcq_count" INTEGER NOT NULL DEFAULT 5,
        ADD COLUMN "quiz_true_false_count" INTEGER NOT NULL DEFAULT 3;
    `);

    // Backfill to whatever the old split would actually have produced, so
    // a teacher's next run keeps the breakdown they were already getting:
    // the total was divided evenly across the enabled types with the
    // remainder going to the earlier one (mcq).
    await queryRunner.query(`
      UPDATE "teacher_agent_settings"
         SET "quiz_mcq_count" = CASE
               WHEN "quiz_types" ? 'mcq' AND "quiz_types" ? 'true_false'
                 THEN CEIL("quiz_question_count"::numeric / 2)
               WHEN "quiz_types" ? 'mcq' THEN "quiz_question_count"
               ELSE 0
             END,
             "quiz_true_false_count" = CASE
               WHEN "quiz_types" ? 'mcq' AND "quiz_types" ? 'true_false'
                 THEN FLOOR("quiz_question_count"::numeric / 2)
               WHEN "quiz_types" ? 'true_false' THEN "quiz_question_count"
               ELSE 0
             END;
    `);

    await queryRunner.query(`
      ALTER TABLE "teacher_agent_settings"
        DROP COLUMN IF EXISTS "quiz_question_count",
        DROP COLUMN IF EXISTS "quiz_types";
    `);
  }

  private async replaceToneWithDetailLevel(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const hasDetailLevel = await queryRunner.hasColumn(
      'teacher_agent_settings',
      'handout_detail_level',
    );
    if (hasDetailLevel) return;

    await queryRunner.query(`
      ALTER TABLE "teacher_agent_settings"
        ADD COLUMN "handout_detail_level" TEXT NOT NULL DEFAULT 'standard';
    `);

    // No backfill mapping on purpose: tone and detail level are different
    // questions, and inventing a correspondence ("academic means deep")
    // would silently put words in the teacher's mouth. Everyone starts at
    // the default and re-picks if they care.
    await queryRunner.query(`
      ALTER TABLE "teacher_agent_settings" DROP COLUMN IF EXISTS "handout_tone";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teacher_agent_settings"
        ADD COLUMN IF NOT EXISTS "handout_tone" TEXT NOT NULL DEFAULT 'simple',
        ADD COLUMN IF NOT EXISTS "quiz_question_count" INTEGER NOT NULL DEFAULT 8,
        ADD COLUMN IF NOT EXISTS "quiz_types" JSONB NOT NULL DEFAULT '["mcq","true_false"]'::jsonb;
    `);

    // Recombine the two counts into the old total, and record which types
    // were actually asked for so the reverted split reproduces them.
    await queryRunner.query(`
      UPDATE "teacher_agent_settings"
         SET "quiz_question_count" = GREATEST(1, "quiz_mcq_count" + "quiz_true_false_count"),
             "quiz_types" = (
               CASE WHEN "quiz_mcq_count" > 0 THEN '["mcq"]'::jsonb ELSE '[]'::jsonb END
               ||
               CASE WHEN "quiz_true_false_count" > 0 THEN '["true_false"]'::jsonb ELSE '[]'::jsonb END
             );
    `);

    // An all-zero row would leave an empty type list, which the app treats
    // as invalid — fall back to the original default instead.
    await queryRunner.query(`
      UPDATE "teacher_agent_settings"
         SET "quiz_types" = '["mcq","true_false"]'::jsonb
       WHERE jsonb_array_length("quiz_types") = 0;
    `);

    await queryRunner.query(`
      ALTER TABLE "teacher_agent_settings"
        DROP COLUMN IF EXISTS "handout_detail_level",
        DROP COLUMN IF EXISTS "quiz_mcq_count",
        DROP COLUMN IF EXISTS "quiz_true_false_count";
    `);
  }
}
