import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentLogsModule } from '../agent-logs/agent-logs.module';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity';
import { InterventionEntity } from '../interventions/entities/intervention.entity';
import { SalesModule } from '../sales/sales.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsFunctionsService } from './analytics-functions.service';
import { AnalyticsLogService } from './analytics-log.service';
import { AnalyticsParserService } from './analytics-parser.service';
import { ActiveInterventionsIntentHandler } from './intent/active-interventions.handler';
import { BestSellersIntentHandler } from './intent/best-sellers.handler';
import { CourseCountIntentHandler } from './intent/course-count.handler';
import { OrderCountIntentHandler } from './intent/order-count.handler';
import { RevenueIntentHandler } from './intent/revenue.handler';
import { StudentCountIntentHandler } from './intent/student-count.handler';

/**
 * Sprint 3 analytics: Nabile's parser + endpoint (CF-TASK-069/071) feeding
 * Albraa's permission-scoped function registry (CF-TASK-070), which is the
 * only query path into the orders ledger. The registry's handlers delegate
 * to SalesService, which scopes every aggregate to the teacher's owned
 * courses — no raw SQL and no arbitrary-expression path (CF-TASK-072).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      EnrollmentEntity,
      InterventionEntity,
    ]),
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
    StudentCountIntentHandler,
    CourseCountIntentHandler,
    ActiveInterventionsIntentHandler,
  ],
  exports: [AnalyticsFunctionsService, AnalyticsParserService],
})
export class AnalyticsModule {}
