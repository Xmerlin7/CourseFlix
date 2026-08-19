/**
 * Credit cost of each AI operation, in the "one credit = one operation"
 * unit the admin sees. Tuned so a monthly allowance of 100 credits lasts
 * a busy month of exam generation and tutor chats.
 */
export const CREDIT_COSTS = {
  /** One exam-generation request submitted by the teacher. */
  examGeneration: 5,
  /** One teacher chat turn with the analytics/tutor assistant. */
  tutorMessage: 1,
  /**
   * The lesson agent pipeline, priced **per agent** rather than per run,
   * because the teacher chooses which agents run and can send a single
   * one back for a rewrite — a flat per-run price would either overcharge
   * a transcribe-and-index-only run or undercharge five handout retries.
   *
   * Relative weights follow the work each agent actually does:
   *  - `transcript` — one captions fetch, or a Whisper pass on a local
   *    file, which is the expensive case and why it isn't free.
   *  - `reviewer` — one short moderation LLM call over a capped excerpt.
   *  - `indexer` — no LLM, but an embedding call per chunk.
   *  - `quizmaster` — the same job `examGeneration` charges 5 for, so it
   *    is priced the same; charging differently for identical work would
   *    just push teachers to whichever route was cheaper.
   *  - `handout` — the most expensive by far: a much longer generation
   *    (12k output tokens vs the exam's 4k) plus its own embedding pass
   *    over the PDF it produces.
   *
   * A full five-agent run therefore costs 14, and a handout rewrite after
   * feedback costs 6 — the same as having asked for it the first time.
   */
  lessonAgent: {
    transcript: 1,
    reviewer: 1,
    indexer: 1,
    handout: 6,
    quizmaster: 5,
  },
} as const;
