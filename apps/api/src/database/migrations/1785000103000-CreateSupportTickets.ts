import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Human-only support workflow (no AI): a student opens a ticket in one
 * of a fixed set of categories, an assistant/teacher/admin (see
 * SupportStaffRoleGuard — this platform's "support" role is served by
 * the roles that already exist, not a new one) works it through a
 * fixed status lifecycle, and `support_messages` is the append-only
 * conversation — same shape precedent as
 * `quiz_generation_feedback` (exam-generation module).
 */
export class CreateSupportTickets1785000103000 implements MigrationInterface {
  name = 'CreateSupportTickets1785000103000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "support_ticket_category" AS ENUM ('technical', 'course', 'payment', 'account', 'other');
    `);
    await queryRunner.query(`
      CREATE TYPE "support_ticket_status" AS ENUM ('open', 'in_progress', 'waiting_for_student', 'resolved', 'closed');
    `);

    await queryRunner.query(`
      CREATE TABLE "support_tickets" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "course_id" UUID REFERENCES "courses"("id") ON DELETE SET NULL,
        "category" support_ticket_category NOT NULL,
        "subject" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "status" support_ticket_status NOT NULL DEFAULT 'open',
        "assigned_to" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "resolved_at" TIMESTAMPTZ,
        "closed_at" TIMESTAMPTZ,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_support_tickets_student_id" ON "support_tickets" ("student_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_support_tickets_status" ON "support_tickets" ("status");`,
    );

    await queryRunner.query(`
      CREATE TABLE "support_messages" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "ticket_id" UUID NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
        "author_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "is_staff_reply" BOOLEAN NOT NULL DEFAULT false,
        "body" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_support_messages_ticket_id" ON "support_messages" ("ticket_id");`,
    );

    // Attachments only on the initial ticket (matches the create-ticket
    // form's "optional attachment" — replies are text-only in this MVP).
    await queryRunner.query(`
      CREATE TABLE "support_ticket_attachments" (
        "ticket_id" UUID NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
        "file_id" UUID NOT NULL REFERENCES "files"("id") ON DELETE CASCADE,
        "order_index" INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY ("ticket_id", "file_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "support_ticket_attachments";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "support_messages";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_ticket_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_ticket_category";`);
  }
}
