import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Google "Continue with Google" sign-in:
 *  - `users.google_id` links a user row to their Google account (nullable,
 *    unique — one Google account can only map to one CourseFlix account).
 *  - `users.password_hash` becomes nullable because accounts created via
 *    Google have no password (email is already verified by Google); they
 *    can't use the password login until they set one.
 *
 * Guarded against the runtime app running with `synchronize: true`, which
 * may already have applied these schema changes — every step is a no-op if
 * the target state is already in place.
 */
export class AddGoogleOauth1785000200000 implements MigrationInterface {
  name = 'AddGoogleOauth1785000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ is_nullable }] = await queryRunner.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'password_hash'`,
    );
    if (is_nullable === 'NO') {
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`,
      );
    }

    if (!(await queryRunner.hasColumn('users', 'google_id'))) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD COLUMN "google_id" character varying`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX "IDX_users_google_id" ON "users" ("google_id") WHERE "google_id" IS NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('users', 'google_id')) {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_google_id"`);
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    }
    const [{ is_nullable }] = await queryRunner.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'password_hash'`,
    );
    if (is_nullable === 'YES') {
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`,
      );
    }
  }
}
