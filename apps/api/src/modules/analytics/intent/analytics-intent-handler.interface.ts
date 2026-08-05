import type { SalesRange } from '../../sales/sales.service';

/**
 * The Analytics Agent's allowlist (sprint3-plan.md E-4 / CF-TASK-070).
 * Exactly three intents — anything else is rejected before any aggregate
 * query runs ("Unsupported Analytics Agent question performs no aggregate
 * query"). Nabile's parser (CF-TASK-069) validates against
 * `AnalyticsFunctionsService.isSupported`/`supportedIntents` before calling.
 */
export const ANALYTICS_INTENTS = [
  'revenue',
  'order_count',
  'best_sellers',
  'student_count',
  'course_count',
  'active_interventions',
] as const;

export type AnalyticsIntentName = (typeof ANALYTICS_INTENTS)[number];

export interface AnalyticsIntentContext extends SalesRange {
  /** Always forwarded to SalesService, which scopes to owned courses only. */
  teacherId: string;
}

/**
 * Base shape returned by every intent handler and surfaced by the
 * `POST /api/v1/teacher/analytics/questions` endpoint. Money is integer
 * EGP minor units (1/100 EGP); `rowCount` feeds the agent-log record.
 */
export interface AnalyticsResultBase {
  intent: AnalyticsIntentName;
  dateRange: { from: string | null; to: string | null };
  rowCount: number;
}

export interface RevenueIntentResult extends AnalyticsResultBase {
  intent: 'revenue';
  totalRevenue: number;
  currency: string;
  orderCount: number;
}

export interface OrderCountIntentResult extends AnalyticsResultBase {
  intent: 'order_count';
  successfulOrderCount: number;
}

export interface BestSellersIntentResult extends AnalyticsResultBase {
  intent: 'best_sellers';
  bestSellers: Array<{
    courseId: string;
    courseTitle: string;
    orderCount: number;
    totalRevenue: number;
  }>;
}

export interface StudentCountIntentResult extends AnalyticsResultBase {
  intent: 'student_count';
  activeStudentCount: number;
  enrollmentCount: number;
}

export interface CourseCountIntentResult extends AnalyticsResultBase {
  intent: 'course_count';
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
}

export interface ActiveInterventionsIntentResult extends AnalyticsResultBase {
  intent: 'active_interventions';
  activeInterventionCount: number;
  affectedStudentCount: number;
}

export type AnalyticsIntentResult =
  | RevenueIntentResult
  | OrderCountIntentResult
  | BestSellersIntentResult
  | StudentCountIntentResult
  | CourseCountIntentResult
  | ActiveInterventionsIntentResult;

export interface AnalyticsIntentHandler {
  readonly name: AnalyticsIntentName;
  handle(context: AnalyticsIntentContext): Promise<AnalyticsIntentResult>;
}
