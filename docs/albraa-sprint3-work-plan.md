# Albraa — Sprint 3 Personal Work Plan (CourseFlix)

> Member: **Albraa (البراء)** · Sprint: **3** (Mon **Aug 3** → Thu **Aug 6**, 2026)
> Source of truth: `docs/sprint3-plan.md`, `docs/courseflix-scrum-jira-plan.md`, `CONTRIBUTING.md`
> Status generated against `origin/dev` HEAD `baa8c45` (Aug 4) — PRs #48–#53 already merged.

---

## 1. Your exact scope in Sprint 3

Your A-items in this sprint (everything else belongs to teammates — see §2):

| Sprint item | Jira ticket(s) | Deliverable |
|---|---|---|
| **A-1** Commerce API — test checkout | `CF-TASK-058` (orders), `CF-TASK-059` (payments) | Backend: order/order-item/payment entities, migrations, guard-protected REST API. **Test adapter only, no production provider** |
| **A-2** Sales / back-office API | `CF-TASK-065`, `CF-TASK-068` | Backend: orders-from-DB + sales metrics endpoints for the teacher dashboard |
| **A-3** Analytics functions | `CF-TASK-070` | Backend: the 3 allowed analytics functions (overall revenue, sales count, recent orders) |
| **A-4** Sprint cross-coordination | `CF-TASK-082`, `CF-TASK-085`, `CF-TASK-087`, `CF-TASK-088` | Day-1 contract review, PR review of teammates, dataLayer contract, release rehearsal |
| **A-5** Tests | part of A-1/A-2 branches | API e2e tests for checkout + sales endpoints (NestJS `supertest`, same pattern as existing spec files) |

