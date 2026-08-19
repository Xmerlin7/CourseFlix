import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The multi-agent lesson pipeline: a teacher adding a lesson can hand it
 * to a crew of agents instead of the plain create-and-forget path.
 *
 * Five tables, each with a distinct job:
 *
 *  - `teacher_agent_settings` — one row per teacher, the knobs that
 *    decide *which* agents run and how they behave. `transcript`,
 *    `reviewer` and `indexer` have no enable flag on purpose: they are
 *    what makes the lesson askable by students, which is the one
 *    guarantee the pipeline always keeps.
 *  - `lesson_agent_runs` — one row per pipeline execution, holding a
 *    `config` snapshot so a settings change mid-run (or months later)
 *    can never retroactively change what a finished run claimed to do.
 *  - `lesson_agent_steps` — one row per agent per run. `status` tracks
 *    the machine's progress, `review_status` tracks the teacher's — they
 *    move independently, which is why they are separate columns rather
 *    than one merged enum.
 *  - `lesson_agent_events` — the append-only narrative the teacher
 *    watches ("المُفرِّغ سلّم النص للمُفهرِس"). Kept apart from steps
 *    because a step is re-runnable and mutable while its history is not.
 *  - `lesson_agent_step_feedback` — teacher notes that drive a single
 *    step's re-run, same append-only shape as
 *    `quiz_generation_feedback`.
 *
 * Defensive (IF NOT EXISTS / DO-block) in the same style as
 * `1785000081000-CreateQuizGenerationRequests.ts`. Note that the older
 * migrations justify that style with "the app runs with
 * `synchronize: true`" — that is no longer true (`app.module.ts` sets
 * `synchronize: false`), so nothing auto-creates these tables and this
 * migration is the only thing that does. The guards are kept anyway so a
 * partially-applied run can be re-run safely, which is the reason that
 * actually still holds.
 */
