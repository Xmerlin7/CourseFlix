export type LessonAgentKey =
  | 'transcript'
  | 'reviewer'
  | 'indexer'
  | 'handout'
  | 'quizmaster';

/**
 * Display names for the agents, used to write the handoff narration the
 * teacher reads ("المُفرِّغ سلّم النص للمُفهرِس").
 *
 * Mirrors `apps/api/src/modules/lesson-agents/lesson-agents.constants.ts`
 * — same duplication rationale as `exam-llm.adapter.ts`: the API and the
 * worker are separate deployables with no shared package. Only the names
 * are copied, because names are all the worker needs; the API owns the
 * roles, icons and enablement rules.
 */
export const AGENT_NAMES: Readonly<Record<LessonAgentKey, string>> = {
  transcript: 'المُفرِّغ',
  reviewer: 'المُراجِع',
  indexer: 'المُفهرِس',
  handout: 'كاتب الشرح',
  quizmaster: 'واضع الأسئلة',
};

/** Execution order — each agent hands off to the next enabled one. */
export const AGENT_ORDER: readonly LessonAgentKey[] = [
  'transcript',
  'reviewer',
  'indexer',
  'handout',
  'quizmaster',
];

/** The two the teacher approves/rejects/comments on. */
export const REVIEWABLE_AGENTS: readonly LessonAgentKey[] = [
  'handout',
  'quizmaster',
];

export type HandoutTone = 'simple' | 'academic' | 'exam_focused';

/** Frozen snapshot read from `lesson_agent_runs.config`. */
export interface LessonAgentRunConfig {
  enabledAgents: LessonAgentKey[];
  handout: {
    pageCount: number;
    tone: HandoutTone;
    includeExamples: boolean;
    includeKeyTerms: boolean;
    includeSummary: boolean;
  };
  quiz: {
    difficulty: string;
    questionCount: number;
    types: Array<'mcq' | 'true_false'>;
    dueInDays: number;
  };
}
