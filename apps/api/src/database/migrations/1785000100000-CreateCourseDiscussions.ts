import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Course-scoped Q&A community: a student posts a question to their
 * enrolled course, students and the teacher/assistants reply, and the
 * question's author can mark one reply as the accepted answer.
 *
 * `authorRole` is a denormalized snapshot of the author's role *at
 * post time* (not a live join to `users`) — it's what drives the
 * "Teacher" badge on a reply without needing to join `users` on every
 * list/detail read, and it stays historically accurate even if a
 * user's role changes later.
 *
 * `tags` follows the existing `questions.tags TEXT[]` precedent in
 * schemaV2.sql — a plain array column, no separate tags table, since
 * tags here are a small fixed-ish vocabulary the teacher/students pick
 * from free text, not a managed taxonomy.
 *
 * `discussion_threads.accepted_reply_id` can't reference
 * `discussion_replies` in the same CREATE TABLE (the table doesn't
 * exist yet), so the FK is added via ALTER TABLE once both tables
 * exist.
 */
export class CreateCourseDiscussions1785000100000
  implements MigrationInterface
{
  name = 'CreateCourseDiscussions1785000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "discussion_threads" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "author_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "author_role" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "tags" TEXT[] NOT NULL DEFAULT '{}',
        "accepted_reply_id" UUID,
        "reply_count" INTEGER NOT NULL DEFAULT 0,
        "helpful_count" INTEGER NOT NULL DEFAULT 0,
        "is_pinned" BOOLEAN NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_discussion_threads_course_id" ON "discussion_threads" ("course_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_discussion_threads_author_id" ON "discussion_threads" ("author_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_discussion_threads_tags" ON "discussion_threads" USING GIN ("tags");`,
    );

    await queryRunner.query(`
      CREATE TABLE "discussion_replies" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "thread_id" UUID NOT NULL REFERENCES "discussion_threads"("id") ON DELETE CASCADE,
        "author_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "author_role" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_discussion_replies_thread_id" ON "discussion_replies" ("thread_id");`,
    );

    await queryRunner.query(`
      ALTER TABLE "discussion_threads"
      ADD CONSTRAINT "fk_discussion_threads_accepted_reply_id"
      FOREIGN KEY ("accepted_reply_id") REFERENCES "discussion_replies"("id") ON DELETE SET NULL;
    `);

    // One helpful vote per user per thread — same compound-PK-as-unique-
    // constraint shape as `post_attachments` in schemaV2.sql.
    await queryRunner.query(`
      CREATE TABLE "discussion_helpful_votes" (
        "thread_id" UUID NOT NULL REFERENCES "discussion_threads"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY ("thread_id", "user_id")
      );
    `);

    // Reuses the existing `files` table (documents module) instead of a
    // parallel storage system — same junction shape as `post_attachments`.
    await queryRunner.query(`
      CREATE TABLE "discussion_thread_attachments" (
        "thread_id" UUID NOT NULL REFERENCES "discussion_threads"("id") ON DELETE CASCADE,
        "file_id" UUID NOT NULL REFERENCES "files"("id") ON DELETE CASCADE,
        "order_index" INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY ("thread_id", "file_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "discussion_thread_attachments";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "discussion_helpful_votes";`,
    );
    await queryRunner.query(`
      ALTER TABLE "discussion_threads" DROP CONSTRAINT IF EXISTS "fk_discussion_threads_accepted_reply_id";
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "discussion_replies";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "discussion_threads";`);
  }
}
