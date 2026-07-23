# API Conventions — CourseFlix (Sprint 1)

This documents what is **actually implemented on `dev` today**, not the aspirational contract in `sprint1-plan.md`. Where the two disagree, that's called out explicitly as an open item for the team to reconcile — this doc doesn't silently pick a side.

## Base path & versioning

There's no global route prefix configured in `main.ts`. Every controller hardcodes its own prefix, e.g. `@Controller('api/v1/student')`. Any new controller must repeat `api/v1/...` itself.

## Authentication

Session-based via an HTTP-only, signed cookie — not a bearer token.

- Cookie name: `SESSION_COOKIE_NAME` env var, defaults to `courseflix.sid`.
- Signed with `SESSION_SECRET` (via `cookie-parser`, configured in `main.ts`) — a tampered cookie fails signature verification before any session lookup happens.
- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/me` all read/write this cookie directly inside `AuthController` / `AuthService`. They do **not** go through `AuthGuard`.

### Open item: `AuthGuard` is still a stub

`AuthGuard`, `StudentRoleGuard`, and `TeacherRoleGuard` (`apps/api/src/modules/auth/guards/`) currently all just `return true` and never attach `request.user`. Real session validation already exists (`SessionsService.findActiveSession`) — it's just not wired into these guards yet.

Practical effect: any endpoint behind `@UseGuards(AuthGuard, ...)` (all of `/api/v1/student/*`, for example) has **no real 401/403 enforcement yet**. Controllers that need the current user throw a plain `Error` if `request.user` is missing, as an interim fail-loud placeholder — not a real `401`.

## Request validation

A global `ValidationPipe` is registered in `main.ts`:
```ts
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
```
Any DTO using `class-validator` decorators (e.g. `LoginDto`) is validated automatically; unknown fields are rejected.

Plain query params not yet wrapped in a DTO — like `status` / `gradeLevel` on `GET /api/v1/student/enrollments` — are **not** covered by this pipe. They're validated manually in the service layer instead (see below).

## Response envelope

### Open item: the envelope is inconsistent right now

`sprint1-plan.md`'s endpoint table specifies every response wrapped as `{ data: {...} }`. As actually implemented:

- `GET /api/v1/health` returns `{ status, service, dependencies }` directly — no wrapper, and different field names than the documented `{ api, database, timestamp }`.
- `POST /api/v1/auth/login` returns `{ user }` directly — this one does match its own contract row (which never specified a wrapper).
- `GET /api/v1/student/dashboard` and `GET /api/v1/student/enrollments` (this doc's scope) also return the raw object/array directly, for consistency with what's already shipped — not because the original contract table was followed.

**This needs a one-time team decision, not something to resolve unilaterally in a docs PR.** Recommend confirming with Seif (health/course owner) and Albraa (auth owner) whether to standardize on a `data` wrapper everywhere going forward, or drop it from the contract table since nothing currently uses it.

## Error shape

No global exception filter is registered, so every error is Nest's default `HttpException` JSON:
```json
{ "statusCode": 400, "message": "Invalid status filter: \"foo\". Must be one of active, suspended, completed.", "error": "Bad Request" }
```

## Student endpoints (this doc's scope — CF-TASK-023)

### `GET /api/v1/student/dashboard`

Guards: `AuthGuard`, `StudentRoleGuard` (see open item above — not enforced yet).

```json
{
  "student": { "id": "uuid" },
  "stats": {
    "enrolledCoursesCount": 2,
    "activeCoursesCount": 1
  },
  "overallProgressPercent": null,
  "continueLearning": null,
  "recentCourses": [
    { "courseId": "uuid", "status": "active", "enrolledAt": "2026-07-01T12:00:00.000Z" }
  ]
}
```

- `overallProgressPercent` / `continueLearning` are `null` on purpose — out of scope until Sprint 2 per `sprint1-plan.md`'s Sprint 1 boundaries.
- `recentCourses[].courseId` only — no title/cover image yet. Blocked on `CourseEntity` becoming a real TypeORM entity (Seif's track).
- `student` only carries `id` — no `fullName` / `email` / `avatarUrl` yet. Blocked on `UsersService` exposing a real profile lookup.

### `GET /api/v1/student/enrollments?status=&gradeLevel=`

Guards: same as above.

- `status` — optional, one of `active | suspended | completed`. Invalid value → `400 Bad Request`.
- `gradeLevel` — accepted as a query param but **not applied**. `courses` has no `grade_level` column in `schemaV2.sql` (it has `category` instead). Left as a documented no-op rather than silently filtering on the wrong field. Needs a decision from Seif/Nabile: map to `category`, or add a real column.

```json
[
  {
    "id": "uuid",
    "courseId": "uuid",
    "courseTitle": "optional — blocked on course join, see gradeLevel note above",
    "gradeLevel": "optional — same",
    "status": "active"
  }
]
```

`EnrollmentsService.assertStudentEnrolled(studentId, courseId)` is the shared ownership check other modules should call before exposing course-scoped data to a student — e.g. Seif's `GET /api/v1/courses/:courseId`.

## Enrollment status enum

Canonical values (from `schemaV2.sql`, mirrored in `enrollment.entity.ts`): `active | suspended | completed`.

Don't confuse this with the *course* `status` enum. The current `CourseEntity` stub says `draft | active | archived`, but `schemaV2.sql` says `draft | published | archived` — another unresolved mismatch, out of this doc's scope to fix, but worth the team's attention.

## Running migrations locally

```bash
cd apps/api
npm run migration:run      # apply all pending migrations
npm run migration:revert   # roll back the most recent one
npm run migration:generate -- src/database/migrations/SomeName
```

Migrations live in `src/database/migrations/`; CLI config is in `src/database/data-source.ts`. `synchronize` is always `false` — migrations are the only supported way to change the schema (per root `CONTRIBUTING.md`).