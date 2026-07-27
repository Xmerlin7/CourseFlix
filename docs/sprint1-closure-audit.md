# Sprint 1 Closure Audit

Audit date: **Monday, July 27, 2026**
Branch audited: `dev` @ `9002101`
Auditor method: read every Sprint 1 acceptance line in `sprint1-plan.md` and `docs/courseflix-scrum-jira-plan.md` §10, then verify against the code, run the test suites, and typecheck both apps.

## Verdict

**Sprint 1 is NOT 100% done.** The feature demo is complete and defensible — every endpoint and page in the Sprint 1 contract exists, is wired to the real database, and is guarded correctly. But **four Definition-of-Done items never shipped**, and one Sprint 1 UI defect is still on `dev`.

Honest completion: **~88%**. The gap is entirely in *quality tooling and analytics foundation*, not in features.

## What was actually verified as green

| Check | Command | Result |
|---|---|---|
| API unit tests | `npx jest` in `apps/api` | **9 suites / 35 tests passed** |
| API typecheck | `npx tsc -b --noEmit` in `apps/api` | **clean** |
| Web typecheck | `npx tsc -b --noEmit` in `apps/web` | **clean** |
| API e2e | `npx jest --config ./test/jest-e2e.json` | **could not run** — see gap #4 |
| Web tests | — | **no test runner installed** — see gap #3 |

### Features confirmed present and correct

- **Migrations** — [1752975600000-CreateUsersTable.ts](apps/api/src/database/migrations/1752975600000-CreateUsersTable.ts), [1752975600001-CreateSessionsTable.ts](apps/api/src/database/migrations/1752975600001-CreateSessionsTable.ts), [1760000000000-CreateCoursesSectionsLessons.ts](apps/api/src/database/migrations/1760000000000-CreateCoursesSectionsLessons.ts), [1784500000000-CreateEnrollments.ts](apps/api/src/database/migrations/1784500000000-CreateEnrollments.ts). `synchronize: false` enforced in [app.module.ts](apps/api/src/app.module.ts).
- **Seeds** — [user.seed.ts](apps/api/src/database/seeds/user.seed.ts), [course.seed.ts](apps/api/src/database/seeds/course.seed.ts), [enrollment.seed.ts](apps/api/src/database/seeds/enrollment.seed.ts), run by [seed.ts](apps/api/src/database/seed.ts). Idempotent upserts — safe to reseed.
- **Auth (CF-US-002)** — argon2id hashing, opaque PostgreSQL sessions, signed HTTP-only cookie via `cookie-parser` in [bootstrap.ts](apps/api/src/bootstrap.ts), `ThrottlerGuard` on login in [auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts), plus [auth.guard.ts](apps/api/src/modules/auth/guards/auth.guard.ts), [student-role.guard.ts](apps/api/src/modules/auth/guards/student-role.guard.ts), [teacher-role.guard.ts](apps/api/src/modules/auth/guards/teacher-role.guard.ts) — each with its own spec.
- **Course / student / teacher / health endpoints (CF-US-003/004/005)** — all nine Sprint 1 endpoints exist with correct guards and ownership checks. Documented accurately in [docs/api-conventions.md](docs/api-conventions.md).
- **Web shell (CF-US-001)** — [router.tsx](apps/web/src/app/routes/router.tsx) covers `/login`, `/403`, `/404`, student and teacher trees with lazy loading, `errorElement`, and `RequireRole`. Shared states exist: `LoadingState`, `EmptyState`, `ErrorState`, `ForbiddenState`, `NotFoundState`, plus `ThemeToggle`.
- **Governance** — `CONTRIBUTING.md`, `.github/BRANCH_PROTECTION.md`, `.env.example` with no real secrets, `docker-compose.yml` for PostgreSQL.

## Gaps — must be carried into Sprint 2

### Gap 1 — CF-TASK-061: `dataLayer` helper and PII denylist tests never written (4h, Seif)

[apps/web/src/shared/analytics/dataLayer.ts](apps/web/src/shared/analytics/dataLayer.ts) is a five-line stub:

```ts
export function pushDataLayerEvent(event: AnalyticsEvent) {
  void event
  // TODO: add privacy-safe dataLayer helper and PII denylist before sending events.
}
```

`sprint1-plan.md` required "a small versioned `dataLayer` helper" **and** "denylist tests so events never include email, password, full name, raw document text, or answer text." Neither exists. CF-TASK-062 in Sprint 2 depends on this.

### Gap 2 — CF-TASK-024: authenticated course smoke test never written (2h, Seif)

There is no test that runs *seed → login → read course → logout*. [apps/api/test/app.e2e-spec.ts](apps/api/test/app.e2e-spec.ts) is still the untouched NestJS scaffold asserting `GET /` returns `"Hello World!"` — dead code, not a smoke test. [apps/api/test/auth.e2e-spec.ts](apps/api/test/auth.e2e-spec.ts) is genuinely good (7 cases: lifecycle, wrong password, no cookie, tampered cookie, expired session, rate limit) but covers auth only.

### Gap 3 — no frontend test infrastructure at all (3h)

`apps/web/package.json` has **no** `test` script and none of Vitest, React Testing Library, MSW, or Playwright installed. The two scaffolding files are empty placeholders:

