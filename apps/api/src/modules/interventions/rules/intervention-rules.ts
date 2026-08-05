import { InterventionRuleKey } from '../entities/intervention.entity';

/**
 * Versioned deterministic rules (sprint3-plan.md §4 H-1). Bumping
 * `INTERVENTION_RULE_VERSION` changes what gets stamped on new
 * interventions going forward; it never rewrites already-created rows,
 * which is exactly why `rule_version` is stored per-row instead of
 * being implied by "whatever the code does today."
 */
export const INTERVENTION_RULE_VERSION = 1;

export const LOW_QUIZ_SCORE_THRESHOLD_PERCENT = 60;

// Deliberately literal, matching sprint3-plan.md's exact demo phrases —
// not a general sentiment classifier.
const CONFUSION_PHRASES = ['مش فاهم', "i don't understand"];
const CONFUSION_PATTERNS = [
  /مش فاهم(?:ة|ه)?/,
  /مش مستوعب(?:ة)?/,
  /مش واضح/,
  /مفهمتش/,
  /مو فاهم/,
  /مش عارف افهم/,
  /مش عارف أفهم/,
  /i don't understand/,
  /i do not understand/,
  /i'm confused/,
  /i am confused/,
];

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function evaluateLowQuizScore(scorePercent: number): boolean {
  return scorePercent < LOW_QUIZ_SCORE_THRESHOLD_PERCENT;
}

export function detectExplicitConfusionPhrase(messageText: string): boolean {
  const normalized = normalize(messageText);
  return (
    CONFUSION_PHRASES.some((phrase) => normalized.includes(phrase)) ||
    CONFUSION_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}

// A student asking the exact same normalized question again, in the
// same course, is treated as "repeated concept question" — deterministic
// and traceable, not an NLP topic-similarity judgment.
export function detectRepeatedConceptQuestion(
  messageText: string,
  priorMessageTexts: string[],
): boolean {
  const normalized = normalize(messageText);
  if (!normalized) {
    return false;
  }
  return priorMessageTexts.some((prior) => normalize(prior) === normalized);
}

export interface ChatRuleResult {
  ruleKey: InterventionRuleKey;
  evidenceDetail: string;
}

// Chat-based rules are mutually exclusive per message: explicit phrase
// takes priority since it's the stronger, more literal signal.
export function evaluateChatMessage(
  messageText: string,
  priorMessageTexts: string[],
): ChatRuleResult | null {
  if (detectExplicitConfusionPhrase(messageText)) {
    return {
      ruleKey: 'explicit_confusion_phrase',
      evidenceDetail: 'الطالب استخدم عبارة تدل على عدم الفهم في المحادثة.',
    };
  }

  if (detectRepeatedConceptQuestion(messageText, priorMessageTexts)) {
    return {
      ruleKey: 'repeated_concept_question',
      evidenceDetail: 'نفس السؤال تكرر أكثر من مرة في نفس المحادثة.',
    };
  }

  return null;
}
