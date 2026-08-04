import { Injectable } from '@nestjs/common';
import { SalesService } from '../../sales/sales.service';
import type {
  AnalyticsIntentContext,
  AnalyticsIntentHandler,
} from './analytics-intent-handler.interface';

/**
 * Overall revenue for the given date range. Delegates to
 * `SalesService.getSummary` so ownership scoping and the paid-only ledger
 * rules live in one place.
 */
@Injectable()
export class RevenueIntentHandler implements AnalyticsIntentHandler {
  readonly name = 'revenue';

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
      revenueMinor: summary.revenueMinor,
    };
  }
}
