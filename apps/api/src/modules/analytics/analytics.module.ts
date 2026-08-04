import { Module } from '@nestjs/common';
import { SalesModule } from '../sales/sales.module';
import { AnalyticsFunctionsService } from './analytics-functions.service';
import { BestSellersIntentHandler } from './intent/best-sellers.handler';
import { RevenueIntentHandler } from './intent/revenue.handler';
import { SalesCountIntentHandler } from './intent/sales-count.handler';

/**
 * Exposes `AnalyticsFunctionsService` as the shared contract for Nabile's
 * Analytics Agent parser (CF-TASK-069) and Elgendy's gap-filled UI
 * (CF-TASK-071). The module adds no HTTP route — the agent-facing endpoint
 * (`POST /api/v1/teacher/analytics/questions`) belongs to Nabile.
 */
@Module({
  imports: [SalesModule],
  providers: [
    AnalyticsFunctionsService,
    RevenueIntentHandler,
    SalesCountIntentHandler,
    BestSellersIntentHandler,
  ],
  exports: [AnalyticsFunctionsService],
})
export class AnalyticsModule {}
