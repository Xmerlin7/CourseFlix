import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { AnalyticsIntent } from './analytics-intent';

export interface RevenueResult {
  totalRevenue: number;
  currency: string;
  orderCount: number;
  dateRange: { from: string; to: string };
}

export interface OrderCountResult {
  successfulOrderCount: number;
  dateRange: { from: string; to: string };
}

export interface BestSellersResult {
  bestSellers: Array<{
    courseId: string;
    courseTitle: string;
    orderCount: number;
    totalRevenue: number;
  }>;
  dateRange: { from: string; to: string };
}

export interface AnalyticsQueryOutcome {
  intent: Exclude<AnalyticsIntent, 'unsupported'>;
  result: RevenueResult | OrderCountResult | BestSellersResult;
  rowCount: number;
}

const CURRENCY = 'EGP';

/**
 * The only query path the Analytics Agent may use. Three fixed queries
 * against the `orders` table (Albraa's A-4 schema, not merged yet).
 * Graceful when the orders table is not migrated yet: any query failure
 * degrades to zeroed results instead of crashing, so the teacher never
 * sees an internal error page.
 */
@Injectable()
export class AnalyticsQueryService {
  private readonly logger = new Logger(AnalyticsQueryService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async run(
    intent: Exclude<AnalyticsIntent, 'unsupported'>,
    courseIds: string[],
    dateFrom?: string,
    dateTo?: string,
  ): Promise<AnalyticsQueryOutcome> {
    const from = dateFrom ?? new Date(0).toISOString();
    const to = dateTo ?? new Date().toISOString();

    try {
      switch (intent) {
        case 'revenue':
          return await this.revenue(courseIds, from, to);
        case 'order_count':
          return await this.orderCount(courseIds, from, to);
        case 'best_sellers':
          return await this.bestSellers(courseIds, from, to);
      }
    } catch (error) {
      // Orders table not present yet (Albraa's migration not merged) or
      // any query failure — never surface internals to the teacher.
      this.logger.warn(
        `Analytics query failed for ${intent}: ${String(error)}`,
      );
      return {
        intent,
        result: this.emptyResult(intent, from, to),
        rowCount: 0,
      };
    }
  }

  private async revenue(
    courseIds: string[],
    from: string,
    to: string,
  ): Promise<AnalyticsQueryOutcome> {
    const rows: Array<{ total: string; count: string }> =
      await this.dataSource.query(
        `SELECT COALESCE(SUM(amount_minor), 0) AS total,
              COUNT(*) AS count
         FROM orders
        WHERE course_id = ANY($1)
          AND status = 'paid'
          AND created_at >= $2
          AND created_at < $3`,
        [courseIds, from, to],
      );
    const row = rows[0];
    const result: RevenueResult = {
      totalRevenue: Number(row?.total ?? 0),
      currency: CURRENCY,
      orderCount: Number(row?.count ?? 0),
      dateRange: { from, to },
    };
    return { intent: 'revenue', result, rowCount: 1 };
  }

  private async orderCount(
    courseIds: string[],
    from: string,
    to: string,
  ): Promise<AnalyticsQueryOutcome> {
    const rows: Array<{ count: string }> = await this.dataSource.query(
      `SELECT COUNT(*) AS count
         FROM orders
        WHERE course_id = ANY($1)
          AND status = 'paid'
          AND created_at >= $2
          AND created_at < $3`,
      [courseIds, from, to],
    );
    const result: OrderCountResult = {
      successfulOrderCount: Number(rows[0]?.count ?? 0),
      dateRange: { from, to },
    };
    return { intent: 'order_count', result, rowCount: 1 };
  }

  private async bestSellers(
    courseIds: string[],
    from: string,
    to: string,
  ): Promise<AnalyticsQueryOutcome> {
    const rows: Array<{
      courseId: string;
      orderCount: string;
      totalRevenue: string;
    }> = await this.dataSource.query(
      `SELECT course_id AS "courseId",
              COUNT(*) AS "orderCount",
              SUM(amount_minor) AS "totalRevenue"
         FROM orders
        WHERE course_id = ANY($1)
          AND status = 'paid'
          AND created_at >= $2
          AND created_at < $3
        GROUP BY course_id
        ORDER BY "orderCount" DESC
        LIMIT 5`,
      [courseIds, from, to],
    );

    const courseIdsList = rows.map((r) => r.courseId);
    const titles = courseIdsList.length
      ? await this.courseTitles(courseIdsList)
      : new Map<string, string>();

    const result: BestSellersResult = {
      bestSellers: rows.map((r) => ({
        courseId: r.courseId,
        courseTitle: titles.get(r.courseId) ?? 'دورة',
        orderCount: Number(r.orderCount),
        totalRevenue: Number(r.totalRevenue),
      })),
      dateRange: { from, to },
    };
    return {
      intent: 'best_sellers',
      result,
      rowCount: result.bestSellers.length,
    };
  }

  private async courseTitles(
    courseIds: string[],
  ): Promise<Map<string, string>> {
    const rows: Array<{ id: string; title: string }> =
      await this.dataSource.query(
        `SELECT id, title FROM courses WHERE id = ANY($1)`,
        [courseIds],
      );
    return new Map(rows.map((r) => [r.id, r.title]));
  }

  private emptyResult(
    intent: Exclude<AnalyticsIntent, 'unsupported'>,
    from: string,
    to: string,
  ): RevenueResult | OrderCountResult | BestSellersResult {
    switch (intent) {
      case 'revenue':
        return {
          totalRevenue: 0,
          currency: CURRENCY,
          orderCount: 0,
          dateRange: { from, to },
        };
      case 'order_count':
        return { successfulOrderCount: 0, dateRange: { from, to } };
      case 'best_sellers':
        return { bestSellers: [], dateRange: { from, to } };
    }
  }
}
