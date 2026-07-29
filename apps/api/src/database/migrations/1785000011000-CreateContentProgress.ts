import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates `content_progress`, narrowed per sprint2-plan.md §2.5: only the
 * `video` and `lesson` item types are wired this sprint, so `quiz_id` and
 * `homework_id` are omitted entirely (not just left null) and the CHECK
 * constraint only allows the two narrowed types. Sprint 3 adds those two
 * columns and widens the CHECK — see `docs/api/sprint2-lessons.md`.
 *
 * The `content_progress_item_type` enum itself still declares all four
 * schemaV2.sql values (`video`, `quiz`, `homework`, `lesson`): adding an
 * enum value later is the awkward migration (no transactional
 * `ALTER TYPE ... ADD VALUE` before Postgres 12, and even after, it can't
 * run in the same transaction as its first use), while adding a nullable
 * column and loosening a CHECK is routine. Declaring the full enum now and
 * narrowing only the CHECK avoids that awkward migration later.
 *
 * PREREQUISITE: `users`, `courses`, `lessons`, and this sprint's `videos`
 * (1785000010000) must already exist.
 */
export class CreateContentProgress1785000011000
  implements MigrationInterface
{
  name = 'CreateContentProgress1785000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "content_progress_status" AS ENUM ('not_started', 'in_progress', 'completed');
    `);

    await queryRunner.query(`
      CREATE TYPE "content_progress_item_type" AS ENUM ('video', 'quiz', 'homework', 'lesson');
    `);

    await queryRunner.query(`
      CREATE TABLE "content_progress" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "item_type" content_progress_item_type NOT NULL,
        "video_id" UUID REFERENCES "videos"("id") ON DELETE CASCADE,
        "lesson_id" UUID REFERENCES "lessons"("id") ON DELETE CASCADE,
        "status" content_progress_status NOT NULL DEFAULT 'not_started',
        "progress_percentage" NUMERIC(5,2) DEFAULT 0,
        "last_video_position" INTEGER,
        "completed_at" TIMESTAMPTZ,
        "score" NUMERIC(6,2),
        CONSTRAINT "chk_content_progress_single_item" CHECK (
          ("item_type" = 'video'  AND "video_id"  IS NOT NULL AND "lesson_id" IS NULL) OR
          ("item_type" = 'lesson' AND "lesson_id" IS NOT NULL AND "video_id" IS NULL)
        ),
        CONSTRAINT "uq_content_progress_student_item" UNIQUE ("student_id", "item_type", "video_id", "lesson_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_progress_student_id" ON "content_progress" ("student_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_progress_course_id" ON "content_progress" ("course_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_progress_video_id" ON "content_progress" ("video_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "content_progress";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_progress_item_type";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_progress_status";`);
  }
}
