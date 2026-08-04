import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AnalyticsFunctionsService } from './analytics-functions.service';
import { AnalyticsLogService } from './analytics-log.service';
import { INTENT_EXAMPLES, SUPPORTED_INTENTS } from './analytics-intent';
import { AnalyticsParserService } from './analytics-parser.service';
import { AskAnalyticsDto } from './dto/ask-analytics.dto';

@Controller('api/v1/teacher/analytics')
@UseGuards(AuthGuard, TeacherRoleGuard)
export class AnalyticsController {
  constructor(
    private readonly parserService: AnalyticsParserService,
    private readonly functionsService: AnalyticsFunctionsService,
    private readonly logService: AnalyticsLogService,
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

    const result = await this.functionsService.execute(parsed.intent, {
      teacherId: user.id,
      from: parsed.dateFrom,
      to: parsed.dateTo,
    });

    await this.logService.record({
      action: `analytics_query.${parsed.intent}`,
      status: 'success',
      metadata: { dateFrom: parsed.dateFrom, dateTo: parsed.dateTo },
      rowCount: result.rowCount,
      durationMs: Date.now() - started,
    });

    return {
      status: 'success',
      intent: parsed.intent,
      result,
    };
  }
}