- [apps/web/src/testing/renderWithProviders.tsx](apps/web/src/testing/renderWithProviders.tsx) — `// TODO: wrap testing-library render when test deps are added.`
- [apps/web/src/testing/mocks/handlers.ts](apps/web/src/testing/mocks/handlers.ts) — `export const handlers: unknown[] = []`

Consequence: **every** frontend "Test cases" line in CF-US-001/004/005 (role nav snapshot, RTL keyboard nav, mobile shell, theme persistence, empty/error/forbidden states) is unverified. CF-TASK-004 and CF-TASK-016 cannot be called done.

### Gap 4 — the e2e suite has never been proven green on this machine

Both e2e suites failed with `TypeError: Cannot read properties of undefined (reading 'getRepository')` — the DataSource never initializes because PostgreSQL is not reachable: port 5432 is closed, `docker ps` returns `permission denied ... /var/run/docker.sock`, and there is no `.env` file (only `.env.example`).

This is an **environment** problem, not proof of broken code. But it means "core auth/course endpoint tests pass" in the Sprint 1 DoD is *asserted, not demonstrated*. Sprint 2 Day 1 must fix the local Docker/env setup and re-run.

### Gap 5 — CF-BUG-001: sidebar navigation is broken (Sprint 1 defect)

[apps/web/src/shared/components/Sidebar.tsx:12-24](apps/web/src/shared/components/Sidebar.tsx#L12-L24) declares nav items pointing at routes that **do not exist** in `router.tsx`:

| Sidebar link | Exists in router? |
|---|---|
| `/student/dashboard` | yes |
| `/student/courses` | yes |
| `/student/assistant` | **no** → falls through to `*` catch-all |
| `/student/progress` | **no** |
| `/teacher/dashboard` | yes |
| `/teacher/course` | **no** — the real path is `/teacher/courses` |
| `/teacher/students` | **no** |
| `/teacher/quizzes` | **no** |
| `/settings` (footer) | **no** |

Worse, they render as plain `<a href={item.path}>` (lines 54 and 68), so every click triggers a **full page reload** and drops SPA state and the in-memory auth context. Must be `NavLink` from `react-router`.

Also: `notificationCount={0}` and `onNotificationsClick={() => {}}` are hardcoded in [StudentLayout.tsx](apps/web/src/app/layouts/StudentLayout.tsx) and [TeacherLayout.tsx](apps/web/src/app/layouts/TeacherLayout.tsx).

## Architectural facts Sprint 2 must plan around

These are not defects — they are real constraints discovered in the audit.

1. **No `apps/worker` workspace.** The root [package.json](package.json) is not an npm workspace at all; it shells out with `npm run … --prefix apps/api`. CF-US-006 called for npm workspaces across `apps/web`, `apps/api`, `apps/worker`.
2. **`docker-compose.yml` has PostgreSQL only.** No Redis, no ChromaDB. Both are hard Sprint 2 dependencies.
3. **Lessons are seeded with `videoUrl: null`** ([course.seed.ts](apps/api/src/database/seeds/course.seed.ts)). CF-US-007 needs a real playable media URL.
4. **`schemaV2.sql` hangs attendance and progress off a `videos` table** (`attendance.video_id`, `content_progress.video_id`) that has never been migrated. Sprint 1 instead put `video_url` directly on `lessons`. Sprint 2 must resolve this explicitly.
5. **No TanStack Query.** Hooks are hand-rolled `useEffect` + `useState` (see the honest docblock in [useStudentDashboard.ts](apps/web/src/features/student/hooks/useStudentDashboard.ts)), even though §4 of the delivery plan names TanStack Query. Keep the current pattern for Sprint 2 — swapping data layers mid-sprint is not worth the risk — but record it as a deliberate deviation.
6. **No global exception filter.** Errors are raw Nest `HttpException` JSON. Acceptable so far, but AI/upload failures in Sprint 2 need stable machine-readable codes.
7. **Response envelope divergence is resolved.** `docs/api-conventions.md` decided *no* `{ data: … }` wrapper; `sprint1-plan.md`'s endpoint table still shows one. The doc is stale, the code is right — fix the table, don't fix the code.

## Carry-over ledger into Sprint 2

| ID | Item | Hours | Owner in Sprint 2 |
|---|---|---:|---|
| CF-TASK-061 | Versioned `dataLayer` helper + PII denylist tests | 4h | Seif (task **S-4**) |
| CF-TASK-024 | Authenticated seed→login→course smoke test; delete `app.e2e-spec.ts` | 2h | Seif (task **S-5**) |
| CF-TASK-004/016 | Frontend test harness (Vitest + RTL + MSW) | 3h | Seif (task **S-1**, Day 1 morning) |
| CF-BUG-001 | Sidebar dead routes + full-page-reload anchors | 1h | Fixed in the Day-1 contract PR |
| CF-CHORE-001 | Local Docker/env setup so e2e actually runs | 1h | Whole team, Day 1 standup |

Per the carry-over policy in §7 of the delivery plan, these are re-estimated and folded into the Sprint 2 allocation below — they are **not** additional unpaid work.
