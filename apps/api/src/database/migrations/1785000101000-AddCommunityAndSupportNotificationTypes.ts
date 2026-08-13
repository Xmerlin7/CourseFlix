import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds notification types for the Community and Support features.
 * Standalone migration (own transaction) because `ALTER TYPE ... ADD
 * VALUE` cannot run in the same transaction as a statement that *reads*
 * the new value — same reasoning as 1785000090000-AddAssistantRole.
 *
 * `announcement` already exists and is reused as-is for new teacher
 * posts, so no new value is needed for that.
 */
export class AddCommunityAndSupportNotificationTypes1785000101000 implements MigrationInterface {
  name = 'AddCommunityAndSupportNotificationTypes1785000101000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'discussion_reply';
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'discussion_accepted';
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'support_ticket_update';
    `);
  }

  public async down(): Promise<void> {
    throw new Error(
      'AddCommunityAndSupportNotificationTypes1785000101000 is not reversible: ' +
        'Postgres cannot drop enum values without rebuilding "notification_type" ' +
        'and every column/index that depends on it. Restore from a pre-migration backup instead.',
    );
  }
}
