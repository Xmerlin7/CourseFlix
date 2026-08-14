import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformSettings1786613200000
  implements MigrationInterface
{
  name = 'CreatePlatformSettings1786613200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "platform_settings" (
        "key" text PRIMARY KEY,
        "value" text,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings";`);
  }
}
