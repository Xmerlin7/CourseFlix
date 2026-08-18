import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillInterventionCourseChats1786613600000 implements MigrationInterface {
  name = 'BackfillInterventionCourseChats1786613600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "support_tickets" (
        "student_id",
        "course_id",
        "is_course_chat",
        "category",
        "subject",
        "description",
        "status"
      )
      SELECT
        latest."student_id",
        latest."course_id",
        true,
        'course'::support_ticket_category,
        'طالب محتاج متابعة: ' || latest."weak_concept",
        'رصد النظام أن الطالب محتاج متابعة في "' || latest."weak_concept" ||
          '" داخل دورة ' || course."title" ||
          '. يمكن للمدرس أو الأسيستانت التواصل معه من المحادثة بالأسفل.',
        'open'::support_ticket_status
      FROM (
        SELECT DISTINCT ON ("student_id", "course_id")
          "student_id", "course_id", "weak_concept", "created_at"
        FROM "interventions"
        WHERE "status" = 'active'
        ORDER BY "student_id", "course_id", "created_at" DESC
      ) latest
      INNER JOIN "courses" course ON course."id" = latest."course_id"
      ON CONFLICT ("student_id", "course_id")
        WHERE "is_course_chat" = true AND "deleted_at" IS NULL
      DO UPDATE SET
        "subject" = EXCLUDED."subject",
        "description" = EXCLUDED."description",
        "status" = 'open'::support_ticket_status,
        "resolved_at" = NULL,
        "closed_at" = NULL,
        "updated_at" = NOW()
    `);
  }

  async down(): Promise<void> {
    // Existing and new course chats share the same durable conversation.
    // Removing backfilled rows could delete real replies, so this is a no-op.
  }
}
