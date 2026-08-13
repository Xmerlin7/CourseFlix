import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Teacher-to-course announcements — separate from `discussion_threads`
 * (Q&A) on purpose, matching schemaV2.sql's `posts`/`post_attachments`
 * shape. `pinned_at` is a schemaV2.sql deviation, same category as
 * `courses.slug`/`courses.gradeLevel` in course.entity.ts: this module
 * didn't exist yet in schemaV2.sql's design pass, and the "teacher can
 * pin an announcement" requirement needs moderation metadata schemaV2
 * never modeled. Nullable timestamp (not a boolean) so "pinned at" can
 * double as the pinned-sort key without a second column.
 */
export class CreatePosts1785000102000 implements MigrationInterface {
  name = 'CreatePosts1785000102000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "posts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "teacher_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "content" TEXT NOT NULL,
        "pinned_at" TIMESTAMPTZ,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_posts_course_id" ON "posts" ("course_id");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_attachments" (
        "post_id" UUID NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
        "file_id" UUID NOT NULL REFERENCES "files"("id") ON DELETE CASCADE,
        "order_index" INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY ("post_id", "file_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "post_attachments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts";`);
  }
}
