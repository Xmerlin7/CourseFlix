import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a dedicated `google_oauth` value to the `otp_purpose` enum.
 *
 * The Google "Continue with Google" flow now requires a one-time password
 * before a session is opened: after the OAuth callback the server issues a
 * code with purpose `google_oauth` (distinct from `login` so an OAuth code
 * can't be redeemed through the passwordless-login endpoint), and the user
 * enters it on the web's code step. The session is only created when the
 * code is verified via POST /auth/otp/verify.
 *
 * Postgres can't drop enum values, so `down` cannot fully revert the type —
 * it leaves `google_oauth` in place (harmless: no rows reference it once the
 * flow is unwound) and only notes it. The migration is guarded because the
 * runtime app boots with `synchronize: true` (see app.module.ts), so a dev
 * box that restarted the API after the entity added the value may already
 * have the enum member.
 */
export class AddGoogleOtpPurpose1785000250000 implements MigrationInterface {
  name = 'AddGoogleOtpPurpose1785000250000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'otp_purpose' AND e.enumlabel = 'google_oauth'
        ) THEN
          ALTER TYPE "otp_purpose" ADD VALUE 'google_oauth';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres has no ALTER TYPE ... DROP VALUE. The enum value can't be
    // removed; it's simply unused once callers stop issuing it.
    void queryRunner;
  }
}
