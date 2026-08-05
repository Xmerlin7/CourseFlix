# CourseFlix Release Runbook

This file starts with the one section that exists so far: database reset,
delivered as sprint3-plan.md's E-2 ("Reset And Release Tooling"). It does not
presume the rest of this document's structure — Seif's S-6 ("Canonical E2E
And Release Runbook") finalizes the full rehearsal runbook (E2E steps, bug
bash, two recorded rehearsals, release-readiness sign-off) later in Sprint 3.
Sections added after this one should feel free to reshape the document
around whatever S-6 needs; nothing here is meant to lock that in.

## Database reset

### Prerequisites

- Postgres (and Redis/Chroma, if the worker or tutor paths are part of the
  rehearsal) running — `docker compose up -d` from the repo root.
- Migrations applied: `npm run migration:run -w apps/api`. Reset does not
  create schema, only rows — running it against an unmigrated database
  fails the same way `npm run seed` would.
- `.env` present at the repo root with the `SEED_TEACHER_EMAIL` /
  `SEED_STUDENT_EMAIL` / `SEED_TEACHER_PASSWORD` / `SEED_STUDENT_PASSWORD`
  vars set (same requirement `seed` already has).

### Commands

```bash
npm run reset -w apps/api        # restore the deterministic demo fixture
npm run reset:check -w apps/api  # read-only: verify it actually matches
```

**`npm run reset`** repopulates the same fixture `npm run seed` does (two
teachers, ten students, seven courses with sections/lessons, fanned
enrollments, one video per lesson, notifications, and the five demo
documents in `apps/api/src/database/seeds/document.seed.ts`) — every step
upserts, so it is safe to run against a database that already has the
fixture in it. Critically, the documents step goes further than a plain
upsert: if a rehearsal run mutated a seeded document's
`processing_status`, `version`, or `error_message` (for example, clicking
"retry" on a `failed` fixture document in the Teacher Files tab), `reset`
forces that row back to its blueprint values instead of leaving the drift
in place. `seed` and `reset` call the exact same underlying function
(`apps/api/src/database/seed-runner.ts`), so there is one fixture
definition, not two that can quietly disagree.

**`npm run reset:check`** is read-only — it never writes to the database.
It verifies:

- every seeded course (by slug) exists, and no more/fewer than the
  expected count;
- every seeded document on the primary course exactly matches its
  blueprint (`processing_status`, `version`, `error_message`) — the table
  most likely to have drifted, per the reasoning above;
- teachers, students, lessons, enrollments, videos, and notifications each
  have at least one row (a lighter existence check — those seed steps only
  upsert-if-missing today and don't yet correct drifted values the way
  documents does, so an exact-count check there would fail for reasons
  unrelated to the actual known risk).

It prints every problem it finds and exits non-zero if there is any drift,
so it can gate a release checklist: run `reset`, then `reset:check`, and
only proceed to E2E if `reset:check` exits 0.

```bash
npm run reset -w apps/api && npm run reset:check -w apps/api
```

### Scope — orders, interventions, and agent logs

E-2's spec asks for reset/check over "seed, orders, interventions, agent
logs, and demo documents". All of those tables now exist and reset covers
them, by two different mechanisms:

- **Orders/payments (`orders`, `order_items`, `payments`)** and
  **agent logs (`agent_logs`)** have no natural key to upsert against —
  they only ever accumulate during a rehearsal. `reset` clears them
  outright via `apps/api/src/database/seeds/transactional-reset.seed.ts`,
  which also soft-deletes any enrollment created purely by a checkout
  purchase (safe by construction: `CommerceService.createDraftOrder`
  refuses to create an order for a course the student already owns, so an
  enrollment with a matching order row was never a base-fixture
  enrollment). Without this, the second of the two required rehearsal
  runs would fail at the checkout step with "already owned". `reset:check`
  asserts both tables are empty after a reset.
- **Interventions (`interventions`, `intervention_evidence`,
  `intervention_mini_quizzes`, ...)** are left alone by `reset` on
  purpose: the demo intervention is upserted by `dedup_key`
  (`intervention.seed.ts`), and `InterventionsService` itself refuses to
  create a duplicate active intervention for the same
  student/course/rule/concept, so re-triggering the same signal across
  rehearsals is already a safe no-op without any clearing step.

Any future table that accumulates the same way orders/agent-logs do
should extend `apps/api/src/database/seed-runner.ts` and
`apps/api/src/database/reset-check.ts` rather than writing a parallel
script.

### Idempotency

Running `reset` twice in a row against the same database produces the same
row counts both times and the same `reset:check` result — no duplicate
rows are ever created, because every seed step upserts on a natural key
(email, slug, title, etc.) rather than inserting unconditionally.

## Sprint 3 non-GTM/non-analytics rehearsal

This is Seif's release path with GTM and Analytics Agent work intentionally
removed for this pass. It covers the Tutor carryover and the currently
implemented resettable learning flow. Commerce/order and agent-log checks
are covered by the reset gate above (§ "Scope — orders, interventions, and
agent logs"); this pass just doesn't exercise the checkout UI itself.

### Preconditions

- Run the reset gate:

```bash
npm run reset -w apps/api && npm run reset:check -w apps/api
```

- Start the API and web app:

```bash
npm run start:dev -w apps/api
npm run dev -w apps/web
```

- Use the seeded student account from `.env`.

### Canonical path

1. Sign in as the seeded student.
2. Open the seeded course.
3. Open a lesson and send at least one progress heartbeat.
4. Open the course Tutor.
5. Confirm existing course-scoped Tutor history loads from
   `GET /api/v1/courses/:courseId/tutor/messages`.
6. Ask a grounded question and verify the assistant answers with citations.
7. Ask an unsupported or injection-style question and verify the assistant
   returns the no-answer message with zero citations.
8. Sign out and confirm `/api/v1/me` rejects the revoked session.

### Release checks

```bash
npm run test -w apps/api -- tutor
npm run test -w apps/web -- StudentAssistantPage
```

Record both command results plus the manual rehearsal date/time. A pass means
the Tutor history endpoint is enrolled-student scoped, unsupported questions
do not invent citations, and the student UI can resume a prior conversation
before sending a new message.