export class CreateLessonAgentPipeline1786613700000 implements MigrationInterface {
  name = 'CreateLessonAgentPipeline1786613700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createEnums(queryRunner);
    await this.createSettingsTable(queryRunner);
    await this.createRunsTable(queryRunner);
    await this.createStepsTable(queryRunner);
    await this.createEventsTable(queryRunner);
    await this.createFeedbackTable(queryRunner);
    await this.addDocumentDraftFlag(queryRunner);
  }

  /**
   * The handout agent writes a real `documents` row (so the PDF is a
   * genuine, downloadable file and its chunks flow through the existing
   * ingestion contract), but that file must not reach students before
   * the teacher has approved it.
   *
   * `is_agent_draft` is that gate on the file-listing side; the matching
   * gate on the retrieval side is `document_chunks.is_active`, which the
   * handout agent leaves `false` until publish — `RetrievalService`
   * drops any Chroma hit whose Postgres chunk isn't active, so an
   * unapproved handout can't leak through the tutor either.
   *
   * Defaults to `false`, so every document that predates this pipeline
   * — and every ordinary teacher upload after it — is visible exactly
   * as before.
   */
  private async addDocumentDraftFlag(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn(
      'documents',
      'is_agent_draft',
    );
    if (!hasColumn) {
      await queryRunner.query(`
        ALTER TABLE "documents"
        ADD COLUMN "is_agent_draft" BOOLEAN NOT NULL DEFAULT false;
      `);
    }
  }

  private async createEnums(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_agent_run_status') THEN
          CREATE TYPE "lesson_agent_run_status" AS ENUM (
            'queued', 'running', 'pending_review', 'completed', 'failed'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_agent_key') THEN
          CREATE TYPE "lesson_agent_key" AS ENUM (
            'transcript', 'reviewer', 'indexer', 'handout', 'quizmaster'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_agent_step_status') THEN
          CREATE TYPE "lesson_agent_step_status" AS ENUM (
            'pending', 'running', 'completed', 'failed', 'skipped'
          );
        END IF;
      END
      $$;
    `);

    // `not_required` covers the three mandatory agents, whose output the
    // teacher never gates — there is nothing to approve about "the video
    // was transcribed", only about what the writer and quizmaster wrote.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_agent_review_status') THEN
          CREATE TYPE "lesson_agent_review_status" AS ENUM (
            'not_required', 'pending', 'approved', 'rejected', 'revision_requested'
          );
        END IF;
      END
      $$;
    `);
  }

  private async createSettingsTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "teacher_agent_settings" (
        "teacher_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "handout_enabled" BOOLEAN NOT NULL DEFAULT true,
        "handout_page_count" INTEGER NOT NULL DEFAULT 4,
        "handout_tone" TEXT NOT NULL DEFAULT 'simple',
        "handout_include_examples" BOOLEAN NOT NULL DEFAULT true,
        "handout_include_key_terms" BOOLEAN NOT NULL DEFAULT true,
        "handout_include_summary" BOOLEAN NOT NULL DEFAULT true,
        "quiz_enabled" BOOLEAN NOT NULL DEFAULT true,
        "quiz_difficulty" TEXT NOT NULL DEFAULT 'medium',
        "quiz_question_count" INTEGER NOT NULL DEFAULT 8,
        "quiz_types" JSONB NOT NULL DEFAULT '["mcq","true_false"]'::jsonb,
        "quiz_due_in_days" INTEGER NOT NULL DEFAULT 7,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }

  private async createRunsTable(queryRunner: QueryRunner): Promise<void> {
    // `video_id` is nullable because the run row is created the moment
    // the teacher submits, before `CoursesService` has necessarily
    // finished syncing the lesson's `videos` row.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lesson_agent_runs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "lesson_id" UUID NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "video_id" UUID REFERENCES "videos"("id") ON DELETE SET NULL,
        "teacher_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "status" lesson_agent_run_status NOT NULL DEFAULT 'queued',
        "config" JSONB NOT NULL,
        "credits_charged" INTEGER NOT NULL DEFAULT 0,
        "error_message" TEXT,
        "started_at" TIMESTAMPTZ,
        "finished_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_agent_runs_lesson_id" ON "lesson_agent_runs" ("lesson_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_agent_runs_course_id" ON "lesson_agent_runs" ("course_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_agent_runs_teacher_id" ON "lesson_agent_runs" ("teacher_id");
    `);
  }

  private async createStepsTable(queryRunner: QueryRunner): Promise<void> {
    // UNIQUE (run_id, agent_key): re-running a step after teacher
    // feedback bumps `attempt` on the same row rather than appending a
    // second one, so the timeline keeps exactly one card per agent.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lesson_agent_steps" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "run_id" UUID NOT NULL REFERENCES "lesson_agent_runs"("id") ON DELETE CASCADE,
        "agent_key" lesson_agent_key NOT NULL,
        "order_index" INTEGER NOT NULL,
        "status" lesson_agent_step_status NOT NULL DEFAULT 'pending',
        "review_status" lesson_agent_review_status NOT NULL DEFAULT 'not_required',
        "progress" INTEGER NOT NULL DEFAULT 0,
        "headline" TEXT,
        "output" JSONB,
        "error_message" TEXT,
        "attempt" INTEGER NOT NULL DEFAULT 1,
        "started_at" TIMESTAMPTZ,
        "finished_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_lesson_agent_steps_run_agent" UNIQUE ("run_id", "agent_key")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_agent_steps_run_id" ON "lesson_agent_steps" ("run_id");
    `);
  }

  private async createEventsTable(queryRunner: QueryRunner): Promise<void> {
    // `type` is plain TEXT, not an enum: the event vocabulary grows every
    // time an agent learns to narrate something new, and a migration per
    // new sentence is not a trade worth making for a display-only log.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lesson_agent_events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "run_id" UUID NOT NULL REFERENCES "lesson_agent_runs"("id") ON DELETE CASCADE,
        "step_id" UUID REFERENCES "lesson_agent_steps"("id") ON DELETE CASCADE,
        "agent_key" lesson_agent_key,
        "to_agent_key" lesson_agent_key,
        "type" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // The teacher's timeline reads strictly "this run, oldest first", so
    // the index carries the sort column rather than just `run_id`.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_agent_events_run_created"
        ON "lesson_agent_events" ("run_id", "created_at");
    `);
  }

  private async createFeedbackTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lesson_agent_step_feedback" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "step_id" UUID NOT NULL REFERENCES "lesson_agent_steps"("id") ON DELETE CASCADE,
        "message" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_agent_step_feedback_step_id"
        ON "lesson_agent_step_feedback" ("step_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN IF EXISTS "is_agent_draft";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "lesson_agent_step_feedback";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_agent_events";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_agent_steps";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_agent_runs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teacher_agent_settings";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "lesson_agent_review_status";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_agent_step_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_agent_key";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_agent_run_status";`);
  }
}
