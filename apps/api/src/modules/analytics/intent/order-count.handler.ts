import { Injectable } from '@nestjs/common';
import { SalesService } from '../../sales/sales.service';
import type {
  AnalyticsIntentContext,
  AnalyticsIntentHandler,
  AnalyticsIntentResult,
} from './analytics-intent-handler.interface';

/**
 * Successful (paid) order count for the given date range. Backed by the
 * orders ledger via `SalesService.getSummary` — failed/declined orders are
 * excluded and results are scoped to the teacher's own courses.
 */
@Injectable()
export class OrderCountIntentHandler implements AnalyticsIntentHandler {
  readonly name = 'order_count';

  constructor(private readonly salesService: SalesService) {}

  async handle(
    context: AnalyticsIntentContext,
  ): Promise<AnalyticsIntentResult> {
    const summary = await this.salesService.getSummary(context.teacherId, {
      from: context.from,
      to: context.to,
    });
    return {
      intent: this.name,
      successfulOrderCount: summary.ordersCount,
      dateRange: { from: summary.from, to: summary.to },
      rowCount: 1,
    };
  }
}
