# Interventions API — Sprint 3 (H-1, H-2 / CF-US-014)

New `interventions`, `intervention_evidence`, and `progress_reports` tables, a deterministic rule evaluator, and student/teacher read APIs. Follows `docs/api-conventions.md` conventions.

## Schema

`interventions` is a Sprint 3 addition beyond `schemaV2.sql` — the umbrella record tying a rule trigger to its report, notification, mini quiz, and agent log. `progress_reports` mirrors `schemaV2.sql` with one added `intervention_id` back-reference. Neither `progress_reports.related_quiz_id` nor `interventions.mini_quiz_id` has an enforced FK to `quizzes(id)`, matching `1785000011000-CreateContentProgress.ts`'s precedent — `quizzes` has entities but no migration yet.

Duplicate-signal protection is a partial unique index: `uq_interventions_active_dedup` on `(dedup_key) WHERE status = 'active'`. A second signal for the same student/course/rule/concept while the first is still active hits a Postgres unique-violation on insert, which `InterventionsService.evaluateSignal` catches and treats as a no-op — no report, notification, or log is created for the duplicate.

## Rules (`intervention-rules.ts`)

Versioned via `INTERVENTION_RULE_VERSION` (currently `1`), stamped on every created intervention:

- `low_quiz_score` — score < 60%.
- `explicit_confusion_phrase` — literal match on `مش فاهم` / "I don't understand" (case-insensitive).
- `repeated_concept_question` — the same normalized question text appears twice in the same student/course conversation.

No rule ever mutates enrollment or suspension state — `InterventionsService` has no dependency capable of that.

## `GET /api/v1/student/interventions`

Guard: `AuthGuard` + `StudentRoleGuard`. Scoped to the caller's own `studentId`.

```json
[{
  "id": "uuid", "courseId": "uuid",
  "ruleKey": "low_quiz_score", "weakConcept": "قوانين نيوتن",
  "status": "active", "miniQuizId": null,
  "createdAt": "2026-08-04T10:00:00.000Z"
}]
```

`miniQuizId` stays `null` until Nabile's N-1 (mini-quiz generation) populates it.

## `GET /api/v1/teacher/interventions`

Guard: `AuthGuard` + `TeacherRoleGuard`. Scoped by the intervention's own stamped `teacherId` (set once at creation from the triggering course's owner) — same shape as the student response plus `studentId`, `studentName`, `ruleVersion`.

## InterventionEvaluatorPort

`evaluateSignal(signal)` where `signal` is `{ kind: 'quiz_score', ... }` or `{ kind: 'chat_message', ... }`. `InterventionsService` implements this directly, bound via `useExisting` in `interventions.module.ts`. Wired live into:

- `quizzes.service.ts`'s `submitQuiz()` — after the submission transaction commits, `evaluateSignal({ kind: 'quiz_score', weakConcept: quiz.title, ... })`.
- `tutor.service.ts`'s `sendMessage()` — after the student's chat message is saved, `evaluateSignal({ kind: 'chat_message', messageText, priorMessageTexts, ... })`, where `priorMessageTexts` is gathered *before* the save so a message never matches itself as a "repeat."

Both call sites treat evaluation as a best-effort side effect: failures are logged (`Logger.warn`) and never block or fail the primary quiz-submission/Tutor response.

## Side effects on trigger

Inside one DB transaction: insert the `interventions` row (the dedup gate) → insert `progress_reports` (with `flaggedConcept` = the concept label) → insert `intervention_evidence` (a short deterministic description, never raw chat/answer text). After commit, best-effort via `Promise.allSettled`: notify the student, notify the teacher, and write one `agent_logs` entry (`agentType: 'proactive_proctor'`) — all three carry `relatedEntityId`/`targetEntityId` = the intervention's ID, so report/notification/log reconcile to one record.

## Known gaps

Mini-quiz generation (Nabile's N-1) is not implemented here — `miniQuizId` is always `null` until that module populates it. The `explicit_confusion_phrase`/`repeated_concept_question` chat rules use a course-title-level concept label (no per-message concept tagging exists in the Tutor schema today); this is a documented simplification, not a bug. No live Postgres integration test (no DB in this environment) — the dedup unique-violation path is tested by mocking a `23505` error from `queryRunner.manager.save`, not against a real index. Vitest could not be executed in this environment (Node v26.4.0 crashes Vite's native bundler — pre-existing, unrelated to this change). Verified via `npm run test:api` (142/142 passing across the whole API, including 11 rule tests + 11 service tests) and `tsc --noEmit`/`tsc -b --noEmit` (clean on both apps).
