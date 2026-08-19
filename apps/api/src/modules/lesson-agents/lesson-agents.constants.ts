/**
 * The agent roster, in the order they hand off to one another.
 *
 * Single source of truth for the API: the service seeds a run's steps
 * from `AGENT_ROSTER`, the worker walks the same order (mirrored in
 * `apps/worker/src/agents/roster.ts` — the two apps are separate
 * deployables with no shared package, the same reason
 * `exam-llm.adapter.ts` duplicates the tutor's OpenAI client), and the
 * web renders the timeline from the labels it ships in the run payload.
 */
export type LessonAgentKey =
  'transcript' | 'reviewer' | 'indexer' | 'handout' | 'quizmaster' | 'notifier';

export interface AgentDefinition {
  key: LessonAgentKey;
  /** Shown as the card title on the teacher's timeline. */
  name: string;
  /** One line describing the agent's job, shown under its name. */
  role: string;
  /** Material Symbols glyph, matching the icon vocabulary in the web app. */
  icon: string;
  /**
   * Mandatory agents have no settings toggle. Together they are what
   * makes a lesson answerable by the student assistant, which is the
   * guarantee this pipeline never gives up — see the migration docblock.
   */
  mandatory: boolean;
  /** Whether the teacher approves/rejects/comments on this agent's output. */
  reviewable: boolean;
}

export const AGENT_ROSTER: readonly AgentDefinition[] = [
  {
    key: 'transcript',
    name: 'المُفرِّغ',
    role: 'يستخرج نص الفيديو كلمة بكلمة مع توقيتها',
    icon: 'graphic_eq',
    mandatory: true,
    reviewable: false,
  },
  {
    key: 'reviewer',
    name: 'المُراجِع',
    role: 'يتأكد إن محتوى الفيديو مناسب للطلاب وفي صميم المادة',
    icon: 'verified_user',
    mandatory: true,
    reviewable: false,
  },
  {
    key: 'indexer',
    name: 'المُفهرِس',
    role: 'يقسّم النص ويحوّله لفهرس دلالي عشان الطالب يسأل فيه',
    icon: 'account_tree',
    mandatory: true,
    reviewable: false,
  },
  {
    key: 'handout',
    name: 'كاتب الشرح',
    role: 'يكتب مذكّرة شرح كاملة للدرس ويطلعها PDF',
    icon: 'menu_book',
    mandatory: false,
    reviewable: true,
  },
  {
    key: 'quizmaster',
    name: 'واضع الأسئلة',
    role: 'يصيغ اختبارًا من الدرس على المستوى اللي اخترته',
    icon: 'quiz',
    mandatory: false,
    reviewable: true,
  },
  {
    key: 'notifier',
    name: 'مراسل البريد',
    role: 'يبعتلك على الإيميل ملخص باللي الفريق عمله أول ما يخلص',
    icon: 'mail',
    mandatory: false,
    reviewable: false,
  },
] as const;

export const AGENT_BY_KEY: Readonly<Record<LessonAgentKey, AgentDefinition>> =
  Object.fromEntries(AGENT_ROSTER.map((agent) => [agent.key, agent])) as Record<
    LessonAgentKey,
    AgentDefinition
  >;

/**
 * How much the handout says, not what voice it says it in. Replaced
 * `HandoutTone` (see migration 1786613800000) — teachers were reaching
 * for this control to make the notes longer or shorter, which a tone
 * setting could not do.
 */
export type HandoutDetailLevel = 'concise' | 'standard' | 'deep';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizQuestionType = 'mcq' | 'true_false';

export const HANDOUT_DETAIL_LEVELS: readonly HandoutDetailLevel[] = [
  'concise',
  'standard',
  'deep',
];
export const QUIZ_DIFFICULTIES: readonly QuizDifficulty[] = [
  'easy',
  'medium',
  'hard',
];
export const QUIZ_QUESTION_TYPES: readonly QuizQuestionType[] = [
  'mcq',
  'true_false',
];

/**
 * Bounds are enforced in the DTO too; they live here so the worker's
 * prompt builder and the settings form quote the same numbers. The page
 * ceiling is what one LLM call can fill with real content without
 * padding, not a technical limit of the PDF writer.
 */
export const HANDOUT_PAGE_RANGE = { min: 1, max: 12 } as const;
/**
 * Per type, and the floor is 0 — a teacher wanting MCQ only sets
 * true/false to zero. The service rejects a spec that is zero on both.
 */
export const QUIZ_QUESTION_RANGE = { min: 0, max: 30 } as const;
export const QUIZ_DUE_DAYS_RANGE = { min: 1, max: 90 } as const;

/**
 * The config snapshot stored on `lesson_agent_runs.config`. Frozen at
 * submit time so a later settings change never rewrites the history of
 * a finished run.
 */
export interface LessonAgentRunConfig {
  enabledAgents: LessonAgentKey[];
  handout: {
    pageCount: number;
    detailLevel: HandoutDetailLevel;
    includeExamples: boolean;
    includeKeyTerms: boolean;
    includeSummary: boolean;
  };
  quiz: {
    difficulty: QuizDifficulty;
    mcqCount: number;
    trueFalseCount: number;
    dueInDays: number;
  };
}
