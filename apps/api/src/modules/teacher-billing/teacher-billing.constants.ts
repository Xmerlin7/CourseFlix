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
} as const;
