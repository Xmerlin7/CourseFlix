import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Every course was charged the same platform-wide price
 * (`COURSE_PRICE_MINOR`, an env var) — there was no per-course price at
 * all, so a teacher had no field to set one. This adds it.
 *
 * Nullable, not defaulted to the platform price: `null` means "use the
 * platform default", which is what `commerce.service.ts` and
 * `courses.service.ts` fall back to via `course.priceMinor ??
 * COURSE_PRICE_MINOR`. Every existing course keeps behaving exactly as
 * before until its teacher sets a price.
 */
export class AddCoursePriceMinor1786613900000 implements MigrationInterface {
  name = 'AddCoursePriceMinor1786613900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('courses', 'price_minor');
    if (!hasColumn) {
      await queryRunner.query(`
        ALTER TABLE "courses" ADD COLUMN "price_minor" INTEGER;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" DROP COLUMN IF EXISTS "price_minor";`,
    );
  }
}
