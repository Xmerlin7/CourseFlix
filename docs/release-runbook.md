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

### Scope — what reset does *not* cover yet

E-2's spec asks for reset/check over "seed, orders, interventions, agent
logs, and demo documents". Only the **seed and demo-documents** halves are
implemented here. `orders`, `order_items`, `payments` (Albraa's migration
block `1785000070000`+) and `interventions`, `intervention_evidence`,
`agent_logs` (Habsa's block `1785000060000`+) do not exist as tables yet,
so there is nothing for `reset` to truncate or `reset:check` to verify —
a step referencing them today would just fail on a missing relation.

Once those migrations land, `reset` needs a step that clears the
transactional rows they own (unlike the fixture tables, orders and
interventions accumulate during a rehearsal rather than drift in place, so
they want deletion, not upsert-correction), and `reset:check` needs a
matching assertion that they are empty. Whoever adds those tables should
extend `apps/api/src/database/seed-runner.ts` and
`apps/api/src/database/reset-check.ts` rather than writing a parallel
script.

### Idempotency

Running `reset` twice in a row against the same database produces the same
row counts both times and the same `reset:check` result — no duplicate
rows are ever created, because every seed step upserts on a natural key
(email, slug, title, etc.) rather than inserting unconditionally.
