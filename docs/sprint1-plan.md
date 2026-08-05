# CourseFlix Sprint 1 Execution Plan

Sprint 1 runs from **Sunday, July 19, 2026 to Thursday, July 23, 2026**.

Goal: CourseFlix has a runnable local React/Nest baseline where seeded student and teacher accounts can log in, see the correct RTL shell, and load real seeded course data from the API.

## Who Does What

| Member | Planned load | Owns/demo deliverable | Backend/API | Frontend/UI | Review focus |
|---|---:|---|---|---|---|
| Seif | 22h | Open a seeded course detail as student/teacher | Health, course detail, course seed/service, smoke test | Student course-detail page and shared course components | Auth/API contracts |
| Albraa | 22h | Log in/out as student and teacher securely | Auth API, sessions, guards, tests | Login integration and role redirects | Security/access control |
| Habsa | 22h | Show the student's real enrolled-course area | Student dashboard/enrollment endpoints | Student dashboard and enrolled courses page | Student access/states |
| Nabile | 22h | Show teacher dashboard/list and edit a course | Teacher dashboard/list/update endpoints | Teacher dashboard, course list, management page | Ownership/validation |
| Elgendy | 22h | Navigate the full app in a polished RTL shell | Route/auth contract support | RTL shell, routing, theme, shared states | Visual/responsive quality |

Rule: whoever owns a feature owns both its backend contract and its frontend page. Elgendy owns shared UI foundation because every feature depends on it.

Fairness target: each member owns about **22 planned hours**. Seif's completed scaffold is acknowledged, but it does not replace his Sprint 1 feature work.

Every member has something demo-visible by Thursday. Nobody's work is "just helping"; each owner ships a slice the rest of the team can click, test, or depend on.

## Kickoff Order

1. Seif confirms install/run commands, env placeholders, and local baseline.
2. Team agrees on the shared DB migration and seed reset command.
3. Albraa starts auth/session APIs and login integration.
4. Seif freezes `GET /api/v1/courses/:courseId` so student/teacher course pages share one contract.
5. Habsa starts student work after `GET /api/v1/student/dashboard` and `GET /api/v1/student/enrollments` are usable.
6. Nabile starts teacher work after `GET /api/v1/teacher/dashboard` and `GET /api/v1/teacher/courses` are usable.
7. Elgendy builds the shared RTL shell/components in parallel and helps wire role routes.
8. Seif finishes health, smoke tests, GTM/dataLayer foundation, and integration review.

## Shared Team Task: DB and Seeds

Database migrations and seeds are a **mutual team task**, not one person's private blocker.

- [ ] Everyone can run migrations locally.
- [ ] Everyone can reset and reseed the local DB.
- [ ] Every feature owner checks their page/API against a fresh seed before saying it works.
- [ ] Any branch changing migrations/seeds documents the command teammates must rerun.
- [ ] Seed includes one teacher, one student, one published owned course, one active enrollment, one section, three lessons, and optional document/quiz summary placeholders.
- [ ] Sprint 1 tables: `users`, `sessions`, `courses`, `sections`, `lessons`, `enrollments`, and minimal `documents`/`quizzes` summary fields only if needed.

## Sprint 1 Feature Tasks

### Seif - Course Detail and Integration

- [x] Scaffold `apps/api` NestJS app.
- [x] Scaffold `apps/web` React/Vite app.
- [ ] Create course, section, and lesson entities/migration/seed with ordered lessons.
- [ ] Implement shared course service and `GET /api/v1/courses/:courseId`.
- [ ] Enforce shared course access: enrolled student or owning teacher only.
- [ ] Build `/student/courses/:courseId` using real course detail data.
- [ ] Build reusable course-detail components that Nabile can reuse in teacher course management.
- [ ] Add typed frontend API hook for `GET /api/v1/courses/:courseId`.
- [ ] Add root workspace scripts for consistent web/API commands.
- [ ] Add `.env.example` with local-only placeholders.
- [ ] Document local setup, migration, seed, and run commands.
- [ ] Add `GET /api/v1/health`.
- [ ] Add smoke test: seed DB, login, read course, logout.
- [ ] Define a small versioned `dataLayer` helper.
- [ ] Add denylist tests so events never include email, password, full name, raw document text, or answer text.

Acceptance:

- Fresh teammate can install, migrate, seed, run API/web, and verify health/login/course locally.
- Enrolled student and owning teacher can read the shared course endpoint; unauthorized users get `403`.
- Student course-detail page uses real API data and has loading, error, forbidden, and mobile states.
- No secrets are committed; GTM credentials are not required in Sprint 1.

Demo moment: open the same seeded course as a student and as the owning teacher, showing permissions change correctly.

### Albraa - Auth End To End

- [ ] Implement `POST /api/v1/auth/login`.
- [ ] Implement `POST /api/v1/auth/logout`.
- [ ] Implement `GET /api/v1/me`.
- [ ] Add session cookie handling with HTTP-only same-site cookie.
- [ ] Add student/teacher role guards.
- [ ] Connect login UI and role redirects.
- [ ] Test valid login, wrong password, logout, missing/expired session, and forbidden role access.

Acceptance:

- Student logs in and lands on `/student/dashboard`.
- Teacher logs in and lands on `/teacher/dashboard`.
- Protected APIs return `401` without a session and `403` for the wrong role.
- Errors are generic and do not expose passwords, tokens, or stack traces.

Demo moment: sign in as both roles, refresh, logout, and show forbidden access is blocked.

### Habsa - Student Course Flow End To End

- [ ] Create enrollment entity/migration/seed and unique student-course constraint.
- [ ] Implement `GET /api/v1/student/dashboard`.
- [ ] Implement `GET /api/v1/student/enrollments` with optional `status` and `gradeLevel` filters.
- [ ] Build `/student/dashboard`.
- [ ] Build `/student/courses`.
- [ ] Add loading, empty, error, forbidden, and mobile states.

