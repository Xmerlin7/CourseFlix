import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `videos` table per schemaV2.sql:297.
 *
 * `videos` is made authoritative for playback, progress, and attendance
 * this sprint (CF-US-007) even though Sprint 1 put `video_url` directly on
 * `lessons`. `lessons.video_url` is left in place, unused — see
 * `docs/api/sprint2-lessons.md` for the full reasoning. Removing it is
 * Sprint 3 work, not this migration's concern.
 *
 * PREREQUISITE: `courses`, `sections`, `lessons` must already exist
 * (referenced via FK). Runs inside Albraa's reserved timestamp block
 * (1785000010000-1785000019999, sprint2-plan.md §2.5).
 */
export class CreateVideos1785000010000 implements MigrationInterface {
  name = 'CreateVideos1785000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "video_type" AS ENUM ('recorded', 'live');
    `);

    await queryRunner.query(`
      CREATE TYPE "video_status" AS ENUM ('scheduled', 'live', 'ended', 'recorded');
    `);

    await queryRunner.query(`
      CREATE TABLE "videos" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "section_id" UUID REFERENCES "sections"("id") ON DELETE SET NULL,
        "lesson_id" UUID REFERENCES "lessons"("id") ON DELETE SET NULL,
        "title" TEXT NOT NULL,
        "video_url" TEXT NOT NULL,
        "type" video_type NOT NULL,
        "duration_seconds" INTEGER,
        "status" video_status NOT NULL DEFAULT 'scheduled',
        "scheduled_at" TIMESTAMPTZ,
        "min_attendance_percentage" NUMERIC(5,2) NOT NULL DEFAULT 80.00,
        "deleted_at" TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_videos_course_id" ON "videos" ("course_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_videos_lesson_id" ON "videos" ("lesson_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "videos";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "video_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "video_type";`);
  }
}
