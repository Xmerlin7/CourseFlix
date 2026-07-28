# Notifications API — Sprint 2 (H-4)

List, unread count, and mark-read. Follows `docs/api-conventions.md` conventions.

## Guards

`AuthGuard` only — both roles. Every read and mutation is scoped by the session-derived `userId`, never a query param, so one user can never see or mark-read another's notification.

## `GET /api/v1/notifications`

```json
[{ "id": "uuid", "type": "course_update", "title": "...", "message": "...", "isRead": false, "createdAt": "2026-07-28T10:00:00.000Z" }]
```

`type` is one of `hw_assigned | quiz_ready | progress_report | announcement | course_update | system`.

## `GET /api/v1/notifications/unread-count`

```json
{ "count": 3 }
```

## `PATCH /api/v1/notifications/:notificationId/read`

Idempotent — marking an already-read notification is a no-op, no extra write.

```json
{ "id": "uuid", "isRead": true }
```

Errors: `403` belongs to another user · `404` not found.

## NotificationProducerPort

`notify({ userId, type, title, message, relatedEntityType?, relatedEntityId? })`. `NotificationsService` implements this directly and is bound to the port token via `useExisting` in `notifications.module.ts` — no fake needed on this side. Elgendy's worker (or anyone else) gets the real implementation the moment it imports `NotificationsModule` and injects `NOTIFICATION_PRODUCER_PORT`.

## Schema note

`deliveryStatus` / `scheduledAt` exist in `schemaV2.sql` and are mirrored on the entity but stay `null` this sprint — there's no delivery channel or scheduler yet, every notification is written synchronously.

## Frontend

`useUnreadNotificationsCount()` polls every 30s from both `StudentLayout`/`TeacherLayout` (not just the notifications page) so the Topbar badge stays current. `useNotifications()` backs the list page and updates state locally on mark-read instead of refetching.

## Known gaps

No live Postgres integration test and no browser/component test (no test harness exists in `apps/web` yet — Seif's S-1 never landed). Verified by unit tests against mocked repositories, `tsc`, and `build` only.
