import { Injectable } from '@nestjs/common';
import { SalesService } from '../../sales/sales.service';
import type {
  AnalyticsIntentContext,
  AnalyticsIntentHandler,
  AnalyticsIntentResult,
} from './analytics-intent-handler.interface';

/**
 * Top selling courses for the given date range. Delegates to
 * `SalesService.getBestSellers` (limit 5, scoped to owned courses).
 * Money is integer EGP minor units per course.
 */
@Injectable()
export class BestSellersIntentHandler implements AnalyticsIntentHandler {
  readonly name = 'best_sellers';

  constructor(private readonly salesService: SalesService) {}

  async handle(
    context: AnalyticsIntentContext,
  ): Promise<AnalyticsIntentResult> {
    const bestSellers = await this.salesService.getBestSellers(
      context.teacherId,
      {
        from: context.from,
        to: context.to,
      },
    );
    return {
      intent: this.name,
      bestSellers: bestSellers.map((row) => ({
        courseId: row.courseId,
        courseTitle: row.title,
        orderCount: row.ordersCount,
        totalRevenue: row.revenueMinor,
      })),
      dateRange: {
        from: context.from ?? null,
        to: context.to ?? null,
      },
      rowCount: bestSellers.length,
    };
  }
}
