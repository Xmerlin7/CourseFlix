export type AnalyticsIntent =
  | 'revenue'
  | 'order_count'
  | 'best_sellers'
  | 'student_count'
  | 'course_count'
  | 'active_interventions'
  | 'assistant_intro'
  | 'unsupported';

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
    {
      intent: 'student_count',
      description: 'عدد الطلاب المسجلين في دوراتك',
    },
    {
      intent: 'course_count',
      description: 'عدد دوراتك وحالتها',
    },
    {
      intent: 'active_interventions',
      description: 'عدد الطلاب أو الحالات التي تحتاج متابعة',
    },
  ];

export const INTENT_EXAMPLES = [
  'كم إيراداتي من 1 يناير إلى 31 مارس؟',
  'عدد الطلبات الناجحة هذا الشهر',
  'ما هي الدورات الأكثر مبيعاً؟',
  'عندي كام طالب؟',
  'عندي كام كورس؟',
  'كام طالب محتاج متابعة؟',
];