**Out of your scope this sprint (so you don't touch them):**
- Checkout UI (Elgendy — will consume your A-1 API).
- Sales UI / Analytics Agent (Nabile — will consume your A-2/A-3 API).
- GTM / dataLayer live tags (Seif) — you only keep the dataLayer contract.
- Real payments provider, OCR/PPTX, auto-suspension, full proctoring, analytics exports (deferred to later sprints).

---

## 2. Dependencies

### 2.1 What you need before you start (upstream)

| Depends on | Team | Why / what you consume | Status |
|---|---|---|---|
| `AgentLogsService` (agent-logs module) | Seif | **A-3** sales analytics reuse this exact service (`listForTeacher`) | ✅ merged (PR #52, Aug 4) |
| Enrollments module + `Enrollment` entity | Habsa | **A-1** orders reference enrollments; `student.enroll` flow | ✅ exists on `dev` |
| Auth guards `AuthGuard` / `StudentRoleGuard` / `TeacherRoleGuard` | Albraa (yours) | Standard for every new controller | ✅ exists on `dev` |
| Notifications module | Habsa / abdallah | May publish "purchase confirmed" via the same pattern | ✅ merged (PR #51, Aug 4) |
| Interventions PR | Habsa / abdallah | Already merged — keep your work rebased on latest `dev` | ✅ merged (PR #53, Aug 4) |

### 2.2 Who depends on you (downstream)

| Consumes you | Team | What they need |
|---|---|---|
| Checkout UI (feature branch) | Elgendy | Your A-1 REST API contract (`api/v1/student/checkout/...`) — **must be finalized in the Day-1 contract PR** so he can build against it in parallel |
| Sales UI + Analytics Agent | Nabile | Your A-2/A-3 endpoint shapes (`api/v1/teacher/sales/metrics`, `.../sales/recent`) |
| E2E release test | Seif | A-1 + A-2 endpoints present and green on `dev` before the release rehearsal (Aug 6) |

> ⚠️ **You are effectively a dependency source for Elgendy and Nabile.** The Day-1 contract PR (branch `feature/cf-s3-contracts`, merged into `dev` early) is how you unlock them — do NOT skip it. This is the only "blocking" relationship you carry, and it's resolved by sharing the contract first, not by finishing the whole backend.

**Are you blocked by anyone?** No. All upstream pieces are already merged. You can start **now** from latest `dev`.

---

## 3. Git workflow rules (from CONTRIBUTING.md — mandatory)

1. **Branch from `dev`, never from `main`.** Merge targets below are always `dev`.
2. Branch naming: lowercase kebab-case + Jira key, e.g. `feature/cf-s3-commerce`.
3. One story per branch (do not mix A-1 and A-2 in one PR).
4. Conventional commits: `type(scope): subject (JIRA-KEY)` — scope is `api`, `web`, or `docs`. Examples:
   - `feat(api): add order and order-item entities (CF-TASK-058)`
   - `test(api): e2e checkout flow with test payment adapter (CF-TASK-059)`
   - `docs(api): document checkout and sales endpoints (CF-TASK-058)`
5. Before PR: rebase on latest `dev`, run lint/format/typecheck + tests (see §8).
6. Open a PR into `dev` (not `main`), request review from Habsa or Seif, and **do not self-merge without independent approval** (CF-TASK-085 is your own PR-review obligation).
7. Keep the existing merge style on the repo: PR merged into `dev`; history uses merge commits / squash per PR.

---

## 4. Branch plan (3 branches, in order)

### Branch 1 — `feature/cf-s3-commerce`  ← A-1 (`CF-TASK-058`, `CF-TASK-059`)

- **From:** `dev` (after you've rebased on `baa8c45`/latest)
- **Merges into:** `dev`
- **Unlocks:** Elgendy's checkout UI. Coordinate endpoint names in the Day-1 contract PR.

#### Files you create

```
apps/api/src/database/migrations/1785000070000-CreateOrdersAndOrderItems.ts
apps/api/src/database/migrations/1785000071000-CreatePayments.ts
apps/api/src/modules/commerce/
  commerce.module.ts
  commerce.controller.ts
  commerce.service.ts
  entities/order.entity.ts
  entities/order-item.entity.ts
  entities/payment.entity.ts
  dto/create-order-item.dto.ts
  dto/complete-checkout.dto.ts
  payments/payment-adapter.interface.ts
  payments/test-payment-adapter.ts
apps/api/test/commerce.e2e-spec.ts
```

#### Files you edit

```
apps/api/src/app.module.ts                     # import CommerceModule + TypeORM entities
apps/api/src/database/data-source.ts           # register new entities (if it lists entities explicitly)
```

#### Commit plan (in this order; each commit = the files listed)

1. `feat(api): add order and order-item entities (CF-TASK-058)`
   - `apps/api/src/database/migrations/1785000070000-CreateOrdersAndOrderItems.ts`
   - `apps/api/src/modules/commerce/entities/order.entity.ts`
   - `apps/api/src/modules/commerce/entities/order-item.entity.ts`
2. `feat(api): add payment entity and test payment adapter (CF-TASK-059)`
   - `apps/api/src/database/migrations/1785000071000-CreatePayments.ts`
   - `apps/api/src/modules/commerce/entities/payment.entity.ts`
   - `apps/api/src/modules/commerce/payments/payment-adapter.interface.ts`
   - `apps/api/src/modules/commerce/payments/test-payment-adapter.ts`
3. `feat(api): add commerce module with student checkout endpoint (CF-TASK-058)`
   - `apps/api/src/modules/commerce/commerce.module.ts`
   - `apps/api/src/modules/commerce/commerce.service.ts`
   - `apps/api/src/modules/commerce/dto/create-order-item.dto.ts`
   - `apps/api/src/modules/commerce/dto/complete-checkout.dto.ts`
   - `apps/api/src/app.module.ts`
   - `apps/api/src/database/data-source.ts`
4. `feat(api): expose checkout controller behind student guard (CF-TASK-058)`
   - `apps/api/src/modules/commerce/commerce.controller.ts`
5. `test(api): e2e checkout flow with test payment adapter (CF-TASK-059)`
   - `apps/api/test/commerce.e2e-spec.ts`
6. `docs(api): document checkout endpoints and test adapter (CF-TASK-058)`
   - `docs/api/sprint3-commerce.md`

**Merge:** PR `feature/cf-s3-commerce` → `dev`. Ask Habsa or Seif to approve before merging.

---

### Branch 2 — `feature/cf-s3-sales`  ← A-2 (`CF-TASK-065`, `CF-TASK-068`)

- **From:** `dev` **after Branch 1 is merged** (create fresh from updated `dev`)
- **Merges into:** `dev`
- **Unlocks:** Nabile's sales UI + Analytics Agent.

#### Files you create

```
apps/api/src/modules/sales/
  sales.module.ts
  sales.controller.ts
  sales.service.ts
  dto/sales-metrics-query.dto.ts
  dto/sales-metrics-response.dto.ts (or a plain interface + response object)
apps/api/test/sales.e2e-spec.ts
```

#### Files you edit

```
apps/api/src/app.module.ts                     # import SalesModule
```

#### Commit plan (in order)

1. `feat(api): add sales module and metrics service reading orders from db (CF-TASK-065)`
   - `apps/api/src/modules/sales/sales.module.ts`
   - `apps/api/src/modules/sales/sales.service.ts`
   - `apps/api/src/modules/sales/dto/sales-metrics-query.dto.ts`
   - `apps/api/src/modules/sales/dto/sales-metrics-response.dto.ts`
   - `apps/api/src/app.module.ts`
2. `feat(api): expose teacher sales metrics endpoints (CF-TASK-068)`
   - `apps/api/src/modules/sales/sales.controller.ts`
   - `apps/api/src/modules/sales/dto/sales-metrics-query.dto.ts`
3. `test(api): e2e sales metrics and recent orders (CF-TASK-068)`
   - `apps/api/test/sales.e2e-spec.ts`
4. `docs(api): document teacher sales metrics contract (CF-TASK-068)`
   - `docs/api/sprint3-sales.md`

**Merge:** PR `feature/cf-s3-sales` → `dev`.

---

### Branch 3 — `feature/cf-s3-analytics-functions`  ← A-3 (`CF-TASK-070`)

- **From:** `dev` **after Branch 2 is merged**
- **Merges into:** `dev`
- **Unlocks:** Nabile's Analytics Agent intents (overall revenue, sales count, recent orders).

#### Files you create

```
apps/api/src/modules/analytics/
  analytics.module.ts
  analytics.controller.ts
  analytics.service.ts
  dto/analytics-intent.dto.ts
  intent/analytics-intent-handler.interface.ts
  intent/revenue.handler.ts
  intent/sales-count.handler.ts
  intent/recent-orders.handler.ts
apps/api/test/analytics.e2e-spec.ts
```

#### Files you edit

```
apps/api/src/app.module.ts                     # import AnalyticsModule
```

#### Commit plan (in order)

1. `feat(api): add analytics module with intent-handler interface (CF-TASK-070)`
   - `apps/api/src/modules/analytics/analytics.module.ts`
   - `apps/api/src/modules/analytics/intent/analytics-intent-handler.interface.ts`
   - `apps/api/src/modules/analytics/dto/analytics-intent.dto.ts`
   - `apps/api/src/app.module.ts`
2. `feat(api): implement revenue sales-count and recent-orders handlers (CF-TASK-070)`
   - `apps/api/src/modules/analytics/intent/revenue.handler.ts`
   - `apps/api/src/modules/analytics/intent/sales-count.handler.ts`
   - `apps/api/src/modules/analytics/intent/recent-orders.handler.ts`
   - `apps/api/src/modules/analytics/analytics.service.ts`
   - `apps/api/src/modules/analytics/analytics.controller.ts`
3. `test(api): e2e analytics intents (CF-TASK-070)`
   - `apps/api/test/analytics.e2e-spec.ts`
4. `docs(api): document analytics intents (CF-TASK-070)`
   - `docs/api/sprint3-analytics.md`

**Merge:** PR `feature/cf-s3-analytics-functions` → `dev`.

> **Branch 3 amendment (2026-08-04):** the merged `docs/sprint3-plan.md` §5 +
> `docs/courseflix-scrum-jira-plan.md` make the live contract clear:
> `POST /api/v1/teacher/analytics/questions` is **Nabile's** route (CF-TASK-069
> parser, CF-TASK-072 security suite). Albraa's CF-TASK-070 is the
> **permission-scoped function registry only** — no HTTP route in this branch.
> The allowlist is exactly `revenue | sales_count | best_sellers` (NOT the
> draft `recent_orders` below). Nabile's parser calls
> `AnalyticsFunctionsService.execute()` (exported by `AnalyticsModule`); the
> registry rejects unknown intents before any aggregate query. "Fixture and
> ownership tests" = `analytics-functions.service.spec.ts` (mocked SalesService,
> ownership-scoping pass-through asserted); the endpoint-level e2e lands with
> Nabile's parser branch + Seif's no-SQL suite.

> **Day-1 contract PR note:** the plan's shared `feature/cf-s3-contracts` branch covers routes/interfaces/migration boundaries. In practice the repo shows each member folded the contract into their own branch — so keep the contract **commit first** on Branch 1 (route constants + response types for the parts Elgendy/Nabile need), and merge it early so the UI teams can parallelize.

---

## 5. API contract to follow (mirror existing conventions)

Pattern source: `agent-logs.controller.ts` + `student.controller.ts`.

- Route prefix style: `@Controller('api/v1/...')`, guards `@UseGuards(AuthGuard, StudentRoleGuard)` / `(AuthGuard, TeacherRoleGuard)`.
- Auth: use `@CurrentUser() user: AuthenticatedUser` decorator.
- Responses: JSON; errors as `ApiError` (throw with `HttpStatus` codes). Web client already parses errors in `apps/web/src/shared/api/http-client.ts`.

### Proposed endpoints

**Student (A-1):**
```
POST   api/v1/student/checkout                 { courseId, items[] }  → 201 order + payment stub
GET    api/v1/student/orders                   my orders
GET    api/v1/student/orders/:orderId          order detail (items, payment status)
```
- Payment status values: `PENDING | PAID | FAILED | REFUNDED`.
- Test adapter (no real card): accepts any payload, marks payment `PAID` when body `simulate === 'success'`, `FAILED` when `'failure'`.

**Teacher (A-2 / A-3):**
```
GET    api/v1/teacher/sales/metrics?from&to&courseId   → { revenue, ordersCount, studentsCount, avgOrderValue }
GET    api/v1/teacher/sales/recent?limit=20            → recent paid orders (for dashboard table)
POST   api/v1/teacher/analytics/intent   { intent: 'overall_revenue' | 'sales_count' | 'recent_orders', filters } 
```
- Query params must follow the `agent-logs` filter style (`from`, `to`, `courseId`, `status` — all optional strings, validated in the service/DTO).
- Money: store as integer **minor units (EGP piasters)** or a fixed decimal scale — decide once in the order entity and expose the same shape everywhere (Nabile's UI + Agent depend on it).

---

## 6. Migration design notes

- Migrations are timestamped, e.g. `1785000070000-CreateOrdersAndOrderItems.ts`, registered in `apps/api/src/database/` and imported in `app.module.ts` (same wiring as `CreateFilesAndDocuments1785000030000`).
- Tables:
  - `orders` → id, student_id (FK users), total_minor, status, payment_status, created_at.
  - `order_items` → id, order_id (FK orders), course_id (FK courses), title_snapshot, price_minor.
  - `payments` → id, order_id (FK orders), method, status, external_ref (nullable), created_at.
- Keep snapshot columns (`title_snapshot`, `price_minor`) so sales history is immutable even if a course price changes later.
- Use the **existing data-source/config pattern**; no schemaV2.sql changes for these — the `schemaV2.sql` file currently has no order/payment tables, so the migrations are the source of truth.

---

## 7. Definition of Done (per branch)

- [ ] Branch created from latest `dev`; naming + commits follow §3.
- [ ] Lint + format + typecheck pass (`npm run lint` / repo scripts — confirm exact scripts in `apps/api/package.json`).
- [ ] e2e specs green for the branch's endpoints.
- [ ] PR opened against `dev`; contract (route names + shapes) shared with Elgendy/Nabile early.
- [ ] Independent approval (Habsa or Seif) before merge.
- [ ] Docs commit added under `docs/api/`.

---

## 8. Remaining sprint-day checklist (Aug 4 → Aug 6)

- **Aug 4:** rebase on latest `dev`; finish Branch 1 commits 1–4; open PR; confirm contract with Elgendy.
- **Aug 5:** merge Branch 1 (after approval); create Branch 2; finish commits 1–2; review someone else's PR (CF-TASK-085).
- **Aug 6 (AM):** merge Branch 2; create Branch 3; finish commits 1–2; run tests; open PR.
- **Aug 6 (release rehearsal):** coordinate with Seif for E2E release test; verify A-1/A-2 endpoints live on `dev`.

---

## 9. TL;DR

- You build the **commerce (test checkout), sales metrics, and 3 analytics functions** backends — that's it.
- **Not blocked.** Everything upstream is merged. Start from latest `dev`.
- **You block Elgendy (checkout UI) and Nabile (sales UI/Agent)** → share the endpoint contract first.
- 3 branches, all from `dev`, all merging into `dev` (never `main`), each with its own ordered commits and files listed in §4.
