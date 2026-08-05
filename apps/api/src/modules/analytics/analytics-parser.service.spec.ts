import { AnalyticsParserService } from './analytics-parser.service';

describe('AnalyticsParserService', () => {
  let service: AnalyticsParserService;

  beforeEach(() => {
    service = new AnalyticsParserService();
  });

  it.each([
    ['عندي كام طالب؟', 'student_count'],
    ['كم طالب عندي في دوراتي؟', 'student_count'],
    ['عندي كام كورس؟', 'course_count'],
    ['عدد الدورات عندي كام؟', 'course_count'],
    ['كام طالب محتاج متابعة؟', 'active_interventions'],
    ['عندي كام تدخلات نشطة؟', 'active_interventions'],
    ['أهلا', 'assistant_intro'],
    ['أهلاً', 'assistant_intro'],
  ])('parses "%s" as %s', (question, intent) => {
    expect(service.parse(question).intent).toBe(intent);
  });
});
