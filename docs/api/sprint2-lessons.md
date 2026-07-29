# Lessons, Video, and Attendance API — Sprint 2 (CF-US-007)

Lesson detail, progress heartbeat, and attendance evaluation. Follows the conventions in
`docs/api-conventions.md` (no `data` envelope, `@CurrentUser()`, global `ValidationPipe`).

## Schema decision: `videos` becomes authoritative for playback

`schemaV2.sql` hangs attendance and progress off a `videos` table
(`attendance.video_id`, `content_progress.video_id`), but Sprint 1 put `video_url`
directly on `lessons` (`lesson.entity.ts`). This sprint creates `videos` per
`schemaV2.sql:297` and makes it authoritative for playback, progress, and attendance.

`lessons.video_url` is left in place, **unused**, on purpose — removing it would touch
the shared `GET /api/v1/courses/:courseId` contract (Seif's course-detail endpoint,
consumed by both student and teacher course pages), and that's out of scope for this
slice. Sprint 3 removes the column once nothing reads it.

## Schema deviation: `content_progress` narrowed to `video` / `lesson`

`schemaV2.sql:590` defines `content_progress` as a single polymorphic table covering
`video`, `quiz`, `homework`, and `lesson` items via nullable FK columns plus a CHECK
constraint. This sprint only wires `video` and `lesson`:

- `quiz_id` and `homework_id` columns **do not exist yet** — they're a Sprint 3
  migration, once Nabile's quiz-progress and homework needs are concrete.
- The CHECK constraint (`chk_content_progress_single_item`) only allows
  `item_type IN ('video', 'lesson')`.
- The `content_progress_item_type` **enum** still declares all four schemaV2.sql values.
  Adding a new enum value later is the awkward migration (transactional restrictions in
  Postgres); adding a nullable column and loosening a CHECK is routine. Declaring the
  full enum now avoids that awkward migration in Sprint 3.

This narrowing is also what lets Nabile's quiz tables ship this sprint without a hard FK
dependency on this table (sprint2-plan.md §2.5).

## Guards

`AuthGuard` + `StudentRoleGuard` on every lesson route — a teacher (or unauthenticated
caller) gets `401`/`403`, never `404` and never partial data.

## `GET /api/v1/lessons/:lessonId`

```json
{
  "id": "uuid",
  "title": "قوانين نيوتن للحركة",
  "video": { "id": "uuid", "url": "https://...mp4", "durationSeconds": 596 },
  "progress": { "lastPositionSeconds": 210, "watchedPercentage": 35.2, "status": "in_progress" }
}
```

`progress` reflects the caller's own `content_progress` row for this lesson's video, or
the zero-state (`lastPositionSeconds: 0`, `watchedPercentage: 0`, `status: "not_started"`)
if none exists yet — a student's first visit to a lesson never 404s on progress.

Errors: `401` no session · `403` not enrolled in this lesson's course · `404` lesson (or
its video) doesn't exist.

## `POST /api/v1/lessons/:lessonId/progress`

```json
{ "positionSeconds": 210, "watchedSeconds": 215 }
```

```json
{ "watchedPercentage": 36.1, "status": "in_progress", "attendanceAwarded": false }
```

**Progress is monotonic and server-derived, not client-trusted:**

- `watchedSeconds` may only ever increase. A lower value than what's already stored is
  silently ignored (the request still returns `200` with the unchanged, stored values) —
  it is not written and not treated as an error, because a client legitimately reports a
  lower "unique seconds watched" figure after a seek-back, and that must not regress
  progress.
- `watchedPercentage` is computed server-side as `watchedSeconds / video.durationSeconds`,
  **never** trusted from the client — the client never sends a percentage at all.
- `lastVideoPosition` (`positionSeconds`) may move freely in either direction; that's
  seeking, not progress, and is exactly what makes "resume" and "rewind" both work.
- `status` becomes `completed` once `watchedPercentage` reaches 100; otherwise
  `in_progress` after the first heartbeat, `not_started` before it.

Every heartbeat also runs attendance evaluation (see below); `attendanceAwarded` is `true`
only on the exact heartbeat that crosses the threshold, `false` on every other call
(including replays after attendance was already awarded).

Errors: `400` invalid body (negative/non-integer seconds) · `401` no session · `403` not
enrolled · `404` lesson/video not found.

## Attendance evaluation

Threshold from `ATTENDANCE_THRESHOLD_PERCENT` (default `70`, `.env.example`). On every
progress heartbeat: if `watchedPercentage >= threshold` and no `attendance` row exists yet
for `(studentId, videoId)`, one is inserted. `videos.min_attendance_percentage` (the
per-video override column from `schemaV2.sql`) is **not** read this sprint — the global
env var is the only threshold source; a per-video override is Sprint 3 scope if ever
needed.

The real correctness guarantee is `uq_attendance_student_video`, not an
application-level check: `AttendanceService` inserts optimistically and treats a unique
violation as a no-op, so ten concurrent heartbeats crossing the threshold at once still
produce exactly one row.

## Frontend

`useLesson(lessonId)` fetches lesson detail. `useProgressHeartbeat` throttles to one
`POST` per 15 seconds, plus one on `pause`/`ended`/`beforeunload`; it never fires while
paused. `StudentLessonPage` seeds `<video currentTime>` from the saved position on load,
shows a resume banner, and keeps the last persisted position on a media error instead of
losing it — a playback failure must never look like lost progress.

## Seed data

`apps/api/src/database/seeds/video.seed.ts` seeds one `recorded` video per seeded lesson,
cycling across four public-domain Blender Foundation short films
(`gtv-videos-bucket/sample/*.mp4`) for variety, with each film's documented runtime as
`durationSeconds`. These are third-party-hosted files outside this repo's control —
reverify playback and duration if the bucket's encode ever changes.

## Known gaps

- No live Postgres integration test for the attendance concurrency guarantee beyond the
  unit-level "ten concurrent calls" simulation — see `attendance.service.spec.ts`.
- `videos.min_attendance_percentage` exists in the schema but is not surfaced anywhere;
  it is dead data until a Sprint 3 per-video override lands.
