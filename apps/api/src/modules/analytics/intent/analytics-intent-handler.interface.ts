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
  'sales_count',
  'best_sellers',
] as const;

export type AnalyticsIntentName = (typeof ANALYTICS_INTENTS)[number];

export interface AnalyticsIntentContext extends SalesRange {
  /** Always forwarded to SalesService, which scopes to owned courses only. */
  teacherId: string;
}

export interface AnalyticsIntentHandler {
  readonly name: AnalyticsIntentName;
  handle(context: AnalyticsIntentContext): Promise<unknown>;
}
