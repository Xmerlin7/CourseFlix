import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable1752975600001 implements MigrationInterface {
  name = 'CreateSessionsTable1752975600001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"      uuid NOT NULL,
        "token_hash"   text NOT NULL,
        "device_info"  text,
        "ip_address"   inet,
        "expires_at"   timestamptz NOT NULL,
        "revoked_at"   timestamptz,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_sessions_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_token_hash" ON "sessions" ("token_hash");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sessions_user_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sessions_token_hash";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions";`);
  }
}
