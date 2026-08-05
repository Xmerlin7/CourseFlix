import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  AnalyticsIntentContext,
  AnalyticsIntentHandler,
  AnalyticsIntentName,
  AnalyticsIntentResult,
} from './intent/analytics-intent-handler.interface';
import { ANALYTICS_INTENTS } from './intent/analytics-intent-handler.interface';
import { ActiveInterventionsIntentHandler } from './intent/active-interventions.handler';
import { BestSellersIntentHandler } from './intent/best-sellers.handler';
import { CourseCountIntentHandler } from './intent/course-count.handler';
import { OrderCountIntentHandler } from './intent/order-count.handler';
import { RevenueIntentHandler } from './intent/revenue.handler';
import { StudentCountIntentHandler } from './intent/student-count.handler';

/**
 * Permission-scoped analytics function registry (CF-TASK-070, CF-US-018).
 * The Analytics Agent is limited to the three allowlisted handlers below —
 * there is no SQL or arbitrary-expression path, and the only way to reach
 * the orders ledger is through SalesService, which scopes every query to
 * the caller's owned courses.
 *
 * Nabile's parser (CF-TASK-069) resolves a normalized intent name and
 * calls `execute`, or short-circuits with `isSupported`/`supportedIntents`
 * before ever reaching an aggregate query.
 */
@Injectable()
export class AnalyticsFunctionsService {
  private readonly registry = new Map<
    AnalyticsIntentName,
    AnalyticsIntentHandler
  >();

  constructor(
    revenue: RevenueIntentHandler,
    orderCount: OrderCountIntentHandler,
    bestSellers: BestSellersIntentHandler,
    studentCount: StudentCountIntentHandler,
    courseCount: CourseCountIntentHandler,
    activeInterventions: ActiveInterventionsIntentHandler,
  ) {
    for (const handler of [
      revenue,
      orderCount,
      bestSellers,
      studentCount,
      courseCount,
      activeInterventions,
    ]) {
      this.registry.set(handler.name, handler);
    }
  }

  get supportedIntents(): readonly AnalyticsIntentName[] {
    return ANALYTICS_INTENTS;
  }

  isSupported(name: string): name is AnalyticsIntentName {
    return (ANALYTICS_INTENTS as readonly string[]).includes(name);
  }

  async execute(
    name: string,
    context: AnalyticsIntentContext,
  ): Promise<AnalyticsIntentResult> {
    const handler = this.registry.get(name as AnalyticsIntentName);
    if (!handler) {
      throw new BadRequestException(
        `Unsupported analytics intent: "${name}". Supported intents: ${ANALYTICS_INTENTS.join(', ')}.`,
      );
    }
    return handler.handle(context);
  }
}
