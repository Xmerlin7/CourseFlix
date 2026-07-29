import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates `attendance` per schemaV2.sql:312. `uq_attendance_student_video`
 * is the real correctness guarantee behind "attendance is awarded exactly
 * once": `AttendanceService` inserts optimistically and treats a unique
 * violation as a no-op, so concurrent heartbeats can never award twice
 * (see `attendance.service.ts` and its spec).
 *
 * PREREQUISITE: `users` and this sprint's `videos` (1785000010000) must
 * already exist.
 */
export class CreateAttendance1785000012000 implements MigrationInterface {
  name = 'CreateAttendance1785000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "attendance" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "video_id" UUID NOT NULL REFERENCES "videos"("id") ON DELETE CASCADE,
        "watched_seconds" INTEGER NOT NULL DEFAULT 0,
        "watched_percentage" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "is_present" BOOLEAN NOT NULL DEFAULT FALSE,
        "last_heartbeat_at" TIMESTAMPTZ,
        "device_session_id" TEXT,
        "last_updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_attendance_student_video" UNIQUE ("student_id", "video_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_attendance_student_id" ON "attendance" ("student_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance";`);
  }
}
