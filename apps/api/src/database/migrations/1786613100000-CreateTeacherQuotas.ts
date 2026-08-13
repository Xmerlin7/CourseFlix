import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeacherQuotas1786613100000 implements MigrationInterface {
  name = 'CreateTeacherQuotas1786613100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "teacher_quotas" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "teacher_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "monthly_allowance" INTEGER NOT NULL DEFAULT 100,
        "total_credits" INTEGER NOT NULL DEFAULT 100,
        "used_credits" INTEGER NOT NULL DEFAULT 0,
        "reset_at" TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "ux_teacher_quotas_teacher_id" ON "teacher_quotas" ("teacher_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "teacher_quotas";`);
  }
}
