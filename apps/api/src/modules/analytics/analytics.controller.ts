import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CourseEntity } from '../courses/entities/course.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AnalyticsLogService } from './analytics-log.service';
import { INTENT_EXAMPLES, SUPPORTED_INTENTS } from './analytics-intent';
import { AnalyticsParserService } from './analytics-parser.service';
import { AnalyticsQueryService } from './analytics-query.service';
import { AskAnalyticsDto } from './dto/ask-analytics.dto';

@Controller('api/v1/teacher/analytics')
@UseGuards(AuthGuard, TeacherRoleGuard)
export class AnalyticsController {
  constructor(
    private readonly parserService: AnalyticsParserService,
    private readonly queryService: AnalyticsQueryService,
    private readonly logService: AnalyticsLogService,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
  ) {}

  @Post('questions')
  async ask(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AskAnalyticsDto,
  ) {
    const started = Date.now();
    const parsed = this.parserService.parse(dto.question);

    if (parsed.intent === 'unsupported') {
      // No aggregate query is executed for unsupported input.
      await this.logService.record({
        action: 'analytics_query.unsupported',
        status: 'skipped',
        metadata: { reason: 'unsupported_intent' },
        durationMs: Date.now() - started,
      });
      return {
        status: 'unsupported',
        message: 'هذا السؤال غير مدعوم. الأسئلة المدعومة:',
        supportedIntents: SUPPORTED_INTENTS,
        examples: INTENT_EXAMPLES,
      };
    }

    const ownedCourses = await this.courseRepo.find({
      where: { teacherId: user.id, deletedAt: IsNull() },
    });
    const courseIds = ownedCourses.map((c) => c.id);

    const outcome = await this.queryService.run(
      parsed.intent,
      courseIds,
      parsed.dateFrom,
      parsed.dateTo,
    );

    await this.logService.record({
      action: `analytics_query.${parsed.intent}`,
      status: 'success',
      metadata: { dateFrom: parsed.dateFrom, dateTo: parsed.dateTo },
      rowCount: outcome.rowCount,
      durationMs: Date.now() - started,
    });

    return {
      status: 'success',
      intent: parsed.intent,
      result: outcome.result,
    };
  }
}
