# CourseFlix Sprint 3 Execution Plan

Sprint 3 window: **Monday, August 3 -> Thursday, August 6, 2026**.

This is a **day-2 plan**. The original delivery plan scheduled Sprint 3 for Sunday, August 2 -> Thursday, August 6, but this execution plan assumes work starts on Monday, August 3.

**Sprint goal:** finish the demonstrable business loop: intervention, test checkout, backend-sourced sales metrics, limited Analytics Agent, logs/health, GTM/dataLayer validation, and release rehearsal.

---

## 0. Capacity And Rules

Gross remaining capacity is **120h**: 5 people x 4 days x 6 productive hours.

This plan commits **100h** and leaves **20h buffer** for integration, review, rehearsals, and bugs.

Assumptions:

1. Sprint 2 Tutor/test-harness work is treated as the baseline.
2. Sprint 3 is the last sprint, so deferred analytics/GTM/dataLayer work lands here.
3. Every member gets backend and frontend/test-facing work where feasible.
4. No real payments, no arbitrary SQL, no GA4 revenue truth, and no teacher/admin self-registration.

### Explicitly Deferred

| Deferred | Reason |
|---|---|
| Production payment provider | Sprint 3 uses the deterministic test adapter only. |
| Full natural-language analytics | The Agent supports exactly three allowlisted intents. |
| OCR/PPTX ingestion | PDF-only ingestion remains the MVP boundary. |
| Automatic suspension | Intervention creates report/quiz/notification/log only. |
| Full autonomous proctoring | Sprint 3 ships deterministic struggle intervention, not surveillance. |
| Advanced analytics exports | Backend order metrics and limited Agent answers are enough for the demo. |
| Live GTM publish if credentials are unavailable | Local listener validation is accepted as release evidence. |

---

## 1. Day-1 Contract PR

Branch: `feature/cf-s3-contracts`. One short PR before feature work. Interfaces, route constants, module shells, and migration boundaries only.

### Shared Routes And Types

Add route constants for:

- Student checkout and checkout result.
- Teacher sales metrics.
- Teacher Analytics Agent.
- Teacher agent logs.
- Student and teacher interventions.

Create shared web type skeletons for:

- `commerce`
- `sales`
- `analytics-agent`
- `interventions`
- `agent-logs`

### Empty API Modules

Create empty Nest modules and register them once in `app.module.ts`:

- `commerce`
- `sales`
- `analytics-agent`
- `interventions`
- `agent-logs`

### Migration Blocks

| Owner | Timestamp block | Tables |
|---|---|---|
| Habsa | `1785000060000` - `1785000069999` | interventions, intervention evidence, agent logs |
| Albraa | `1785000070000` - `1785000079999` | orders, order items, payments |

No one else writes Sprint 3 migrations unless the team explicitly coordinates it.

---

## 2. Per-Person Load

| Member | Backend/platform slice | Frontend/test-facing slice | BE | FE/Test | Total |
|---|---|---|---:|---:|---:|
| Elgendy | Health/readiness, correlation IDs, reset tooling | Checkout UI, Analytics Agent UI, release review | 7h | 12h | **19h** |
| Habsa | Interventions, agent logs, notification carryover | Intervention/log views | 16h | 4h | **20h** |
| Albraa | Commerce, idempotency, sales aggregates | Checkout response support and UI contract tests | 18h | 3h | **21h** |
| Nabile | Mini-quiz fallback, analytics parser/logging | Sales view, Agent result polish, bug bash | 12h | 8h | **20h** |
| Seif | Tutor carryover, security/E2E tests | dataLayer/GTM, release runbook | 6h | 14h | **20h** |
| **Team** | | | **59h** | **41h** | **100h** |

---

## 3. Elgendy - Checkout UI, Health, Agent UI, Release Review *(19h)*

### E-1 - Health, Readiness, And Correlation IDs *(3h)*

Backend/platform:

- Add `GET /api/v1/health/live`.
- Add `GET /api/v1/health/ready`.
- Ready check distinguishes API, database, Redis/BullMQ, Chroma, and configured AI dependency.
- Add request correlation propagation helper used by Sprint 3 modules.

Done when:

- Liveness succeeds when API is running.
- Readiness reports separate dependency status without exposing secrets.
- A known dependency failure produces a safe degraded response.

### E-2 - Reset And Release Tooling *(4h)*

Backend/platform:

- Add deterministic reset/check commands for seed, orders, interventions, agent logs, and demo documents.
- Ensure reset can run twice without duplicate demo state.
- Document reset commands in the release runbook.

Done when:

- Reset runs twice from the same database state.
- Demo fixtures are deterministic.
- Release checklist can call one reset command before E2E.

