import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds email verification + one-time-password (OTP) auth:
 *
 * - `users.email_verified_at` — set when the account's email is proven via
 *   the register OTP. New self-signed registrations are created with status
 *   'inactive' and only flipped to 'active' once verified (password login
 *   already rejects non-active users).
 * - `otp_codes` — a single-use, expiring code per (user, purpose). Used by
 *   the passwordless-login, register-verification, and password-reset
 *   flows. Only the argon2 hash of the code is stored, never the code
 *   itself.
 *
 * Follows the repo's defensive style (IF NOT EXISTS / DO-block): the API
 * runs with `synchronize: true`, so a dev box that booted the API after
 * the entity picked up `emailVerifiedAt` may already have the column.
 */
export class AddEmailVerificationAndOtp1785000100000 implements MigrationInterface {
  name = 'AddEmailVerificationAndOtp1785000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMPTZ;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'otp_purpose') THEN
          CREATE TYPE "otp_purpose" AS ENUM ('login', 'register', 'password_reset');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "otp_codes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "purpose" otp_purpose NOT NULL,
        "code_hash" TEXT NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "consumed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_otp_codes_user_purpose"
        ON "otp_codes" ("user_id", "purpose", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_otp_codes_user_purpose";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_codes";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "otp_purpose";`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified_at";`,
    );
  }
}
