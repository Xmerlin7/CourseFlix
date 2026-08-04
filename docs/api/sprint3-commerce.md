# Commerce API — Sprint 3 (A-1/A-2/A-3 / CF-TASK-058, CF-TASK-059)

Test checkout + authoritative order backend for `CF-US-015`. Follows `docs/api-conventions.md` conventions. No real payments: only the deterministic test adapter, EGP, integer minor units.

## Guards

`AuthGuard` + `StudentRoleGuard` on every commerce endpoint. Receipt access is scoped to the purchasing student — reading another student's order returns `403`, never their data.

## Server price — the only truth

`schemaV2.sql` has no per-course pricing, so the server owns a single deterministic price: `COURSE_PRICE_MINOR` (env, default `50000` = EGP 500.00, integer minor units). The client can never send price, currency, payout, or paid status — the global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`) rejects tamper requests with `400`.

## Schema

Migration block `1785000070000`–`1785000079999` (Albraa's per sprint3-plan.md §1):

- `orders` — id, student_id (FK users), status (`pending|paid|failed`), payment_status (`pending|paid|failed`), currency (`EGP`), total_minor, idempotency_key (unique where not null), created_at, updated_at, paid_at.
- `order_items` — order_id (FK orders, cascade), course_id (FK courses), title_snapshot, price_minor. Snapshot frozen at purchase so sales history is immutable.
- `payments` — order_id (FK orders, cascade), attempt_no (unique per order), status, method (`test_adapter`), external_ref.

A declined attempt sets `payment_status = 'failed'` but leaves the order retryable (`status = 'pending'`); only a successful confirm flips the order to `paid`. Sales aggregates count paid orders only.

## `POST /api/v1/checkout/orders`

Body: `{ "courseId": "uuid", "idempotencyKey": "string?" }`.

- `404` unknown course, `409` archived/draft course, `409` "already owned" (active enrollment exists), `400` tampered fields.
- Repeating `idempotencyKey` returns the existing order instead of creating a second one.

`201` response:

```json
{
  "orderReference": "uuid",
  "status": "pending",
  "paymentStatus": "pending",
  "currency": "EGP",
  "amountMinor": 50000,
  "timezone": "Africa/Cairo",
  "items": [{ "courseId": "uuid", "title": "الميكانيكا الكلاسيكية", "priceMinor": 50000 }],
  "createdAt": "2026-08-04T10:00:00.000Z",
  "paidAt": null
}
```

Timestamps are UTC ISO-8601; `timezone` tells clients to render in Africa/Cairo (sprint3-plan.md §5 A-1).

## `POST /api/v1/checkout/orders/:orderId/confirm`

Body: `{ "simulate": "success" | "decline" }` (optional, default `success`). This is the only client-controlled field — the deterministic adapter never touches real card data.

- `success` → transaction creates a `paid` payment row, sets order `paid`, and ensures exactly one active enrollment (skips if one already exists).
- `decline` → records a `failed` payment attempt, `paymentStatus: "failed"`, order stays `pending` so the UI can retry.
- Duplicate confirm returns the authoritative paid state and creates nothing new.
- Whole confirm runs in one transaction with a row lock, so concurrent duplicates can never create two paid orders/payments/enrollments (CF-TASK-059).

## `GET /api/v1/orders/:orderId`

Own receipt. `200` for the purchasing student, `403` for anyone else, `404` unknown.

## Frontend contract

Stable response shape above — Elgendy's checkout UI (CF-TASK-057) renders loading, declined, success, retryable-failure, and already-owned (`409`) states, always displaying the backend-returned amount/currency only.

## Known gaps

No live-Postgres e2e run in this environment (same constraint as the agent-logs suite). Verified via `npm run test:api` (mocked repository/service specs) and `tsc --noEmit`. `apps/api/test/commerce.e2e-spec.ts` is ready for the team's DB-backed run, using the reset tooling (E-2) before re-runs.
