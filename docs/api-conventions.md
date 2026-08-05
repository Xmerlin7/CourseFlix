# API Conventions — CourseFlix (Sprint 1)

This documents what is **actually implemented on `dev` today**, not the aspirational contract in `sprint1-plan.md`. Where the two disagree, that's called out explicitly as an open item for the team to reconcile — this doc doesn't silently pick a side.

## Base path & versioning

There's no global route prefix configured in `main.ts`. Every controller hardcodes its own prefix, e.g. `@Controller('api/v1/student')`. Any new controller must repeat `api/v1/...` itself.

## Authentication

Session-based via an HTTP-only, signed cookie — not a bearer token.

- Cookie name: `SESSION_COOKIE_NAME` env var, defaults to `courseflix.sid`.
- Signed with `SESSION_SECRET` (via `cookie-parser`, configured in `main.ts`) — a tampered cookie fails signature verification before any session lookup happens.
- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/me` all read/write this cookie directly inside `AuthController` / `AuthService`. They do **not** go through `AuthGuard`.

`AuthGuard` validates the signed session cookie against `SessionsService.findActiveSession` and attaches `request.user` (`{ id, email, role, fullName, avatarUrl }`); it throws `401` if the cookie is missing or the session is expired/revoked. `StudentRoleGuard` / `TeacherRoleGuard` check `request.user.role` and throw `403` otherwise. Every controller that needs the current user reads it via the `@CurrentUser()` param decorator (`apps/api/src/common/decorators/current-user.decorator.ts`), not `request.user` directly.

## Request validation

A global `ValidationPipe` is registered in `main.ts`:
```ts
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
```
Any DTO using `class-validator` decorators (e.g. `LoginDto`) is validated automatically; unknown fields are rejected.

Plain query params not yet wrapped in a DTO — like `status` / `gradeLevel` on `GET /api/v1/student/enrollments` — are **not** covered by this pipe. They're validated manually in the service layer instead (see below).

## Response envelope

**Decided:** no `data` wrapper, anywhere. `sprint1-plan.md`'s endpoint table specified `{ data: {...} }`, but nothing shipped ever used it, so as of CF-TASK-010 this is the standardized convention rather than an open item — every endpoint returns its payload directly:

- `GET /api/v1/health` returns `{ api, database, timestamp }` directly.
- `POST /api/v1/auth/login` returns `{ user }` directly.
- `GET /api/v1/student/dashboard`, `GET /api/v1/student/enrollments`, `GET /api/v1/courses/:courseId`, `GET /api/v1/teacher/dashboard`, `GET /api/v1/teacher/courses`, and `PATCH /api/v1/teacher/courses/:courseId` all return their object/array directly.

## Error shape

No global exception filter is registered, so every error is Nest's default `HttpException` JSON:
```json
{ "statusCode": 400, "message": "Invalid status filter: \"foo\". Must be one of active, suspended, completed.", "error": "Bad Request" }
```

## Student endpoints (CF-TASK-023, updated for CF-TASK-013/014)

### `GET /api/v1/student/dashboard`

Guards: `AuthGuard`, `StudentRoleGuard`.

```json
{
  "student": { "id": "uuid", "fullName": "عبدالله حبسه", "email": "student@courseflix.local", "avatarUrl": null },
  "stats": {
    "enrolledCoursesCount": 2,
    "activeCoursesCount": 1
  },
  "overallProgressPercent": null,
  "continueLearning": null,
  "recentCourses": [
    { "courseId": "uuid", "courseTitle": "الميكانيكا الكلاسيكية", "coverImageUrl": null, "status": "active", "enrolledAt": "2026-07-01T12:00:00.000Z" }
  ]
}
```

- `overallProgressPercent` / `continueLearning` are `null` on purpose — out of scope until Sprint 2 per `sprint1-plan.md`'s Sprint 1 boundaries.
- `recentCourses[].courseTitle`/`coverImageUrl` come from `CoursesService.findByIds()` (bulk lookup, no course relation on `EnrollmentEntity` — see its docblock); `null` if the course was soft-deleted.
- `student` is enriched via `UsersService.findById()`.

### `GET /api/v1/student/enrollments?status=&gradeLevel=`

Guards: same as above.

- `status` — optional, one of `active | suspended | completed`. Invalid value → `400 Bad Request`.
- `gradeLevel` — optional, exact match against the enrolled course's `gradeLevel`. Applied in `StudentService` after bulk-fetching the enrolled courses (post-enrichment filter, since `EnrollmentEntity` has no course relation).

```json
[
  {
    "id": "uuid",
    "courseId": "uuid",
    "courseTitle": "الميكانيكا الكلاسيكية",
    "gradeLevel": "الصف الأول الثانوي",
    "status": "active"
  }
]
```

`EnrollmentsService.assertStudentEnrolled(studentId, courseId)` is the shared ownership check other modules call before exposing course-scoped data to a student — used by `GET /api/v1/courses/:courseId` below.

## Courses and teacher endpoints (CF-TASK-010/017/018/019)

### `GET /api/v1/courses/:courseId`

Guards: `AuthGuard` only (no role guard — shared by both roles). Enrolled student or owning teacher; `403` otherwise, `404` if the course doesn't exist. Returns ordered sections/lessons and `canEdit: true` only for the owning teacher.

```json
{
  "id": "uuid", "title": "...", "slug": "classical-mechanics", "description": "...",
  "coverImageUrl": null, "gradeLevel": "الصف الأول الثانوي", "status": "published",
  "teacher": { "id": "uuid", "fullName": "محمد عبدالرحمن" },
  "canEdit": false,
  "sections": [{ "id": "uuid", "title": "...", "sortOrder": 1, "lessons": [{ "id": "uuid", "title": "...", "videoUrl": null, "sortOrder": 1 }] }]
}
```

### `GET /api/v1/teacher/dashboard`, `GET /api/v1/teacher/courses?status=`, `PATCH /api/v1/teacher/courses/:courseId`

Guards: `AuthGuard`, `TeacherRoleGuard`. `courses` list/dashboard are owned-only (`teacher_id` filter); `status` query param is `draft | published | archived`, validated manually (400 on garbage, same pattern as the student `status` filter). `PATCH` accepts `title` (3-150 chars), `description` (max 5000), `coverImageUrl` (URL or `null`), `gradeLevel` (max 100 or `null`), `status` (`draft | published` only — `archived` isn't settable via patch); validated by `UpdateCourseDto`. `slug` is not editable.

## `GET /api/v1/health`

No guard. Returns `{ "api": "ok", "database": "ok" | "error", "timestamp": "<ISO>" }`. `database` is a real `SELECT 1` connectivity check; on failure it only ever reports `"error"` — the underlying exception (host, connection string, stack trace) is never surfaced.

## Course and enrollment status enums

- Enrollment status (`schemaV2.sql`, mirrored in `enrollment.entity.ts`): `active | suspended | completed`.
- Course status (`course.entity.ts`, matching `schemaV2.sql`'s `course_status` enum): `draft | published | archived`. `gradeLevel` is a real `courses.grade_level` column — an authorized Sprint 1 deviation from `schemaV2.sql`'s `category` column (see `CourseEntity`'s docblock for why).

## Running migrations and seeds locally

```bash
cd apps/api
npm run migration:run      # apply all pending migrations
npm run seed                # reset to the Sprint 1 fixture (upserts, repeatable)
npm run migration:revert   # roll back the most recent one
npm run migration:generate -- src/database/migrations/SomeName
```

Migrations live in `src/database/migrations/`; CLI config is in `src/database/data-source.ts`. `synchronize` is always `false` — migrations are the only supported way to change the schema (per root `CONTRIBUTING.md`). Seeds live in `src/database/seeds/` and are run together by `src/database/seed.ts`.