# Analytics Question Endpoint — Sprint 3 (CF-TASK-069/070/071, CF-US-018)

The Analytics Agent's only allowed backend surface. A deterministic Arabic/English
parser (Nabile, CF-TASK-069) resolves the teacher's question to one of three
allowlisted intents, then the permission-scoped function registry (Albraa,
CF-TASK-070) executes it through `SalesService`. There is **no raw SQL and no
arbitrary-expression path** (enforced by Seif's CF-TASK-072 suite).

## Endpoint

`POST /api/v1/teacher/analytics/questions` (auth: `AuthGuard` + `TeacherRoleGuard`)

```json
{ "question": "كم إيراداتي هذا الشهر؟" }
```

Unsupported questions return `status: "unsupported"` with `supportedIntents` and
`examples` — **no aggregate query runs**. Supported questions return
`status: "success"` with the intent result below.

## Allowlist

Exactly three intents (sprint3-plan.md E-4 / CF-TASK-070):

| Intent | Result shape |
|---|---|
| `revenue` | `{ intent, totalRevenue, currency, orderCount, dateRange }` |
| `order_count` | `{ intent, successfulOrderCount, dateRange }` |
| `best_sellers` | `{ intent, bestSellers[], dateRange }` |

- Money is integer EGP minor units (1/100 EGP) — the UI renders (`minor / 100`),
  never recomputes.
- `bestSellers[]` items: `{ courseId, courseTitle, orderCount, totalRevenue }`.
- `dateRange` is `{ from, to }` (ISO or `null` when unbounded).

Anything else → `BadRequestException` (`400`) thrown **before** any aggregate
query runs. `AnalyticsFunctionsService.isSupported()` / `supportedIntents`
short-circuit invalid questions.

## Security

- Every intent is scoped to the teacher's owned courses via `SalesService` —
  another teacher's revenue/counts can never appear.
- Only `paid` orders from the `orders`/`order_items` ledger count.
- Range validation (`from >= to` → 400) lives in `SalesService`.

## Files

```
apps/api/src/modules/analytics/
  analytics.module.ts                       # wires parser + registry + controller
  analytics.controller.ts                   # POST api/v1/teacher/analytics/questions
  analytics-parser.service.ts               # deterministic Arabic/English parser
  analytics-intent.ts                       # intent names, SUPPORTED_INTENTS, examples
  analytics-log.service.ts                  # agent-log records (analytics_agent)
  analytics-functions.service.ts            # registry: name → handler
  analytics-functions.service.spec.ts       # fixture + ownership tests (CF-TASK-070)
  intent/analytics-intent-handler.interface.ts
  intent/revenue.handler.ts
  intent/order-count.handler.ts
  intent/best-sellers.handler.ts
```

## Known gaps

- No explicit per-intent UI test for the endpoint shape beyond
  `analytics-functions.service.spec.ts` (mocked `SalesService`) and the web
  `TeacherAnalyticsPage` spec. A live-Postgres ledger e2e for the underlying
  aggregates lives in `sales.e2e-spec.ts`.