### E-3 - Checkout And Result UI *(4h)*

Frontend:

- Build student checkout page.
- Build result/receipt state.
- Use backend-returned amount/currency only.
- Support loading, declined, success, retryable failure, and already-owned states.

Done when:

- UI never accepts client-entered price/currency.
- Success receipt shows backend order reference.
- Decline/failure states are clear and retryable.

### E-4 - Analytics Agent Prompt/Result UI *(4h)*

Frontend:

- Build teacher-facing prompt panel.
- Add supported example chips.
- Render structured revenue, order-count, and best-seller answers.
- Render unsupported-question guidance without pretending the Agent understood it.

Done when:

- The page can render all three supported answer shapes.
- Unsupported answers show examples and no fake metric.
- Mobile RTL layout is usable at 390px.

### E-5 - Responsive And Release Review *(4h)*

Test/release:

- Review new Sprint 3 screens at 390px and desktop.
- Check no clipped text, broken RTL, or unusable controls.
- Conduct independent release-readiness review and record blocker list.

Done when:

- A blocker list or sign-off exists.
- Severity 1/2 defects are filed before release rehearsal.

---

## 4. Habsa - Intervention, Logs, Notification Carryover *(20h)*

### H-1 - Intervention Schema And Rule Evaluator *(5h)*

Backend:

- Add intervention tables in Habsa's timestamp block.
- Add versioned deterministic rules.
- Demo triggers:
  - Quiz score below 60%.
  - Explicit phrase: `مش فاهم` / `I don't understand`.
  - Repeated concept question.
- Duplicate signals in the same rule window must not create duplicate active interventions.

Done when:

- Rule/version is stored with each intervention.
- Below-threshold and duplicate tests pass.
- No rule mutates enrollment status or suspends a student.

### H-2 - Intervention Report, Log, And Notification API *(4h)*

Backend:

- Create weak-concept report.
- Create student/teacher notification.
- Create agent log entry.
- Expose student and teacher intervention reads.

Endpoints:

- `GET /api/v1/student/interventions`
- `GET /api/v1/teacher/interventions`

Done when:

- Student reads only their own intervention.
- Teacher reads only interventions for owned courses.
- Report, notification, and log reconcile to one intervention ID.

### H-3 - Agent Log API *(4h)*

Backend:

- Add `GET /api/v1/teacher/agent-logs`.
- Scope logs to teacher-owned courses.
- Redact prompt text, document text, order PII, stack traces, and secrets.

Done when:

- Unauthorized teacher cannot read another teacher's logs.
- Redaction tests prove unsafe fields never leave the API.
- Failed and successful actions both appear with correlation IDs.

### H-4 - Notification Carryover *(3h)*

Backend/frontend:

- Add `GET /api/v1/notifications?status&type`.
- Add `PATCH /api/v1/notifications/read-all`.
- Add filters and mark-all-read UI behavior.
- Preserve existing mark-one-read behavior.

Done when:

- Filters work for unread/all and notification type.
- Mark-all-read only marks the current user's notifications.

### H-5 - Intervention And Log Views *(4h)*

Frontend:

- Student intervention/mini-quiz entry state.
- Teacher intervention/report list.
- Agent log list/detail.
- Loading, empty, error, forbidden states.

Done when:

- Student can see the assigned intervention.
- Teacher can inspect safe report/log summary.
- Mobile RTL state is usable.

---

## 5. Albraa - Commerce Backend And Sales Aggregates *(21h)*

### A-1 - Commerce Migration And Entities *(5h)*

Backend:

- Add `orders`, `order_items`, and `payments` in Albraa's timestamp block.
- Use EGP and integer minor units.
- Display dates in Africa/Cairo semantics.
- Backend orders are the only revenue truth.

Done when:

- Migration runs on an empty DB.
- Entities match the migration.
- Order status and payment status support success, decline, and retry.

### A-2 - Checkout And Order API *(5h)*

Backend:

- `POST /api/v1/checkout/orders`
- `POST /api/v1/checkout/orders/:orderId/confirm`
- `GET /api/v1/orders/:orderId`
- Deterministic adapter supports success and decline.
- No real card data is accepted or stored.

Done when:

- Server returns course title, amount, currency, status, and order reference.
- Decline path records a failed payment attempt.
- Receipt access is scoped to the purchasing student.

### A-3 - Idempotency And Transaction Rules *(4h)*

Backend:

- Duplicate confirm with the same idempotency key never creates duplicate paid order/payment/enrollment.
- Client cannot set price, currency, teacher payout, or paid status.
- Confirmation is transactional.

Done when:

