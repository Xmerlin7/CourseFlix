import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the two `users.settings_*` columns the Settings feature actually
 * uses. schemaV2.sql also documents `settings_language` and
 * `settings_email_notifications`, but neither has anything to do yet (no
 * i18n layer, no email delivery channel) — deferred until those exist.
 *
 * Guarded with `hasColumn` like 1785000091000: this app also runs with
 * `synchronize: true` (see app.module.ts), so a dev box that's already
 * booted the API once since `UserEntity` picked up these fields can have
 * TypeORM's own schema sync beat this migration to creating them.
 */
export class AddUserSettings1785000092000 implements MigrationInterface {
  name = 'AddUserSettings1785000092000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTheme = await queryRunner.hasColumn('users', 'settings_theme');
    if (!hasTheme) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "settings_theme" text NOT NULL DEFAULT 'system';
      `);
    }

    const hasNotificationPreferences = await queryRunner.hasColumn(
      'users',
      'settings_notification_preferences',
    );
    if (!hasNotificationPreferences) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "settings_notification_preferences" jsonb NOT NULL DEFAULT '{}'::jsonb;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "settings_notification_preferences";`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "settings_theme";`,
    );
  }
}
