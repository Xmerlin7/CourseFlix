import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentLogsModule } from '../agent-logs/agent-logs.module';
import { CourseEntity } from '../courses/entities/course.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsLogService } from './analytics-log.service';
import { AnalyticsParserService } from './analytics-parser.service';
import { AnalyticsQueryService } from './analytics-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseEntity]),
    // Provides the AGENT_LOG_PORT token used by AnalyticsLogService.
    AgentLogsModule,
    // Required for AuthGuard to resolve SessionsService in this module's DI context.
    SessionsModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsParserService,
    AnalyticsQueryService,
    AnalyticsLogService,
  ],
  exports: [AnalyticsParserService],
})
export class AnalyticsModule {}
