import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops `platform_settings`.
 *
 * The table was introduced for exactly one feature — the admin/teacher
 * "auth poster", which let a course be featured on the sign-in screen and
 * its card copy customised. That surface has been removed in favour of a
 * showcase panel that needs no configuration, and with it went the entire
 * PlatformSettings module: three controllers, the service and its DTO. The
 * table had no other reader or writer, so it is dropped rather than left
 * behind as an orphan that a future `settings` feature would inherit with
 * two stale auth-poster rows already in it.
 *
 * `down` recreates the table but not its rows: the two keys it held
 * (`auth_poster_featured_course_id`, `auth_poster_customization`) describe
 * a UI that no longer exists, so there is nothing meaningful to restore.
 */
export class DropPlatformSettings1786613400000 implements MigrationInterface {
  name = 'DropPlatformSettings1786613400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "platform_settings" (
        "key" text PRIMARY KEY,
        "value" text,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
  }
}
