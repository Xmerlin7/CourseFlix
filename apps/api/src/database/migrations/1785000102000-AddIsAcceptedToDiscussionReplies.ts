import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsAcceptedToDiscussionReplies1785000102000 implements MigrationInterface {
  name = 'AddIsAcceptedToDiscussionReplies1785000102000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "discussion_replies"
      ADD COLUMN IF NOT EXISTS "is_accepted" BOOLEAN NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      UPDATE "discussion_replies" r
      SET "is_accepted" = true
      FROM "discussion_threads" t
      WHERE t."accepted_reply_id" = r."id";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "discussion_replies"
      DROP COLUMN IF EXISTS "is_accepted";
    `);
  }
}
