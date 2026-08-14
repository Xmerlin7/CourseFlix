import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherWhatsappNumber1786613300000
  implements MigrationInterface
{
  name = 'AddTeacherWhatsappNumber1786613300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasWhatsappNumber = await queryRunner.hasColumn(
      'users',
      'whatsapp_number',
    );

    if (!hasWhatsappNumber) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "whatsapp_number" text;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "whatsapp_number";`,
    );
  }
}
