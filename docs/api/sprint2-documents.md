# Documents API — Sprint 2 (H-1/H-2/H-3)

Teacher PDF upload, list, and retry. Follows the conventions in `docs/api-conventions.md` (no `data` envelope, `@CurrentUser()`, global `ValidationPipe`).

## Guards

`AuthGuard` + `TeacherRoleGuard` on every route. Non-owner teacher → `403` (not `404`, not an empty list).

## `POST /api/v1/teacher/courses/:courseId/documents`

Multipart, field name `file`. Validated in this order, before a byte is stored: MIME is `application/pdf` **and** the first 4 bytes are `%PDF` → size ≤ `MAX_UPLOAD_BYTES` (default 20 MiB) → non-empty → caller owns the course.

```json
{ "id": "uuid", "fileName": "notes.pdf", "processingStatus": "pending", "version": 1 }
```

Errors: `400` invalid/missing PDF · `403` not the owner · `413` over the size limit.

Re-uploading a file whose SHA-256 already matches an active document **in the same course** bumps `version` instead of creating a new row.

## `GET /api/v1/teacher/courses/:courseId/documents`

```json
[{ "id": "uuid", "fileName": "notes.pdf", "processingStatus": "completed", "version": 2, "createdAt": "2026-07-28T10:00:00.000Z", "errorMessage": null }]
```

## `POST /api/v1/teacher/documents/:documentId/retry`

Only a `failed` document can be retried.

```json
{ "id": "uuid", "processingStatus": "pending" }
```

Errors: `403` not the owner · `404` not found · `409` document isn't `failed`.

## Storage

`LocalStorageAdapter` writes under `STORAGE_ROOT` (default `./storage`, outside anything served statically) with a random UUID filename — the original filename is never used on disk. `STORAGE_ROOT` is gitignored.

## Schema deviation

`documents.error_message` (migration `1785000032000`) isn't in `schemaV2.sql` — added because the frontend contract needs a failure reason and `ai_jobs.error_message` (Elgendy's worker) doesn't exist yet this sprint.

## JobQueuePort

`enqueueDocumentIngestion(documentId, version)`. Bound to `InMemoryJobQueue` (logs only) in `documents.module.ts` until Elgendy's real BullMQ adapter swaps it in — one line in that module's `providers`.

## Known gaps

No live Postgres integration test was run for this slice (sandboxed dev environment had no Docker access) — verified by unit tests against mocked repositories only. Run a real upload/list/retry cycle before relying on this in a demo.
