import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gates newly-uploaded YouTube lesson videos behind an AI moderation check
 * (content safety, then subject relevance) run by the worker right after
 * captions are fetched — see `VideoIngestionProcessor`. Bunny/local videos
 * are unaffected: they default straight to `approved`, same as today.
 *
 * Guarded (`IF NOT EXISTS` / duplicate_object catch) per this repo's
 * convention for coexisting with `synchronize: true` in app.module.ts.
 */
export class AddVideoModerationStatus1785000300000 implements MigrationInterface {
  name = 'AddVideoModerationStatus1785000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."video_moderation_status" AS ENUM('pending', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "videos"
        ADD COLUMN IF NOT EXISTS "moderation_status" "public"."video_moderation_status" NOT NULL DEFAULT 'approved';
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "moderation_reason" text;
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "moderation_checked_at" TIMESTAMPTZ;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "videos" DROP COLUMN IF EXISTS "moderation_checked_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP COLUMN IF EXISTS "moderation_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP COLUMN IF EXISTS "moderation_status"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."video_moderation_status"`,
    );
  }
}
