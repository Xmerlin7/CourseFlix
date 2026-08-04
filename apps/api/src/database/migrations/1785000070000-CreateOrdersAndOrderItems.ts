import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sprint 3 addition (sprint3-plan.md §5 A-1, CF-TASK-058) — not in
 * `schemaV2.sql`, which has no commerce tables. `orders` is the single
 * authoritative revenue record ("backend orders are the only revenue
 * truth"); `order_items` snapshots the course title and the server-set
 * price at purchase time so sales history stays immutable even if a
 * course is later renamed or repriced.
 *
 * Two status enums are kept separate on purpose: `order_status` reflects
 * the purchase lifecycle (pending / paid / failed), while
 * `payment_status` reflects the latest payment attempt. A declined
 * attempt sets `payment_status = 'failed'` but leaves the order
 * retryable (`status` stays 'pending'); only a successful confirm flips
 * the order to 'paid'. Sales aggregates therefore count paid orders only
 * and naturally exclude failed/declined/reset rows.
 *
 * `idempotency_key` is the duplicate-purchase guard (CF-TASK-059): the
 * partial unique index means the same key can never create two orders,
 * and a duplicate confirm returns the existing authoritative order.
 */
export class CreateOrdersAndOrderItems1785000070000 implements MigrationInterface {
  name = 'CreateOrdersAndOrderItems1785000070000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "order_status" AS ENUM ('pending', 'paid', 'failed');
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed');
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "student_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "status" order_status NOT NULL DEFAULT 'pending',
        "payment_status" payment_status NOT NULL DEFAULT 'pending',
        "currency" TEXT NOT NULL DEFAULT 'EGP',
        "total_minor" INTEGER NOT NULL,
        "idempotency_key" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "paid_at" TIMESTAMPTZ
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_orders_idempotency_key"
        ON "orders" ("idempotency_key")
        WHERE "idempotency_key" IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_orders_student" ON "orders" ("student_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_orders_paid_at" ON "orders" ("paid_at") WHERE "status" = 'paid';
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE RESTRICT,
        "title_snapshot" TEXT NOT NULL,
        "price_minor" INTEGER NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_order_items_course" ON "order_items" ("course_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status";`);
  }
}
