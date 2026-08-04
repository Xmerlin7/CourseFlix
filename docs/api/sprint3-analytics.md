# Analytics Function Registry — Sprint 3 (CF-TASK-070, CF-US-018)

The Analytics Agent's only allowed backend surface. Albraa exposes a **permission-scoped function registry**; Nabile's parser (`CF-TASK-069`) and Elgendy's UI (`CF-TASK-071`) consume it. There is **no HTTP route in this branch** — `POST /api/v1/teacher/analytics/questions` is Nabile's (parser + validation), and Seif's `CF-TASK-072` security suite enforces "no raw SQL execution path".

## Allowlist

Exactly three intents (sprint3-plan.md E-4 / CF-TASK-070):

| Intent | Result |
|---|---|
| `revenue` | `{ intent, currency: 'EGP', timezone, revenueMinor }` |
| `sales_count` | `{ intent, currency, timezone, ordersCount }` |
| `best_sellers` | `{ intent, currency, timezone, bestSellers[] }` |

Anything else → `BadRequestException` (`400`) thrown **before** any aggregate query runs ("unsupported Analytics Agent question performs no aggregate query"). `AnalyticsFunctionsService.isSupported()` / `supportedIntents` let Nabile's parser short-circuit invalid questions.

## Contract for Nabile

```ts
// import { AnalyticsFunctionsService } from '../analytics/analytics-functions.service';
const answer = await analyticsFunctions.execute('revenue', {
  teacherId,           // authenticated teacher id — always required
  from?: string,       // optional ISO date
  to?: string,         // optional ISO date
});
```

- Every call is scoped to the teacher's owned courses via `SalesService` — another teacher's revenue/counts can never appear.
- Money is integer EGP minor units (`revenueMinor`, 1/100 EGP) — same shape as the sales summary; the UI/Agent renders, never recomputes.
- Range validation (`from >= to` → 400) lives in `SalesService`.

## Files

```
apps/api/src/modules/analytics/
  analytics.module.ts                       # exports AnalyticsFunctionsService
  analytics-functions.service.ts            # registry: name → handler
  analytics-functions.service.spec.ts       # fixture + ownership tests (CF-TASK-070 validation)
  intent/analytics-intent-handler.interface.ts
  intent/revenue.handler.ts
  intent/sales-count.handler.ts
  intent/best-sellers.handler.ts
```

## Known gaps

- Endpoint-level e2e belongs to Nabile's `/questions` branch + Seif's no-SQL suite; here the registry is verified by `analytics-functions.service.spec.ts` (mocked `SalesService`). A live-Postgres ledger e2e for the underlying aggregates lives in `sales.e2e-spec.ts` (Branch 2).
