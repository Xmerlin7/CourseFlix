import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sprint 3 addition (sprint3-plan.md §5 A-1/A-3, CF-TASK-058/059). One
 * row per payment attempt against an order: a declined confirm records a
 * failed attempt, a later retry appends a new attempt. `method` is
 * always the deterministic `test_adapter` in this sprint — no real card
 * data is ever accepted or stored (see docs/api/sprint3-commerce.md).
 * `attempt_no` makes retry behavior auditable and is used by the service
 * to number attempts; the unique index keeps the ledger append-only.
 *
 * Reuses the `payment_status` enum created in the orders migration
 * (1785000070000), which this migration must follow.
 */
export class CreatePayments1785000071000 implements MigrationInterface {
  name = 'CreatePayments1785000071000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "attempt_no" INTEGER NOT NULL DEFAULT 1,
        "status" payment_status NOT NULL DEFAULT 'pending',
        "method" TEXT NOT NULL DEFAULT 'test_adapter',
        "external_ref" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_payments_order_attempt"
        ON "payments" ("order_id", "attempt_no");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payments";`);
  }
}
