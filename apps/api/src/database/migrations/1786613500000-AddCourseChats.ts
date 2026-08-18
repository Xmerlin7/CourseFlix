import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseChats1786613500000 implements MigrationInterface {
  name = 'AddCourseChats1786613500000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "support_tickets"
      ADD COLUMN IF NOT EXISTS "is_course_chat" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_support_course_chat_student_course"
      ON "support_tickets" ("student_id", "course_id")
      WHERE "is_course_chat" = true AND "deleted_at" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_support_course_chat_student_course"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP COLUMN IF EXISTS "is_course_chat"`,
    );
  }
}
