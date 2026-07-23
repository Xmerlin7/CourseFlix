import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1752975600000 implements MigrationInterface {
  name = 'CreateUsersTable1752975600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('student', 'teacher');
    `);

    await queryRunner.query(`
      CREATE TYPE "user_status" AS ENUM ('active', 'suspended', 'inactive');
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "full_name"      text NOT NULL,
        "email"          text NOT NULL,
        "password_hash"  text NOT NULL,
        "role"           "user_role" NOT NULL,
        "avatar_url"     text,
        "status"         "user_status" NOT NULL DEFAULT 'active',
        "last_login_at"  timestamptz,
        "deleted_at"     timestamptz,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        "updated_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role";`);
  }
}
