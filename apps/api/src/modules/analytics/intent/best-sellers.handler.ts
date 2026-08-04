import { Injectable } from '@nestjs/common';
import { DISPLAY_TIMEZONE } from '../../commerce/commerce.constants';
import { SalesService } from '../../sales/sales.service';
import type {
  AnalyticsIntentContext,
  AnalyticsIntentHandler,
} from './analytics-intent-handler.interface';

/**
 * Top selling courses for the given date range. Delegates to
 * `SalesService.getBestSellers` (limit 5, scoped to owned courses).
 */
@Injectable()
export class BestSellersIntentHandler implements AnalyticsIntentHandler {
  readonly name = 'best_sellers';

  constructor(private readonly salesService: SalesService) {}

  async handle(context: AnalyticsIntentContext) {
    const bestSellers = await this.salesService.getBestSellers(
      context.teacherId,
      {
        from: context.from,
        to: context.to,
      },
    );
    return {
      intent: this.name,
      currency: 'EGP',
      timezone: DISPLAY_TIMEZONE,
      bestSellers,
    };
  }
}
