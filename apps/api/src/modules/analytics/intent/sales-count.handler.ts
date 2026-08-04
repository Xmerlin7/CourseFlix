import { Injectable } from '@nestjs/common';
import { SalesService } from '../../sales/sales.service';
import type {
  AnalyticsIntentContext,
  AnalyticsIntentHandler,
} from './analytics-intent-handler.interface';

/**
 * Successful (paid) order count for the given date range. Backed by the
 * orders ledger via `SalesService.getSummary` — failed/declined orders are
 * excluded and results are scoped to the teacher's own courses.
 */
@Injectable()
export class SalesCountIntentHandler implements AnalyticsIntentHandler {
  readonly name = 'sales_count';

  constructor(private readonly salesService: SalesService) {}

  async handle(context: AnalyticsIntentContext) {
    const summary = await this.salesService.getSummary(context.teacherId, {
      from: context.from,
      to: context.to,
    });
    return {
      intent: this.name,
      currency: summary.currency,
      timezone: summary.timezone,
      ordersCount: summary.ordersCount,
    };
  }
}
