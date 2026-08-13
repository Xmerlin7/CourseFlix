import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Predates the repo's defensive-migration convention (see e.g.
 * AddManagedByTeacherIdAndSingleTeacherConstraint, AddEmailVerificationAndOtp),
 * so it originally used unguarded DROP/CREATE. With `synchronize: true` in
 * app.module.ts, a dev box that already booted the API with the quiz/video-
 * transcript entities loaded can have this entire schema in place — and the
 * old default-named FKs already dropped — before this migration ever runs.
 * Guarded the same way as the later migrations so it's a no-op wherever
 * synchronize got there first.
 */
export class CreateQuizzes1785000075000 implements MigrationInterface {
  name = 'CreateQuizzes1785000075000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_conversation_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_conversations" DROP CONSTRAINT IF EXISTS "chat_conversations_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_conversations" DROP CONSTRAINT IF EXISTS "chat_conversations_student_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "FK_sessions_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message_source_chunks" DROP CONSTRAINT IF EXISTS "chat_message_source_chunks_chunk_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message_source_chunks" DROP CONSTRAINT IF EXISTS "chat_message_source_chunks_message_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" DROP CONSTRAINT IF EXISTS "content_progress_lesson_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" DROP CONSTRAINT IF EXISTS "content_progress_video_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" DROP CONSTRAINT IF EXISTS "content_progress_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" DROP CONSTRAINT IF EXISTS "content_progress_student_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_lesson_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_section_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_video_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_student_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" DROP CONSTRAINT IF EXISTS "document_chunks_document_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_reports" DROP CONSTRAINT IF EXISTS "fk_progress_reports_intervention"`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_reports" DROP CONSTRAINT IF EXISTS "progress_reports_teacher_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_reports" DROP CONSTRAINT IF EXISTS "progress_reports_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_reports" DROP CONSTRAINT IF EXISTS "progress_reports_student_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interventions" DROP CONSTRAINT IF EXISTS "interventions_teacher_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interventions" DROP CONSTRAINT IF EXISTS "interventions_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interventions" DROP CONSTRAINT IF EXISTS "interventions_student_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_mini_quizzes" DROP CONSTRAINT IF EXISTS "intervention_mini_quizzes_student_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_mini_quizzes" DROP CONSTRAINT IF EXISTS "intervention_mini_quizzes_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_mini_quizzes" DROP CONSTRAINT IF EXISTS "intervention_mini_quizzes_intervention_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_mini_quiz_questions" DROP CONSTRAINT IF EXISTS "intervention_mini_quiz_questions_mini_quiz_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_evidence" DROP CONSTRAINT IF EXISTS "intervention_evidence_intervention_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_student_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_uploaded_by_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_file_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_uploaded_by_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_lesson_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_section_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_teacher_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_section_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sections" DROP CONSTRAINT IF EXISTS "sections_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_order_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_student_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_course_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_order_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agent_logs" DROP CONSTRAINT IF EXISTS "agent_logs_course_id_fkey"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_chat_messages_conversation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."uq_chat_conversations_active_student_course"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_sessions_token_hash"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_sessions_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_chat_message_source_chunks_message_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_notifications_user_unread"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_content_progress_course_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_content_progress_student_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_content_progress_video_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_videos_course_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_videos_lesson_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_attendance_student_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_document_chunks_document_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_document_chunks_vector_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_ai_jobs_target_entity_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_ai_jobs_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_progress_reports_student_course"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."uq_interventions_active_dedup"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_interventions_student"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_enrollments_student_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_enrollments_course_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_courses_teacher_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_lessons_section_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_lessons_course_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_sections_course_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."uq_payments_order_attempt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."uq_orders_idempotency_key"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_orders_student"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_orders_paid_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_order_items_order"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_order_items_course"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_agent_logs_course_executed"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_agent_logs_agent_type_executed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" DROP CONSTRAINT IF EXISTS "chk_content_progress_single_item"`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" DROP CONSTRAINT IF EXISTS "uq_content_progress_student_item"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "uq_attendance_student_video"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "uq_enrollments_student_course"`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."video_transcript_provider" AS ENUM('bunny', 'youtube', 'local'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "video_transcripts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "video_id" uuid NOT NULL, "course_id" uuid NOT NULL, "section_id" uuid, "lesson_id" uuid, "provider" "public"."video_transcript_provider" NOT NULL, "processing_status" "public"."processing_status_type" NOT NULL DEFAULT 'pending', "error_message" text, "version" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b29781f452c24d675491f0b8ffb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_48771564d7f04b756f24357c8d" ON "video_transcripts" ("video_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a93a8ccb21cda2a529b75ff887" ON "video_transcripts" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0e9e1cfd84141bda84f91b85e9" ON "video_transcripts" ("section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_094f0320906bc2ddce38e70af3" ON "video_transcripts" ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "video_chunks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "video_transcript_id" uuid NOT NULL, "chunk_index" integer NOT NULL, "text_preview" text, "vector_id" text NOT NULL, "start_seconds" integer, "end_seconds" integer, "token_count" integer, "is_active" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_77746b8a34b7c4a95d176241153" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7870bcc82838dd054051fec3ed" ON "video_chunks" ("video_transcript_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e57ec87e1e4a2914988b33ee20" ON "video_chunks" ("vector_id") `,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."quiz_generation_type" AS ENUM('manual', 'rag_generated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."quiz_status" AS ENUM('draft', 'pending_review', 'published', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "quizzes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid NOT NULL, "section_id" uuid, "lesson_id" uuid, "created_by" uuid, "generation_type" "public"."quiz_generation_type" NOT NULL DEFAULT 'manual', "title" text NOT NULL, "status" "public"."quiz_status" NOT NULL DEFAULT 'published', "due_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e460dcb813c2cc28c93c95f250" ON "quizzes" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2cf4e4b5b533af8dc6b38d4fa9" ON "quizzes" ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "quiz_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quiz_id" uuid NOT NULL, "student_id" uuid NOT NULL, "score" numeric(6,2) NOT NULL, "quiz_version" integer NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e3fd96789b070c28b7aeeb2c32c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e289227402e4d3185a68348a14" ON "quiz_submissions" ("quiz_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "quiz_submission_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submission_id" uuid NOT NULL, "question_id" uuid NOT NULL, "selected_answer" text, "is_correct" boolean, CONSTRAINT "PK_299d43980bd5eef5ed099bf7586" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid NOT NULL, "type" "public"."question_type" NOT NULL, "text" text NOT NULL, "options" text array, "correct_answer" text NOT NULL, "difficulty" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_921085ed8cad9bd8299dc603ef" ON "questions" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "quiz_questions" ("quiz_id" uuid NOT NULL, "question_id" uuid NOT NULL, "order_index" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_31158352e5946bb89a51a56d8ab" PRIMARY KEY ("quiz_id", "question_id"))`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."quiz_generation_scope_type" AS ENUM('lesson', 'section', 'course'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."quiz_generation_request_status" AS ENUM('queued', 'processing', 'pending_review', 'accepted', 'rejected', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "quiz_generation_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid NOT NULL, "scope_type" "public"."quiz_generation_scope_type" NOT NULL, "scope_id" uuid NOT NULL, "teacher_id" uuid NOT NULL, "quiz_id" uuid, "status" "public"."quiz_generation_request_status" NOT NULL DEFAULT 'queued', "difficulty" text NOT NULL, "question_spec" jsonb NOT NULL, "due_at" TIMESTAMP WITH TIME ZONE NOT NULL, "attempt_number" integer NOT NULL DEFAULT '1', "error_message" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_de43851bba4315d15bbf0923d59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a9e7d81b7f190890a02201679c" ON "quiz_generation_requests" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e76b1f419008c66b5392a08c72" ON "quiz_generation_requests" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_c5bbf05e8bac25fa3a9830c52b" ON "quiz_generation_requests" ("quiz_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "quiz_generation_feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_id" uuid NOT NULL, "message" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_13e6b5b052ec8215b3aad445748" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f662f921a31556d001fb628c2f" ON "quiz_generation_feedback" ("request_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "managed_by_teacher_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings_theme" text NOT NULL DEFAULT 'system'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings_notification_preferences" jsonb NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paymob_order_id" text`,
    );

    const userRoleHasAssistant = (await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'user_role' AND e.enumlabel = 'assistant'
            ) AS exists;
        `)) as Array<{ exists: boolean }>;
    if (!userRoleHasAssistant[0].exists) {
      await queryRunner.query(
        `ALTER TYPE "public"."user_role" RENAME TO "user_role_old"`,
      );
      await queryRunner.query(
        `CREATE TYPE "public"."user_role" AS ENUM('student', 'teacher', 'admin', 'assistant')`,
      );
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role" USING "role"::"text"::"public"."user_role"`,
      );
      await queryRunner.query(`DROP TYPE "public"."user_role_old"`);
    }

    await queryRunner.query(
      `ALTER TABLE "videos" ALTER COLUMN "min_attendance_percentage" SET DEFAULT '80'`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ALTER COLUMN "last_updated_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" DROP CONSTRAINT IF EXISTS "document_chunks_vector_id_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "uq_courses_slug"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3d623662d4ee1219b23cf61e64" ON "chat_messages" ("conversation_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_chat_conversations_student_course" ON "chat_conversations" ("student_id", "course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_abaa9e068cdd390bc5210f7988" ON "sessions" ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_1ea60529292e36c35a2f6b4285" ON "chat_message_source_chunks" ("message_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8fab9074888c23494ea2dc2862" ON "content_progress" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_7177f73cb1a9efff9e66f10a90" ON "content_progress" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_902fa2101bc85289a6ffe7bd1e" ON "content_progress" ("video_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8f6e233979bc8acf49166c986f" ON "videos" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d97c673372cd82feba22a5895b" ON "videos" ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6200532f3ef99f639a27bdcae7" ON "attendance" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_progress_reports_student_course" ON "progress_reports" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_interventions_student" ON "interventions" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_enrollments_student_course" ON "enrollments" ("student_id", "course_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_courses_slug" ON "courses" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3c4e299cf8ed04093935e2e22f" ON "lessons" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ac15ec54cb5ac3ffdf79508bc9" ON "lessons" ("order_index") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_9f81b41a753c775a8a7022d9e6" ON "sections" ("order_index") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_agent_logs_agent_type_executed" ON "agent_logs" ("agent_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_agent_logs_course_executed" ON "agent_logs" ("course_id") `,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "quiz_questions" ADD CONSTRAINT "FK_14c6d2b8f5be0bdb406a3895bb4" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "courses" ADD CONSTRAINT "FK_fad76a730ee7f68d0a59652fb12" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "lessons" ADD CONSTRAINT "FK_19261e484ffd22b40ea596ece4d" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "sections" ADD CONSTRAINT "FK_53ccbd6e2fa20dac9062f4f4c36" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sections" DROP CONSTRAINT "FK_53ccbd6e2fa20dac9062f4f4c36"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT "FK_19261e484ffd22b40ea596ece4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_fad76a730ee7f68d0a59652fb12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP CONSTRAINT "FK_14c6d2b8f5be0bdb406a3895bb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_agent_logs_course_executed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_agent_logs_agent_type_executed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f81b41a753c775a8a7022d9e6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac15ec54cb5ac3ffdf79508bc9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3c4e299cf8ed04093935e2e22f"`,
    );
    await queryRunner.query(`DROP INDEX "public"."uq_courses_slug"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_enrollments_student_course"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_interventions_student"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_progress_reports_student_course"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6200532f3ef99f639a27bdcae7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d97c673372cd82feba22a5895b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8f6e233979bc8acf49166c986f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_902fa2101bc85289a6ffe7bd1e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7177f73cb1a9efff9e66f10a90"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8fab9074888c23494ea2dc2862"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1ea60529292e36c35a2f6b4285"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_abaa9e068cdd390bc5210f7988"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_chat_conversations_student_course"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d623662d4ee1219b23cf61e64"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "uq_courses_slug" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_vector_id_key" UNIQUE ("vector_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ALTER COLUMN "last_updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ALTER COLUMN "min_attendance_percentage" SET DEFAULT 80.00`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_old" AS ENUM('student', 'teacher', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_old" USING "role"::"text"::"public"."user_role_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_old" RENAME TO "user_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "paymob_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "settings_notification_preferences"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "settings_theme"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "managed_by_teacher_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f662f921a31556d001fb628c2f"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_generation_feedback"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c5bbf05e8bac25fa3a9830c52b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e76b1f419008c66b5392a08c72"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a9e7d81b7f190890a02201679c"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_generation_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."quiz_generation_request_status"`,
    );
    await queryRunner.query(`DROP TYPE "public"."quiz_generation_scope_type"`);
    await queryRunner.query(`DROP TABLE "quiz_questions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_921085ed8cad9bd8299dc603ef"`,
    );
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TABLE "quiz_submission_answers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e289227402e4d3185a68348a14"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_submissions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2cf4e4b5b533af8dc6b38d4fa9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e460dcb813c2cc28c93c95f250"`,
    );
    await queryRunner.query(`DROP TABLE "quizzes"`);
    await queryRunner.query(`DROP TYPE "public"."quiz_status"`);
    await queryRunner.query(`DROP TYPE "public"."quiz_generation_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e57ec87e1e4a2914988b33ee20"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7870bcc82838dd054051fec3ed"`,
    );
    await queryRunner.query(`DROP TABLE "video_chunks"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_094f0320906bc2ddce38e70af3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0e9e1cfd84141bda84f91b85e9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a93a8ccb21cda2a529b75ff887"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48771564d7f04b756f24357c8d"`,
    );
    await queryRunner.query(`DROP TABLE "video_transcripts"`);
    await queryRunner.query(`DROP TYPE "public"."video_transcript_provider"`);
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "uq_enrollments_student_course" UNIQUE ("student_id", "course_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "uq_attendance_student_video" UNIQUE ("student_id", "video_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" ADD CONSTRAINT "uq_content_progress_student_item" UNIQUE ("student_id", "item_type", "video_id", "lesson_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" ADD CONSTRAINT "chk_content_progress_single_item" CHECK ((((item_type = 'video'::content_progress_item_type) AND (video_id IS NOT NULL) AND (lesson_id IS NULL)) OR ((item_type = 'lesson'::content_progress_item_type) AND (lesson_id IS NOT NULL) AND (video_id IS NULL))))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_agent_logs_agent_type_executed" ON "agent_logs" ("agent_type", "executed_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_agent_logs_course_executed" ON "agent_logs" ("course_id", "executed_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_course" ON "order_items" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_paid_at" ON "orders" ("paid_at") WHERE (status = 'paid'::order_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_student" ON "orders" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_orders_idempotency_key" ON "orders" ("idempotency_key") WHERE (idempotency_key IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_payments_order_attempt" ON "payments" ("order_id", "attempt_no") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sections_course_id" ON "sections" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lessons_course_id" ON "lessons" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lessons_section_id" ON "lessons" ("section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_courses_teacher_id" ON "courses" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_enrollments_course_id" ON "enrollments" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_enrollments_student_id" ON "enrollments" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_interventions_student" ON "interventions" ("student_id", "course_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_interventions_active_dedup" ON "interventions" ("dedup_key") WHERE (status = 'active'::intervention_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_progress_reports_student_course" ON "progress_reports" ("student_id", "course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ai_jobs_status" ON "ai_jobs" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ai_jobs_target_entity_id" ON "ai_jobs" ("target_entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_document_chunks_vector_id" ON "document_chunks" ("vector_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_document_chunks_document_id" ON "document_chunks" ("document_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attendance_student_id" ON "attendance" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_videos_lesson_id" ON "videos" ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_videos_course_id" ON "videos" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_content_progress_video_id" ON "content_progress" ("video_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_content_progress_student_id" ON "content_progress" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_content_progress_course_id" ON "content_progress" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_unread" ON "notifications" ("user_id", "is_read") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_message_source_chunks_message_id" ON "chat_message_source_chunks" ("message_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_token_hash" ON "sessions" ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_chat_conversations_active_student_course" ON "chat_conversations" ("student_id", "course_id") WHERE ((status = 'active'::chat_conversation_status) AND (deleted_at IS NULL))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_messages_conversation_id" ON "chat_messages" ("conversation_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "order_items_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "orders_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sections" ADD CONSTRAINT "sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "lessons_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "documents_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "documents_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "documents_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_evidence" ADD CONSTRAINT "intervention_evidence_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_mini_quiz_questions" ADD CONSTRAINT "intervention_mini_quiz_questions_mini_quiz_id_fkey" FOREIGN KEY ("mini_quiz_id") REFERENCES "intervention_mini_quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_mini_quizzes" ADD CONSTRAINT "intervention_mini_quizzes_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_mini_quizzes" ADD CONSTRAINT "intervention_mini_quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "intervention_mini_quizzes" ADD CONSTRAINT "intervention_mini_quizzes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interventions" ADD CONSTRAINT "interventions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interventions" ADD CONSTRAINT "interventions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interventions" ADD CONSTRAINT "interventions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress_reports" ADD CONSTRAINT "fk_progress_reports_intervention" FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "attendance_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD CONSTRAINT "videos_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD CONSTRAINT "videos_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD CONSTRAINT "videos_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" ADD CONSTRAINT "content_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" ADD CONSTRAINT "content_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" ADD CONSTRAINT "content_progress_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_progress" ADD CONSTRAINT "content_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message_source_chunks" ADD CONSTRAINT "chat_message_source_chunks_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message_source_chunks" ADD CONSTRAINT "chat_message_source_chunks_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "document_chunks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
