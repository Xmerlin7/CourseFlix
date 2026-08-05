import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the Sprint 1 subset of `courses`, `sections`, and `lessons` from
 * `schemaV2.sql`, adapted per sprint1-plan.md's endpoint contract (see
 * CourseEntity docblock for the two authorized deviations: `slug` and
 * `grade_level` in place of `category`).
 *
 * PREREQUISITE: `users` must already exist (courses.teacher_id FK).
 * This migration must run BEFORE CreateEnrollments1784500000000, which
 * references `courses` via FK — hence the earlier timestamp.
 */
export class CreateCoursesSectionsLessons1760000000000 implements MigrationInterface {
  name = 'CreateCoursesSectionsLessons1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "course_status" AS ENUM ('draft', 'published', 'archived');
    `);

    await queryRunner.query(`
      CREATE TYPE "content_status" AS ENUM ('draft', 'published');
    `);

    await queryRunner.query(`
      CREATE TABLE "courses" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "teacher_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "cover_image_url" TEXT,
        "grade_level" TEXT,
        "status" course_status NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "uq_courses_slug" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_courses_teacher_id" ON "courses" ("teacher_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "sections" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "title" TEXT NOT NULL,
        "order_index" INTEGER NOT NULL,
        "status" content_status NOT NULL DEFAULT 'published',
        "deleted_at" TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sections_course_id" ON "sections" ("course_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "lessons" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "section_id" UUID NOT NULL REFERENCES "sections"("id") ON DELETE CASCADE,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "title" TEXT NOT NULL,
        "video_url" TEXT,
        "order_index" INTEGER NOT NULL,
        "status" content_status NOT NULL DEFAULT 'published',
        "deleted_at" TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_lessons_section_id" ON "lessons" ("section_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_lessons_course_id" ON "lessons" ("course_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "lessons";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sections";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "course_status";`);
  }
}
