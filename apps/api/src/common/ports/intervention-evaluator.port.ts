import { Injectable, Logger } from '@nestjs/common';

/**
 * Sprint 3 day-1 contract (sprint3-plan.md §4 H-1, CF-US-014) — the one
 * entry point every producer of a struggle signal calls. Rule decision
 * logic (thresholds, phrase matching, repetition detection, versioning,
 * dedup) all lives in `InterventionsService`/`intervention-rules.ts`,
 * not in the caller, so quizzes/tutor modules stay simple event
 * reporters. `messageText`/`priorMessageTexts` are used transiently for
 * in-memory rule evaluation only — nothing raw is ever persisted from
 * them (see `intervention-rules.ts` and `intervention-evidence.entity.ts`).
 *
 * Same `useExisting` binding pattern as the other Sprint 2/3 ports.
 * `NoopInterventionEvaluator` is only for a caller module that needs the
 * port before `InterventionsModule` is in its graph.
 */
export const INTERVENTION_EVALUATOR_PORT = Symbol(
  'INTERVENTION_EVALUATOR_PORT',
);

export type InterventionSignal =
  | {
      kind: 'quiz_score';
      studentId: string;
      courseId: string;
      weakConcept: string;
      scorePercent: number;
      evidenceRefId: string;
    }
  | {
      kind: 'chat_message';
      studentId: string;
      courseId: string;
      messageText: string;
      priorMessageTexts: string[];
      evidenceRefId: string;
    };

export interface InterventionEvaluatorPort {
  evaluateSignal(signal: InterventionSignal): Promise<void>;
}

@Injectable()
export class NoopInterventionEvaluator implements InterventionEvaluatorPort {
  private readonly logger = new Logger(NoopInterventionEvaluator.name);

  evaluateSignal(signal: InterventionSignal): Promise<void> {
    this.logger.log(`(noop) evaluate signal ${signal.kind}`);
    return Promise.resolve();
  }
}
