import { Module } from '@nestjs/common';
import { AgentLogsModule } from '../agent-logs/agent-logs.module';
import { SalesModule } from '../sales/sales.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsFunctionsService } from './analytics-functions.service';
import { AnalyticsLogService } from './analytics-log.service';
import { AnalyticsParserService } from './analytics-parser.service';
import { BestSellersIntentHandler } from './intent/best-sellers.handler';
import { OrderCountIntentHandler } from './intent/order-count.handler';
import { RevenueIntentHandler } from './intent/revenue.handler';

/**
 * Sprint 3 analytics: Nabile's parser + endpoint (CF-TASK-069/071) feeding
 * Albraa's permission-scoped function registry (CF-TASK-070), which is the
 * only query path into the orders ledger. The registry's handlers delegate
 * to SalesService, which scopes every aggregate to the teacher's owned
 * courses — no raw SQL and no arbitrary-expression path (CF-TASK-072).
 */
@Module({
  imports: [
    // SalesService resolves owned-course-scoped aggregates for the registry.
    SalesModule,
    // Provides the AGENT_LOG_PORT token used by AnalyticsLogService.
    AgentLogsModule,
    // Required for AuthGuard to resolve SessionsService in this module's DI context.
    SessionsModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsParserService,
    AnalyticsLogService,
    AnalyticsFunctionsService,
    RevenueIntentHandler,
    OrderCountIntentHandler,
    BestSellersIntentHandler,
  ],
  exports: [AnalyticsFunctionsService, AnalyticsParserService],
})
export class AnalyticsModule {}
