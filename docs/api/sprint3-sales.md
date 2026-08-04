# Sales API — Sprint 3 (A-4 / CF-TASK-065, CF-TASK-068)

Teacher sales metrics sourced from backend orders only (`CF-US-016`). Follows `docs/api-conventions.md` conventions.

## Guards

`AuthGuard` + `TeacherRoleGuard`. Every aggregate is scoped to the courses the teacher owns via `CoursesService.findOwnedCourses` — a teacher who owns zero courses gets a zero summary, and another teacher's revenue is never included (same "don't confirm existence" posture as agent logs).

## `GET /api/v1/teacher/sales/summary?from&to`

Both filters optional. Dates are parsed, invalid values return `400`; `from >= to` returns `400`. The range is **half-open `[from, to)`** internally, while displayed user dates are inclusive (sprint3-plan.md CF-US-016 blockers/decisions).

Only `paid` orders count. Failed, declined, and reset orders are excluded by construction (`status = 'paid'`).

```json
{
  "from": "2026-08-01T00:00:00.000Z" | null,
  "to": "2026-08-04T00:00:00.000Z" | null,
  "currency": "EGP",
  "timezone": "Africa/Cairo",
  "revenueMinor": 150000,
  "ordersCount": 3,
  "bestSeller": {
    "courseId": "uuid",
    "title": "الميكانيكا الكلاسيكية",
    "ordersCount": 2,
    "revenueMinor": 100000
  } | null
}
```

`revenueMinor` is integer EGP minor units (1/100 EGP) — the UI renders it, never recomputes money.

## Reconciliation contract

`apps/api/test/sales.e2e-spec.ts` verifies the response against an independent raw-SQL ledger query (CF-TASK-068): totals must exactly match the order rows. It also covers teacher isolation, declined-order exclusion, range validation, and student-forbidden access.

## Frontend

Nabile's sales metrics view (CF-TASK-066/067) uses date filter → tiles (`revenueMinor`, `ordersCount`) + best-seller card, with loading/empty/error/forbidden states.

## Known gaps

No live-Postgres e2e run in this environment. Verified via `npm run test:api` (mocked QueryBuilder specs) and `tsc --noEmit`. e2e suite is ready for a DB-backed run.
