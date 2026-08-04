export type AnalyticsIntent =
  'revenue' | 'order_count' | 'best_sellers' | 'unsupported';

export interface ParsedIntent {
  intent: AnalyticsIntent;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
}

export const SUPPORTED_INTENTS: Array<{ intent: string; description: string }> =
  [
    { intent: 'revenue', description: 'إجمالي الإيرادات خلال فترة محددة' },
    {
      intent: 'order_count',
      description: 'عدد الطلبات الناجحة خلال فترة محددة',
    },
    { intent: 'best_sellers', description: 'الأكثر مبيعاً من الدورات' },
  ];

export const INTENT_EXAMPLES = [
  'كم إيراداتي من 1 يناير إلى 31 مارس؟',
  'عدد الطلبات الناجحة هذا الشهر',
  'ما هي الدورات الأكثر مبيعاً؟',
];
