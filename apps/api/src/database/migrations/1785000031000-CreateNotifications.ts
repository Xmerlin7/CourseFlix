import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `notifications` table per `schemaV2.sql:518`.
 *
 * PREREQUISITE: `users` must already exist (referenced via FK).
 */
export class CreateNotifications1785000031000 implements MigrationInterface {
  name = 'CreateNotifications1785000031000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type" AS ENUM (
        'hw_assigned', 'quiz_ready', 'progress_report', 'announcement', 'course_update', 'system'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_priority" AS ENUM ('low', 'normal', 'high', 'critical');
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" notification_type NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "related_entity_type" TEXT,
        "related_entity_id" UUID,
        "priority" notification_priority NOT NULL DEFAULT 'normal',
        "delivery_status" TEXT,
        "scheduled_at" TIMESTAMPTZ,
        "read_at" TIMESTAMPTZ,
        "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_unread" ON "notifications" ("user_id", "is_read");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_priority";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type";`);
  }
}