Acceptance:

- Student sees only their own enrollments.
- Dashboard values come from the DB, with `overallProgressPercent` and `continueLearning` remaining `null` until Sprint 2.
- Course cards link to Seif's shared course-detail page; no hardcoded course cards remain after API is ready.

Demo moment: student opens dashboard and enrolled courses from real seed data, including an honest "not started yet" state.

### Nabile - Teacher Course Flow End To End

- [ ] Implement `GET /api/v1/teacher/dashboard`.
- [ ] Implement `GET /api/v1/teacher/courses` with optional `status` filter.
- [ ] Implement `PATCH /api/v1/teacher/courses/:courseId`.
- [ ] Build `/teacher/dashboard`.
- [ ] Build `/teacher/courses`.
- [ ] Build `/teacher/courses/:courseId`.
- [ ] Add course metadata edit form.
- [ ] Add validation, forbidden, empty, error, and mobile states.

Acceptance:

- Teacher sees only owned course data.
- Valid course edit persists after reload; invalid edit shows validation error.
- Student cannot access teacher pages/APIs.
- Out-of-scope prototype actions are disabled or clearly marked unavailable.

Demo moment: teacher sees course stats/list, edits allowed metadata, reloads, and sees the saved change.

### Elgendy - Shared RTL Shell and UI System

- [ ] Replace Vite starter UI.
- [ ] Port the approved `ui5` RTL direction into React components.
- [ ] Add role-aware sidebar/topbar.
- [ ] Add routing for `/login`, `/403`, `/404`, student pages, and teacher pages.
- [ ] Add theme toggle with persisted light/dark mode.
- [ ] Add shared loading, empty, error, and unauthorized states.
- [ ] Support Habsa and Nabile so pages use the same shell/components.

Acceptance:

- Student and teacher navigation are different and role-correct.
- Shell works at 1440, 1024, 768, and 390 px with no mobile RTL overlap.
- Unauthorized routes use the shared unauthorized state.

Demo moment: switch between role shells, theme, mobile/desktop layouts, `/403`, and `/404`.

## Sprint 1 Endpoint Contract

| Endpoint | Owner | Input | Output | Rules/errors |
|---|---|---|---|---|
| `GET /api/v1/health` | Seif | None | `{ data: { api, database, timestamp } }` | No secrets, paths, or env values |
| `POST /api/v1/auth/login` | Albraa | `email`, `password` | `{ user }` | Sets HTTP-only cookie; `400`, `401`, `429` |
| `POST /api/v1/auth/logout` | Albraa | Session cookie | `{ ok: true }` | Clears session; `401` allowed if already logged out |
| `GET /api/v1/me` | Albraa | Session cookie | `{ user }` | `401 AUTH_REQUIRED` |
| `GET /api/v1/courses/:courseId` | Seif | Session, `courseId` UUID | `{ data: { course, permissions, viewer, sections } }` | Student needs active enrollment; teacher must own course; `401`, `403`, `404` |
| `GET /api/v1/student/dashboard` | Habsa | Student session | `{ data: { student, stats, continueLearning, recentCourses } }` | Student only; progress/continue remain `null`; `401`, `403` |
| `GET /api/v1/student/enrollments` | Habsa | Optional `status`, `gradeLevel` | `{ data: enrollments[], meta }` | Student only; `400`, `401`, `403` |
| `GET /api/v1/teacher/dashboard` | Nabile | Teacher session | `{ data: { teacher, stats, recentCourses } }` | No attendance/revenue/AI/quiz stats; `401`, `403` |
| `GET /api/v1/teacher/courses` | Nabile | Optional `status` | `{ data: courses[], meta }` | Teacher-owned only; `401`, `403` |
| `PATCH /api/v1/teacher/courses/:courseId` | Nabile | Optional metadata fields | `{ data: { course } }` | Owner only; `400`, `401`, `403`, `404` |

Shared user shape: `id`, `fullName`, `email`, `role` (`student` or `teacher`), `avatarUrl`.

Shared course shape: `id`, `title`, `slug`, `description`, `coverImageUrl`, `gradeLevel`, `status`, `teacher`, `sections`.

Teacher patch fields: optional `title` (3-150 chars), `description` (max 5000), `coverImageUrl` (URL/null), `gradeLevel` (max 100/null), `status` (`draft` or `published`). Slug editing is excluded.

## Sprint 1 Boundaries

Do **not** implement these in Sprint 1: attendance/progress, quiz submission/grading, PDF upload, RAG/AI tutor, notifications, checkout, sales, analytics agent, public enrollment, course creation, live streaming, homework publishing, AI quiz generation, or automatic suspension.

## Test Plan

Backend:

- [ ] Auth success/failure/logout/session expiry.
- [ ] Role guards for student and teacher endpoints.
- [ ] Migration on empty local DB and seed reset twice.
- [ ] Student enrollment filters and enrolled/forbidden course access.
- [ ] Teacher owned-course read/update and forbidden update.

Frontend:

- [ ] Role redirects, API-loaded student/teacher pages, shared states, 390/1440 px RTL checks, and theme persistence.

Smoke:

- [ ] Migrate, seed, login as student, read dashboard/course, logout, login as teacher, edit course, reload, confirm persistence.

## Final Sprint 1 Definition of Done

- Everyone can run the project locally.
- Seeded student and teacher login work.
- Student and teacher see role-correct pages using API data.
- Core auth/course endpoint tests pass.
- Shared shell is RTL, responsive, and not the Vite starter.
- DB migration/seed instructions are clear and used by the whole team.
