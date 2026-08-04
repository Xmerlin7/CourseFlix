# Agent Logs API — Sprint 3 (H-3 / CF-TASK-073, CF-TASK-074)

New `agent_logs` table + teacher-scoped read API. Follows `docs/api-conventions.md` conventions.

## Guards

`AuthGuard` + `TeacherRoleGuard`. Scoped to courses the teacher owns via `CoursesService.findOwnedCourses` — a teacher who owns zero courses, or filters by a `courseId` they don't own, gets an empty list, not a 403 or 404 (same "don't confirm existence" posture as `AgentLogsService.listForTeacher`'s courseId check).

## Schema

`agent_logs` mirrors `schemaV2.sql` (id, agent_type, course_id, target_entity_type/id, action, status, tokens_used, error_message, executed_at), extended for Sprint 3 traceability with `correlation_id`, `duration_ms`, `row_count`, `metadata` (jsonb). `agent_type` gains `analytics_agent`; `agent_log_status` gains `skipped` (so Nabile's Analytics Agent — N-3 — can log an unsupported question without a fake "failed").

## `GET /api/v1/teacher/agent-logs?agentType&status&courseId&from&to`

All filters optional, combine with AND. Capped at 200 rows (operational viewer, not an export tool).

```json
[{
  "id": "uuid",
  "agentType": "proactive_proctor",
  "courseId": "uuid",
  "targetEntityType": "intervention",
  "targetEntityId": "uuid",
  "action": "intervention.created",
  "status": "success",
  "tokensUsed": null,
  "durationMs": 12,
  "rowCount": null,
  "correlationId": "uuid-or-trace-id",
  "metadata": { "ruleKey": "low_quiz_score" },
  "errorMessage": null,
  "executedAt": "2026-08-04T10:00:00.000Z"
}]
```

Invalid `agentType`/`status`/`from`/`to` return `400`.

## AgentLogPort

`record({ agentType, action, status, courseId?, targetEntityType?, targetEntityId?, tokensUsed?, durationMs?, rowCount?, correlationId?, metadata?, errorMessage? })`. `AgentLogsService` implements this directly and is bound via `useExisting` in `agent-logs.module.ts`, same pattern as `NotificationProducerPort`. `correlationId` falls back to the active `getCorrelationId()` (from `common/correlation/`) when the caller doesn't pass one.

**Redaction is enforced by construction, not scrubbing**: the port's input shape has no field for raw prompt text, document text, order PII, or stack traces. `action`/`metadata`/`errorMessage` are the only free-text fields and are returned as-is by the read API — callers (the intervention rule evaluator, later the Analytics Agent) must only ever put short, structured, already-safe values there.

## Frontend

`AgentLogsPage` (`/teacher/agent-logs`, sidebar entry "سجل الوكيل") — chip filters for agent type and status (same `.chip.clickable.outline` pattern as `TeacherCoursesPage`), expandable per-row detail (correlation ID, duration, tokens, row count, metadata) instead of a separate detail route.

## Known gaps

No live Postgres integration test (no DB in this environment). Vitest could not be executed in this environment (Node v26.4.0 crashes Vite's native bundler — pre-existing, unrelated to this change, reproduced on a bare `vite --version`). Verified via `npm run test:api` (8/8 passing, mocked repository/CoursesService) and `tsc --noEmit` (clean) on the web side; `AgentLogsPage.spec.tsx` is written and ready to run once vitest works.
