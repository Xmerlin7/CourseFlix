import { DataSource } from 'typeorm';

export interface TransactionalResetSummary {
  enrollmentsClearedFromCheckout: number;
  ordersCleared: number;
  agentLogsCleared: number;
}

/**
 * Clears rehearsal-accumulated transactional state so checkout and the
 * agent-log viewer stay repeatable across `reset` runs (release-runbook.md
 * "Database reset" § scope, sprint3-plan.md E-2). Unlike the fixture
 * tables seeded elsewhere, orders/payments/agent_logs have no natural key
 * to upsert against — they only ever accumulate — so they're cleared
 * outright instead.
 *
 * The enrollment step only touches rows created by a real checkout:
 * `CommerceService.createDraftOrder` refuses to create an order for a
 * course the student is already enrolled in, so every enrollment whose
 * (student, course) pair also has an order row is, by construction,
 * checkout-created — never one of the base seed fixture's enrollments.
 * It's soft-deleted the same way `EnrollmentsService` cancels one, so a
 * fresh checkout can re-purchase the course on the next rehearsal.
 *
 * `order_items` and `payments` cascade-delete with their parent `orders`
 * row (see their migrations), so deleting `orders` is enough for both.
 * Demo interventions are deliberately left untouched here: they're
 * already upserted by dedup key (`intervention.seed.ts`), so re-triggering
 * the same signal across rehearsals is already a safe no-op.
 */
export async function clearTransactionalDemoState(
  dataSource: DataSource,
): Promise<TransactionalResetSummary> {
  const enrollmentRows = await dataSource.query<Array<{ id: string }>>(`
    UPDATE enrollments e
    SET deleted_at = now()
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE e.student_id = o.student_id
      AND e.course_id = oi.course_id
      AND e.deleted_at IS NULL
    RETURNING e.id
  `);

  const orderRows = await dataSource.query<Array<{ id: string }>>(
    `DELETE FROM orders RETURNING id`,
  );

  const agentLogRows = await dataSource.query<Array<{ id: string }>>(
    `DELETE FROM agent_logs RETURNING id`,
  );

  return {
    enrollmentsClearedFromCheckout: enrollmentRows.length,
    ordersCleared: orderRows.length,
    agentLogsCleared: agentLogRows.length,
  };
}
