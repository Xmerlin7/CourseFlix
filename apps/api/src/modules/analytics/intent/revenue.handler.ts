import { Injectable } from '@nestjs/common';
import { SalesService } from '../../sales/sales.service';
import type {
  AnalyticsIntentContext,
  AnalyticsIntentHandler,
  AnalyticsIntentResult,
} from './analytics-intent-handler.interface';

/**
 * Overall revenue for the given date range. Delegates to
 * `SalesService.getSummary` so ownership scoping and the paid-only ledger
 * rules live in one place. Money is integer EGP minor units.
 */
@Injectable()
export class RevenueIntentHandler implements AnalyticsIntentHandler {
  readonly name = 'revenue';

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
      totalRevenue: summary.revenueMinor,
      currency: summary.currency,
      orderCount: summary.ordersCount,
      dateRange: { from: summary.from, to: summary.to },
      rowCount: 1,
    };
  }
}