- Retry/concurrency tests pass.
- Price tamper request is ignored or rejected safely.
- Repeated confirm returns the same authoritative order state.

### A-4 - Teacher Sales Aggregate Service *(4h)*

Backend:

- `GET /api/v1/teacher/sales/summary?from&to`
- Aggregate only successful paid orders for teacher-owned courses.
- Failed, declined, and reset orders are excluded.
- Include revenue, successful order count, and best-selling course.

Done when:

- Fixture totals exactly reconcile to order rows.
- Invalid ranges are rejected.
- Another teacher's course revenue is never included.

### A-5 - Commerce And Sales Tests *(3h)*

Test-facing:

- Success.
- Decline.
- Duplicate confirm.
- Already owned.
- Unauthorized receipt.
- Price tamper.
- Date boundary and timezone fixtures.

Done when:

- Commerce and sales tests are green.
- Elgendy's checkout UI has stable response shapes and MSW handlers.

---

## 6. Nabile - Mini Quiz, Sales UI, Analytics Agent *(20h)*

### N-1 - Mini-Quiz Fallback Generation *(4h)*

Backend:

- From intervention weak concept, create three objective questions.
- Use deterministic course-grounded fallback.
- Store source/evidence references.

Done when:

- Mini quiz is attached to the intervention.
- Answers are server-graded.
- Source/evidence reference is visible to backend tests.

### N-2 - Analytics Agent Parser And Controller *(5h)*

Backend:

- `POST /api/v1/teacher/analytics/questions`.
- Support exactly three intents:
  - Revenue for a date range.
  - Successful-order count for a date range.
  - Best-selling courses.
- Unsupported or ambiguous question returns supported examples and performs no aggregate query.

Done when:

- Parser returns normalized intent/date range.
- Unsupported input has no aggregate service call.
- No raw SQL execution path exists.

### N-3 - Agent Answer Logging *(3h)*

Backend:

- Persist normalized intent, parameters, result status, row count, duration, and trace ID.
- Use Habsa's agent log contract.
- Redact natural-language question text from returned logs.

Done when:

- Supported answer creates one log entry.
- Unsupported answer creates a safe skipped log.
- Trace ID is returned with every answer.

### N-4 - Sales Metrics View *(4h)*

Frontend:

- Teacher date filter.
- Revenue tile.
- Successful-order count tile.
- Best-seller display.
- Empty, loading, error, forbidden states.

Done when:

- UI displays backend values without recomputing money.
- Empty range is clear and not an error.
- Mobile RTL layout passes.

### N-5 - Analytics Agent Result Polish And Bug Bash *(4h)*

Frontend/test:

- Polish result cards for all three intents.
- Add unsupported-answer examples.
- Fix severity 1/2 bugs after feature freeze in owned areas.

Done when:

- Agent page handles success, unsupported, empty data, and failure.
- Bug bash fixes are verified by affected tests.

---

## 7. Seif - Tutor Carryover, GTM/DataLayer, E2E Release *(20h)*

### S-1 - Tutor History And RAG Release Checks *(3h)*

Backend/test:

- Add `GET /api/v1/courses/:courseId/tutor/messages`.
- Return course-scoped conversation history for the enrolled student.
- Add release checks for no-answer, citation validation, and three prompt-injection cases.

Done when:

- Student sees only their own course conversation.
- Unsupported question returns zero citations.
- Injection attempts cannot override server prompt policy.

### S-2 - Commerce/Agent Security Integration Tests *(3h)*

Test:

- Verify no arbitrary SQL path in Analytics Agent.
- Verify order totals reconcile with sales/agent responses.
- Verify unauthorized users cannot read receipts, sales, or logs.

Done when:

- Security/integration suite is green.
- Failures identify the owning feature slice.

### S-3 - dataLayer Foundation And Sprint 2 Learning Events *(4h)*

Frontend/GTM:

- Implement versioned `pushDataLayerEvent`.
- Add event dictionary.
- Add ecommerce reset rule.
- Add PII denylist.
- Add deferred lesson, quiz, and Tutor events.

Done when:

- Denylist rejects email, full name, password, chat text, answer text, document text, and raw payment data.
- Events use opaque IDs and stable schema version.

### S-4 - Sprint 3 GTM Events *(4h)*

Frontend/GTM:

- Add intervention/proctor event hooks.
- Add checkout start, purchase, and checkout error hooks.
- Events contain opaque IDs only.
- Purchase value comes only from the backend order response.

Done when:

- Duplicate/retry purchase events are safe.
- Checkout error events do not include payment details.
- Intervention events do not include chat/question text.

### S-5 - GTM Privacy And Reconciliation Report *(3h)*

Release/GTM:

