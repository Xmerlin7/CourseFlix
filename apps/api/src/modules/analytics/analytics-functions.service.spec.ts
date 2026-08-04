import { BadRequestException } from '@nestjs/common';
import { AnalyticsFunctionsService } from './analytics-functions.service';
import { BestSellersIntentHandler } from './intent/best-sellers.handler';
import { OrderCountIntentHandler } from './intent/order-count.handler';
import { RevenueIntentHandler } from './intent/revenue.handler';
import type { SalesService } from '../sales/sales.service';

const TEACHER_ID = 'teacher-1';
const RANGE = {
  from: '2026-08-01T00:00:00.000Z',
  to: '2026-08-04T00:00:00.000Z',
};

type SalesServiceMock = {
  getSummary: jest.Mock;
  getBestSellers: jest.Mock;
};

function createService() {
  const salesService: SalesServiceMock = {
    getSummary: jest.fn(),
    getBestSellers: jest.fn(),
  };

  const revenue = new RevenueIntentHandler(
    salesService as unknown as SalesService,
  );
  const orderCount = new OrderCountIntentHandler(
    salesService as unknown as SalesService,
  );
  const bestSellers = new BestSellersIntentHandler(
    salesService as unknown as SalesService,
  );
  const service = new AnalyticsFunctionsService(
    revenue,
    orderCount,
    bestSellers,
  );

  return { service, salesService };
}

describe('AnalyticsFunctionsService', () => {
  it('exposes exactly the allowlisted intents', () => {
    const { service } = createService();
    expect(service.supportedIntents).toEqual([
      'revenue',
      'order_count',
      'best_sellers',
    ]);
    expect(service.isSupported('revenue')).toBe(true);
    expect(service.isSupported('best_sellers')).toBe(true);
    expect(service.isSupported('drop_table')).toBe(false);
    expect(service.isSupported('recent_orders')).toBe(false);
  });

  it('resolves the revenue intent from SalesService scoped to the caller', async () => {
    const { service, salesService } = createService();
    salesService.getSummary.mockResolvedValue({
      from: RANGE.from,
      to: RANGE.to,
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      revenueMinor: 12345,
      ordersCount: 2,
      bestSeller: null,
    });

    const result = await service.execute('revenue', {
      teacherId: TEACHER_ID,
      ...RANGE,
    });

    expect(salesService.getSummary).toHaveBeenCalledWith(TEACHER_ID, RANGE);
    expect(result).toEqual({
      intent: 'revenue',
      totalRevenue: 12345,
      currency: 'EGP',
      orderCount: 2,
      dateRange: { from: RANGE.from, to: RANGE.to },
      rowCount: 1,
    });
  });

  it('resolves the order_count intent from SalesService scoped to the caller', async () => {
    const { service, salesService } = createService();
    salesService.getSummary.mockResolvedValue({
      from: RANGE.from,
      to: RANGE.to,
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      revenueMinor: 0,
      ordersCount: 4,
      bestSeller: null,
    });

    const result = await service.execute('order_count', {
      teacherId: TEACHER_ID,
      ...RANGE,
    });

    expect(salesService.getSummary).toHaveBeenCalledWith(TEACHER_ID, RANGE);
    expect(result).toEqual({
      intent: 'order_count',
      successfulOrderCount: 4,
      dateRange: { from: RANGE.from, to: RANGE.to },
      rowCount: 1,
    });
  });

  it('resolves the best_sellers intent from SalesService scoped to the caller', async () => {
    const { service, salesService } = createService();
    salesService.getBestSellers.mockResolvedValue([
      {
        courseId: 'course-1',
        title: 'الميكانيكا الكلاسيكية',
        ordersCount: 2,
        revenueMinor: 100000,
      },
    ]);

    const result = await service.execute('best_sellers', {
      teacherId: TEACHER_ID,
      ...RANGE,
    });

    expect(salesService.getBestSellers).toHaveBeenCalledWith(TEACHER_ID, RANGE);
    expect(result).toEqual({
      intent: 'best_sellers',
      bestSellers: [
        {
          courseId: 'course-1',
          courseTitle: 'الميكانيكا الكلاسيكية',
          orderCount: 2,
          totalRevenue: 100000,
        },
      ],
      dateRange: { from: RANGE.from, to: RANGE.to },
      rowCount: 1,
    });
  });

  it('rejects an unsupported intent without running any aggregate query', async () => {
    const { service, salesService } = createService();

    await expect(
      service.execute('total_revenue', { teacherId: TEACHER_ID }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(salesService.getSummary).not.toHaveBeenCalled();
    expect(salesService.getBestSellers).not.toHaveBeenCalled();
  });
});
