# Notifications API — Sprint 3 carryover (H-4)

Filters and mark-all-read, deferred from Sprint 2 (`docs/api/sprint2-notifications.md`). Same guards and userId-only scoping as the rest of the notifications API.

## `GET /api/v1/notifications?status&type`

Both filters are optional and combine with AND.

- `status`: `unread | read`
- `type`: `hw_assigned | quiz_ready | progress_report | announcement | course_update | system`

Invalid values return `400`. Response shape is unchanged from Sprint 2.

## `PATCH /api/v1/notifications/read-all`

```json
{ "updated": 3 }
```

Scoped to the caller's own `userId` and unread rows only — a bulk `UPDATE ... WHERE user_id = :userId AND is_read = false`. Idempotent: running it again with nothing unread returns `{ "updated": 0 }`.

## Frontend

`NotificationsPage` gained two chip filter rows (status, type — same `.chip.clickable.outline` pattern as `TeacherCoursesPage`'s status filter) and a "تحديد الكل كمقروء" button in the page header, matching the `ui5/notifications.html` mock. `useNotifications()` now owns filter state internally and refetches on change; mark-read/mark-all-read update local state instead of refetching.

## Known gaps

Vitest could not be executed in this environment (Node v26.4.0 crashes Vite's native bundler on this machine — a pre-existing, unrelated environment issue, not caused by this change). Verified via `tsc --noEmit` (clean) and a full spec file (`NotificationsPage.spec.tsx`) written to the project's existing MSW/RTL conventions, ready to run once vitest works. Backend verified with `npm run test:api` (12/12 passing) and no e2e/live-Postgres run (no DB available in this environment).