- Validate through GTM Preview if credentials exist.
- Otherwise validate through local listener.
- Confirm purchase event values match backend orders, not GA4.
- Write privacy/reconciliation report.

Done when:

- Report lists tested events, payload examples, and denied fields.
- Backend order totals reconcile with emitted purchase payloads.

### S-6 - Canonical E2E And Release Runbook *(3h)*

Release/test:

- Automate teacher upload -> student lesson/quiz/Tutor -> intervention -> checkout -> teacher sales/agent/logs.
- Finalize reset/rehearsal runbook.

Done when:

- Canonical E2E runs from reset seed.
- Two rehearsal runs are recorded.

---

## 8. API And Data Contracts

### New Or Changed Endpoints

| Endpoint | Owner | Guards | Purpose |
|---|---|---|---|
| `POST /api/v1/checkout/orders` | Albraa | Auth + Student | Create draft test order |
| `POST /api/v1/checkout/orders/:orderId/confirm` | Albraa | Auth + Student | Confirm deterministic success/decline |
| `GET /api/v1/orders/:orderId` | Albraa | Auth + Student | Read own receipt/order |
| `GET /api/v1/teacher/sales/summary?from&to` | Albraa | Auth + Teacher | Backend-sourced sales metrics |
| `POST /api/v1/teacher/analytics/questions` | Nabile | Auth + Teacher | Allowlisted Analytics Agent |
| `GET /api/v1/teacher/agent-logs` | Habsa | Auth + Teacher | Safe owned-course log viewer |
| `GET /api/v1/health/live` | Elgendy | Public | Liveness |
| `GET /api/v1/health/ready` | Elgendy | Public | Dependency readiness |
| `GET /api/v1/student/interventions` | Habsa | Auth + Student | Student intervention list |
| `GET /api/v1/teacher/interventions` | Habsa | Auth + Teacher | Teacher intervention reports |
| `GET /api/v1/courses/:courseId/tutor/messages` | Seif | Auth + Student | Course-scoped Tutor history |
| `GET /api/v1/notifications?status&type` | Habsa | Auth | Filter notifications |
| `PATCH /api/v1/notifications/read-all` | Habsa | Auth | Mark current user's notifications read |

### Core Rules

- Teacher reads are scoped by owned courses.
- Student reads are scoped by enrollment.
- Checkout uses server price only.
- Sales and Analytics Agent read from backend orders only.
- Analytics Agent can call predefined service functions only.
- Logs redact unsafe content.
- GTM events are privacy-safe and non-authoritative.

---

## 9. Daily Rhythm

| Day | Date | Checkpoint |
|---|---|---|
| **1** | Mon Aug 3 | Contract PR, migrations, endpoint skeletons, checkout/intervention/log foundations |
| **2** | Tue Aug 4 | Checkout API/UI, intervention flow, sales aggregates, analytics parser, dataLayer foundation |
| **3** | Wed Aug 5 | Integration day; agent/logs/health wired; GTM local validation; feature freeze at 13:00 |
| **4** | Thu Aug 6 | E2E, bug bash, reset seed, two rehearsals, release-readiness sign-off |

Standup questions:

1. Is any shared file being touched outside its owner?
2. Is checkout -> sales -> Analytics Agent still reconciling?
3. Is any GTM/event payload carrying prohibited data?
4. Can the demo reset from scratch?

---

## 10. Definition Of Done

Sprint 3 is done when:

- All planned endpoints enforce auth, role, and ownership.
- Clean migration and seed/reset run twice without duplicate demo state.
- Backend order totals reconcile with checkout, sales metrics, Analytics Agent, and GTM purchase payload.
- No severity 1/2 defects remain.
- No Sprint 3 event/log exposes prohibited content.
- Canonical E2E passes from reset environment.
- Two rehearsals complete from the runbook.
- Deferred/post-MVP scope is listed honestly in the demo notes.

---

## 11. Verification

Required commands:

```bash
npm run test:api
npm run test:web
npm run build:api
npm run build:web
```

Required scenarios:

- Checkout success, decline, retry/idempotency, already owned, price tamper.
- Sales totals exactly reconcile to order fixtures.
- Analytics Agent supports only revenue, order count, and best sellers.
- Unsupported Analytics Agent question performs no aggregate query.
- Intervention triggers once, creates report/notification/log/mini quiz, and never suspends.
- Agent logs are scoped, redacted, and traceable.
- Health readiness fails safely when a dependency is down.
- GTM/dataLayer denylist rejects email, full name, password, chat text, answer text, document text, and raw payment data.
- Tutor history, no-answer, citation, and injection tests pass.
- New UI screens pass loading, empty, error, forbidden, and mobile RTL states.
