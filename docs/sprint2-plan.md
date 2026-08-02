# CourseFlix Sprint 2 Execution Plan

Sprint 2 window: **Sunday, July 26 → Thursday, July 30, 2026**.
This plan was written on **Monday, July 27** — day 1 is already spent. See "Capacity reality" below.

**Sprint goal:** a student opens a lesson and their watch progress persists and earns attendance; submits an objective quiz and gets a server-graded result; a teacher uploads a PDF and watches it become searchable; and the student asks the AI Tutor a question and gets an answer **with a citation — or an honest "the uploaded material doesn't cover this."**

---

## 0. Read this first — the three rules this plan is built on

1. **Nobody waits for anybody.** Every cross-person dependency is replaced by a **port** (a TypeScript interface) that is merged on day 1 with a fake implementation behind it. You build against the interface. When your teammate's real adapter lands, one line in a module swaps it in. You are never blocked, and you never merge a stub into `main`.
2. **Everyone ships both backend and frontend — except Elgendy.** Every other member owns at least one API slice *and* at least one React page, so nobody spends the sprint in a single layer. **Elgendy writes zero UI**: his entire slice is the worker, the queue, the vector store, and the infrastructure. No `.tsx` file is assigned to him. See the layer split in §1.
3. **You own your files; you do not touch anyone else's.** Every shared file that four people would otherwise fight over is edited **once**, on day 1, in a single PR (§2). After that PR, your task list touches only files you own.

---

## 1. Capacity reality — read before you commit

The delivery plan budgeted Sprint 2 as 120h over 5 working days. **We are starting on day 2.** Four working days remain (Mon 27 → Thu 30), which is 4 × 6h × 5 people = **120h gross**. Planning 120h of tasks into 120h of capacity leaves zero room for standups, review, integration, or a single bug — it would be a plan that fails on paper.

So Sprint 2 is planned at **98h (81.7% utilization), 22h buffer**, and five items are explicitly deferred:

| Deferred to Sprint 3 | Why |
|---|---|
| Full RAG evaluation dataset + automated eval command (CF-TASK-049/050) | Reduced to two concrete tests: Elgendy's two-course isolation test and Seif's no-answer test. The 10-question evaluation set needs a stable Tutor first. |
| Full prompt-injection matrix (CF-TASK-051) | Reduced to 3 canonical injection cases inside Seif's S-3 tests. |
| Notification page filters and mark-all-read UI | Sprint 2 ships list + unread badge + mark-one-read. That is enough for the demo. |
| Tutor conversation-history endpoint | Sprint 2 persists history; reading it back is Sprint 3. |
| Seif-owned analytics/GTM/dataLayer work (S-4 / CF-TASK-061/062) | Deferred to the last sprint by team decision. Sprint 2 ships the Tutor product slice without analytics hooks. |

This is the scale-down decision stated openly. If the team would rather extend Sprint 2 into Sunday Aug 2, say so at Monday standup — but that is a call for the whole team, and it costs Sprint 3 a day.

### Added by team decision: student self-registration (CF-US-037, 6h)

Registration is classified **POST-MVP** in [courseflix-scrum-jira-plan.md:92](docs/courseflix-scrum-jira-plan.md#L92). It is pulled into Sprint 2 by explicit team decision. Recorded here so the reclassification is traceable — **password recovery, email verification, and teacher/admin account creation stay POST-MVP.**

There was no spare capacity, so it is paid for openly rather than absorbed:

- **Nabile takes it** (6h). It is a small, self-contained vertical slice with zero dependencies on anyone — the cleanest possible thing to bolt onto an existing sprint.
- Team goes 96h → 98h after deferring S-4 analytics/GTM/dataLayer, buffer 24h → 22h, utilization 80% → 81.7%. Nobody exceeds their 24h gross.
- **The 22h buffer is now the entire margin for integration and bugs across four days. Any further addition means something comes out.**

### Rebalance so everyone works in both layers

Requirement: every member ships backend *and* frontend, except Elgendy. Only one person violated that in the first draft — **Seif was backend + tooling only**. Two moves fix it, and both are structurally better than what they replace:

| Move | From → To | Why it's an improvement, not just shuffling |
|---|---|---|
| **Tutor chat UI (5h)** | Nabile → **Seif** | Seif already owns the Tutor API, prompt policy, and citation contract. Giving him the chat page makes the Tutor a **single-owner vertical slice** and **deletes a cross-person seam** (§9 previously had "Nabile UI ↔ Seif API"). It also gives Seif real frontend work. |
| **Smoke test (3h)** | Seif → **Albraa** | The smoke path is login → course → **lesson → heartbeat**. Two of those four steps are Albraa's endpoints, so he is the one who can tell instantly whether a failure is a real regression or a fixture problem. |

Net effect: Nabile frees 5h and absorbs the 6h registration slice; Seif swaps 3h of backend for 5h of frontend; Albraa picks up 3h of backend.

### Per-person load

| Member | Backend slice | Frontend slice | BE | FE | Total |
|---|---|---|---:|---:|---:|
| **Elgendy** | Platform, worker, vectors, retrieval | **none — by request** | 20h | 0h | **20h** |
| **Habsa** | Documents/upload API, notifications API, security tests | Teacher Files tab, notifications page | 12h | 7h | **19h** |
| **Albraa** | Lessons/heartbeat/attendance API, tests, **smoke test** | Lesson player page | 17h | 5h | **22h** |
| **Nabile** | Quiz API + grading, **registration API**, tests | Quiz page, **registration page** | 14h | 6h | **20h** |
| **Seif** | Tutor API, prompt safety, chat persistence, test harness | **Tutor chat page** | 12h | 5h | **17h** |
| **Team** | | | 75h | 23h | **98h** |

Everyone except Elgendy owns at least one endpoint **and** at least one React page. Spread is 17h–22h after the analytics deferral, and no one is over their 24h gross.

---

## 2. Day 1, first two hours — the contract PR (whole team, one call)

Branch: `feature/cf-s2-contracts`. **One PR. Interfaces and constants only — zero implementations.** Merged before anyone starts feature work. This is what makes the rest of the sprint parallel.

Everyone is in the call; **Seif drives the keyboard** and pushes the single commit.

### 2.1 New API port files — `apps/api/src/common/ports/` *(new directory)*

| File | Declares | Producer | Implementer |
|---|---|---|---|
| `job-queue.port.ts` | `JobQueuePort { enqueueDocumentIngestion(documentId: string, version: number): Promise<string> }` + `JOB_QUEUE_PORT` injection token | Habsa calls it | Elgendy implements it |
| `retrieval.port.ts` | `RetrievalPort { search(q: { courseId, query, topK }): Promise<RetrievedChunk[]> }`, `RetrievedChunk { chunkId, vectorId, documentId, page, excerpt, score }` + `RETRIEVAL_PORT` token. `chunkId` is the Postgres `document_chunks.id`; `vectorId` is the Chroma bridge ID. | Seif calls it | Elgendy implements it |
| `notification-producer.port.ts` | `NotificationProducerPort { notify(input: { userId, type, title, message, relatedEntityType?, relatedEntityId? }): Promise<void> }` + `NOTIFICATION_PRODUCER_PORT` token | Elgendy calls it | Habsa implements it |

Each port file also exports an in-memory fake right next to it (`InMemoryJobQueue`, `FixtureRetrieval`, `NoopNotificationProducer`) so callers are runnable from minute one. **Rule: a fake is bound in your feature module only until the real adapter merges; swapping it is a one-line change in the `providers` array.**

### 2.2 Shared web files — edited once, here, by nobody else afterwards

| File | Change |
|---|---|
| [apps/web/src/app/routes/route-paths.ts](apps/web/src/app/routes/route-paths.ts) | Add `REGISTER: '/register'`, `STUDENT.LESSON_DETAIL: '/student/lessons/:lessonId'`, `STUDENT.QUIZ_DETAIL: '/student/quizzes/:quizId'`, `STUDENT.ASSISTANT: '/student/courses/:courseId/assistant'`, `STUDENT.NOTIFICATIONS: '/student/notifications'`, `TEACHER.NOTIFICATIONS: '/teacher/notifications'` |
| [apps/web/src/app/routes/router.tsx](apps/web/src/app/routes/router.tsx) | Add the six route entries, each lazily importing a page that already exists as a one-line placeholder component. **`/register` goes inside the existing `AuthLayout` children array (line 69), as a sibling of `/login`** — it must stay outside `RequireRole` so a logged-out visitor can reach it |
| [apps/web/src/shared/components/Sidebar.tsx](apps/web/src/shared/components/Sidebar.tsx) | **Fixes CF-BUG-001.** Replace every `<a href>` (lines 54, 68) with `NavLink` from `react-router`; point nav items at `ROUTE_PATHS` constants instead of hand-typed strings; delete the dead `/student/progress`, `/teacher/students`, `/settings` entries and correct `/teacher/course` → `/teacher/courses` |

### 2.3 New feature-type files — one per owner, empty response shapes only

Create the folder skeleton so nobody creates a conflicting one later:

- `apps/web/src/features/lessons/types/lesson.types.ts` (Albraa)
- `apps/web/src/features/quizzes/types/quiz.types.ts` (Nabile)
- `apps/web/src/features/tutor/types/tutor.types.ts` (Seif — he now writes *and* consumes it, so this is no longer a cross-person seam)
- `apps/web/src/features/documents/types/document.types.ts` (Habsa)
- `apps/web/src/features/notifications/types/notification.types.ts` (Habsa)

Registration is the one slice with **no new type file**: it extends the existing [apps/web/src/features/auth/types/auth.types.ts](apps/web/src/features/auth/types/auth.types.ts) with `RegisterRequest` / `RegisterResponse`. Add those two types **in this PR** so the shape is frozen; after that the whole `features/auth/` registration surface is Nabile's alone.

### 2.4 Empty Nest modules registered in `app.module.ts`

Create `lessons`, `quizzes`, `documents`, `notifications`, `tutor` module files with an empty `@Module({})` and register all five in [apps/api/src/app.module.ts](apps/api/src/app.module.ts) **in this PR**. After this, nobody touches `app.module.ts` again this sprint.

### 2.5 Migration timestamp blocks — assigned, non-negotiable

TypeORM runs migrations in filename-timestamp order. Foreign keys mean order matters. Use **only** your block:

| Owner | Timestamp block | Tables |
|---|---|---|
| Albraa | `1785000010000` – `1785000019999` | `videos`, `content_progress`, `attendance` |
| Nabile | `1785000020000` – `1785000029999` | `questions`, `quizzes`, `quiz_questions`, `quiz_submissions`, `quiz_submission_answers` |
| Habsa | `1785000030000` – `1785000039999` | `files`, `documents`, `notifications` |
| Elgendy | `1785000040000` – `1785000049999` | `ai_jobs`, `document_chunks` |
| Seif | `1785000050000` – `1785000059999` | `chat_conversations`, `chat_messages`, `chat_message_source_chunks` |

**Registration adds no migration.** The `users` table, the `user_role` enum, and the `user_status` enum all shipped in Sprint 1 ([user.entity.ts](apps/api/src/modules/users/entities/user.entity.ts)). Nabile's registration slice inserts rows into an existing table — if you find yourself writing a migration for it, stop and re-read this line.

Two FK dependencies were **designed out** so this ordering never blocks anyone:

- **Nabile's `quizzes` table omits `source_document_id`** this sprint. `schemaV2.sql` has it, but it is only for AI-generated quizzes, which is Sprint 3 (CF-US-024). Sprint 2 quizzes are `generation_type = 'manual'`. → Nabile does not wait for Habsa.
- **Albraa's `content_progress` ships with `video_id` and `lesson_id` only**, and the `chk_content_progress_single_item` CHECK is narrowed to those two `item_type` values. The `quiz_id` / `homework_id` columns are added by a Sprint 3 migration. → Albraa does not wait for Nabile.

### 2.6 Seed-file merge protocol

Four people append to [apps/api/src/database/seed.ts](apps/api/src/database/seed.ts). Rule: **append exactly one call at the end of `run()`, in this fixed order**, and `git rebase origin/dev` immediately before pushing:

```
seedUsers → seedCourse → seedEnrollment      (Sprint 1, do not touch)
  → seedVideo         (Albraa)
  → seedQuiz          (Nabile)
  → seedDocument      (Habsa)
```

Anything else in that file is off-limits.

---

## 3. Elgendy — Platform, Ingestion Worker, and Vectors *(20h, no UI)*

**You own the machinery. Nothing you write renders in a browser.** Everything downstream of an uploaded PDF is yours, up to and including the retrieval call that the Tutor makes.

**You depend on:** the `documents` table shape (Habsa's H-1). You do **not** wait for it — the shape is frozen in the contract PR, and you develop against a hand-inserted fixture row until her migration merges on day 1.

### E-1 — Infrastructure and the worker workspace *(4h, day 1)*

**This is the whole team's day-1 unblocker. Ship it first, before your own feature work.**

| File | Deferred action |
|---|---|
| [docker-compose.yml](docker-compose.yml) | **Edit.** Add `redis` (`redis:7-alpine`, port `${REDIS_PORT:-6379}`, healthcheck `redis-cli ping`) and `chroma` (`chromadb/chroma`, port `${CHROMA_PORT:-8000}`, named volume `courseflix_chroma_data`) alongside the existing `postgres` service |
| [.env.example](.env.example) | **Edit.** Add `REDIS_HOST`, `REDIS_PORT`, `CHROMA_URL`, `CHROMA_COLLECTION`, `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_API_KEY=replace-me`, `INGESTION_CHUNK_TOKENS=800`, `INGESTION_CHUNK_OVERLAP=120`, `MAX_UPLOAD_BYTES=20971520`, `STORAGE_ROOT=./storage` — **placeholders only, never a real key** |
| [package.json](package.json) | **Edit.** Convert to real npm workspaces: `"workspaces": ["apps/api", "apps/web", "apps/worker"]`, and replace the `--prefix` scripts with `-w` scripts. Add `dev:worker`, `build:worker`, `test:worker` |
| `apps/worker/` | **New workspace.** `package.json`, `tsconfig.json`, `src/main.ts`, `src/queues/ingestion.queue.ts`, `src/processors/ingestion.processor.ts`. NestJS standalone app, BullMQ consumer |
| `README.md` | **Edit.** One new section: how to bring up Redis + Chroma and run the worker |

**Done when:** a teammate on a clean checkout runs `docker compose up -d && npm install && npm run migration:run && npm run seed && npm run dev:worker` and the worker logs "waiting for jobs". Post the exact commands in the team channel the moment it works — **four people are waiting on this**.

### E-2 — Job lifecycle *(3h)*

| File | Action |
|---|---|
| `apps/api/src/database/migrations/1785000040000-CreateAiJobs.ts` | **New.** `ai_jobs` per [schemaV2.sql:548](schemaV2.sql#L548) — `job_type`, `status` (`ai_job_status` enum), `priority`, `retries`, `target_entity_type`, `target_entity_id`, `started_at`, `finished_at`, `error_message` |
| `apps/api/src/database/migrations/1785000041000-CreateDocumentChunks.ts` | **New.** `document_chunks` per [schemaV2.sql:259](schemaV2.sql#L259) — FK to `documents(id)`, `chunk_index`, `text_preview`, `vector_id`, `page_number`, `token_count`, `is_active`, `deleted_at` |
| `apps/api/src/modules/jobs/entities/ai-job.entity.ts` | **New.** Follow the docblock style of [enrollment.entity.ts](apps/api/src/modules/enrollments/entities/enrollment.entity.ts) |
| `apps/api/src/modules/jobs/entities/document-chunk.entity.ts` | **New.** |
| `apps/api/src/modules/jobs/jobs.service.ts` | **New.** `claim()`, `markProcessing()`, `markCompleted()`, `markFailed(error)`, `incrementRetry()` — every transition writes `ai_jobs` |
| `apps/api/src/modules/jobs/jobs.module.ts` | **New.** Binds the real BullMQ `JobQueuePort` implementation, replacing the day-1 `InMemoryJobQueue` |

**Idempotency rule:** the BullMQ job ID must be `ingest:${documentId}:v${version}`. Re-enqueueing the same document version must never create a second job.

### E-3 — Extraction and chunking *(4h)*

| File | Action |
|---|---|
| `apps/worker/src/stages/extract.stage.ts` | **New.** `pdf-parse` (or `pdfjs-dist`) → per-page `{ page, text }`. A PDF that yields zero extractable characters (scanned image) **fails the job with a clear reason** — it does not silently succeed |
| `apps/worker/src/stages/chunk.stage.ts` | **New.** Deterministic token windowing: `INGESTION_CHUNK_TOKENS` = 800, overlap 120. Each chunk carries `{ documentId, version, chunkIndex, page, text, tokenCount }`. Same input file ⇒ byte-identical chunk boundaries, every run |
| `apps/worker/src/stages/extract.stage.spec.ts` | **New.** Two fixtures: a digital PDF and a blank/scanned one |

### E-4 — Embeddings and Chroma upsert *(4h)*

| File | Action |
|---|---|
| `apps/worker/src/adapters/embedding.adapter.ts` | **New.** Provider-agnostic interface + one concrete implementation + a deterministic `MockEmbeddingProvider` used by all tests. **Every test runs on the mock — no test may hit a paid API** |
| `apps/worker/src/adapters/chroma.adapter.ts` | **New.** `upsert(chunks)` into a single collection. Vector ID = `${documentId}:${version}:${chunkIndex}`. Metadata is **mandatory and validated before the call**: `courseId`, `documentId`, `version`, `chunkIndex`, `page`. A chunk missing any of these throws — it is never indexed |
| `apps/worker/src/processors/ingestion.processor.ts` | **Edit.** Wire extract → chunk → embed → upsert → persist `document_chunks` → set `documents.processing_status = 'completed'` → call `NotificationProducerPort` |

**Failure contract:** any stage throwing must record the stage name and error on `ai_jobs`, set `documents.processing_status = 'failed'`, notify the teacher, and leave the job retryable. Partial chunks from a failed run are marked `is_active = false`, never left live.

### E-5 — Retrieval and isolation proof *(5h)*

| File | Action |
|---|---|
| `apps/api/src/modules/retrieval/retrieval.service.ts` | **New.** The real `RetrievalPort`. Query Chroma with a **mandatory** `where: { courseId, isActive: true }` filter, top-k from config (default 5), map results to `RetrievedChunk` by joining `document_chunks` for `page` and `documentId` |
| `apps/api/src/modules/retrieval/retrieval.module.ts` | **New.** Exports the provider bound to `RETRIEVAL_PORT` — this is the one-line swap that replaces Seif's `FixtureRetrieval` |
| `apps/api/src/modules/retrieval/retrieval.service.spec.ts` | **New.** **The most important test in the sprint:** index two courses with deliberately similar Arabic physics text, query course A, assert **zero** chunks from course B come back. Also: superseded version (`version < active`) never returned |
| `apps/worker/src/processors/ingestion.processor.spec.ts` | **New.** Failure injection — kill the embed stage mid-run, assert `ai_jobs.status = 'failed'` with the stage recorded, then retry and assert clean completion with no duplicated chunks |

**Your definition of done:** upload fixture PDF → worker processes it → `document_chunks` rows exist with page numbers → `RetrievalPort.search()` returns them → the two-course isolation test is green. Then tell Seif to delete his fixture binding.

---

## 4. Habsa — Documents, PDF Upload, and Notifications *(19h)*

You own the teacher's file lifecycle end to end, and the notification system that tells them when it finished. Notifications live with you because **you own the thing that produces them** — a document completing or failing.

**Nothing blocks you.** You call `JobQueuePort`; the day-1 `InMemoryJobQueue` logs and returns a fake job ID, so your upload flow is fully testable before Elgendy's worker exists.

### H-1 — Storage and document tables *(3h)*

| File | Action |
|---|---|
| `apps/api/src/database/migrations/1785000030000-CreateFilesAndDocuments.ts` | **New.** `files` ([schemaV2.sql:154](schemaV2.sql#L154)) and `documents` ([schemaV2.sql:239](schemaV2.sql#L239)) — including `processing_status` (`processing_status_type` enum), `checksum`, `version`, `vector_namespace`, `deleted_at` |
| `apps/api/src/modules/documents/entities/file.entity.ts` | **New.** |
| `apps/api/src/modules/documents/entities/document.entity.ts` | **New.** Add a docblock explaining any deviation from `schemaV2.sql`, exactly like [course.entity.ts](apps/api/src/modules/courses/entities/course.entity.ts) does |
| `apps/api/src/modules/documents/storage/local-storage.adapter.ts` | **New.** Writes under `STORAGE_ROOT` (**outside** any served directory), filename = generated UUID key, **never** the user's filename. Interface-first so S3 can replace it later without touching the service |

`STORAGE_ROOT` must be added to `.gitignore`.

### H-2 — Upload, list, and retry API *(4h)*

| File | Action |
|---|---|
| `apps/api/src/modules/documents/documents.controller.ts` | **New.** `@Controller('api/v1')`. Three routes, all `AuthGuard` + `TeacherRoleGuard`: `POST teacher/courses/:courseId/documents`, `GET teacher/courses/:courseId/documents`, `POST teacher/documents/:documentId/retry`. Read the user via [`@CurrentUser()`](apps/api/src/common/decorators/current-user.decorator.ts) — never `request.user` |
| `apps/api/src/modules/documents/documents.service.ts` | **New.** Ownership check against `courses.teacher_id` (mirror the pattern in [teacher.service.ts](apps/api/src/modules/teacher/teacher.service.ts)), SHA-256 checksum, version bump on re-upload of the same checksum, then `JobQueuePort.enqueueDocumentIngestion()` |
| `apps/api/src/modules/documents/dto/upload-document.dto.ts` | **New.** |
| `apps/api/src/modules/documents/documents.module.ts` | **Edit** (created in the contract PR). |

**Validation, in this order, before a single byte is stored:** MIME is `application/pdf` **and** the first four bytes are `%PDF` (never trust the extension or the client's Content-Type) → size ≤ `MAX_UPLOAD_BYTES` → non-empty → caller owns the course. Reject with a specific message; do not create a `documents` row for a rejected upload.

### H-3 — Teacher Files tab UI *(4h)*

| File | Action |
|---|---|
| `apps/web/src/features/documents/api/documents.api.ts` | **New.** Follow [teacher.api.ts](apps/web/src/features/teacher/api/teacher.api.ts). Multipart upload needs a `postMultipart` helper — add it to [http-client.ts](apps/web/src/shared/api/http-client.ts) (**the one shared-file edit you are allowed**; it must not change the existing `post` signature) |
| `apps/web/src/features/documents/hooks/useCourseDocuments.ts` | **New.** Follow the `useEffect` pattern and honest docblock of [useTeacherCourses.ts](apps/web/src/features/teacher/hooks/useTeacherCourses.ts). Poll every 5s **only while** a document is `pending`/`processing`; stop polling otherwise |
| `apps/web/src/features/documents/components/DocumentUploader.tsx` | **New.** Drop zone + file picker, client-side type/size pre-check with a clear Arabic error |
| `apps/web/src/features/documents/components/DocumentStatusList.tsx` | **New.** Rows for `pending` / `processing` / `completed` / `failed`, with a retry button on `failed` |
| [apps/web/src/features/teacher/pages/TeacherCourseDetailPage.tsx](apps/web/src/features/teacher/pages/TeacherCourseDetailPage.tsx) | **Edit.** Add the Files tab. **This is your file — no one else edits it this sprint.** Visual reference: the Files tab in `ui5/teacher-course.html` |

### H-4 — Notifications *(4h)*

| File | Action |
|---|---|
| `apps/api/src/database/migrations/1785000031000-CreateNotifications.ts` | **New.** `notifications` per [schemaV2.sql:518](schemaV2.sql#L518) |
| `apps/api/src/modules/notifications/entities/notification.entity.ts` | **New.** |
| `apps/api/src/modules/notifications/notifications.service.ts` | **New.** Implements `NotificationProducerPort`; every read is scoped by `userId` from the session — **never** from a query param |
| `apps/api/src/modules/notifications/notifications.controller.ts` | **New.** `AuthGuard` only (both roles): `GET api/v1/notifications`, `GET api/v1/notifications/unread-count`, `PATCH api/v1/notifications/:notificationId/read` |
| `apps/web/src/features/notifications/api/notifications.api.ts`, `hooks/useNotifications.ts`, `pages/NotificationsPage.tsx` | **New.** List + mark-read. Filters are deferred to Sprint 3 |
| [apps/web/src/app/layouts/StudentLayout.tsx](apps/web/src/app/layouts/StudentLayout.tsx), [TeacherLayout.tsx](apps/web/src/app/layouts/TeacherLayout.tsx) | **Edit.** Replace `notificationCount={0}` and the no-op `onNotificationsClick` with the real unread count and a navigate. Two tiny edits — coordinate in the channel before pushing |

Elgendy's worker calls your `notify()` on completion and failure. Ship the port implementation **early** so his integration is a swap, not a rewrite.

### H-5 — Security and isolation tests *(4h)*

`apps/api/src/modules/documents/documents.service.spec.ts` — spoofed MIME (`.pdf` name, PNG bytes), oversized file, empty file, non-owner teacher gets `403`, duplicate checksum bumps version instead of duplicating.
`apps/api/src/modules/notifications/notifications.service.spec.ts` — user A can never read or mark-read user B's notification.

---

## 5. Albraa — Lesson Progress, Attendance, Video, and the Smoke Test *(22h — 17h backend, 5h frontend)*

You own the single most demo-critical loop: the student presses play, closes the tab, comes back, and lands exactly where they left off — with attendance awarded once and only once. You also own the end-to-end smoke test, because two of its four steps are your endpoints.

**Nothing blocks you.** Everything you need (courses, sections, lessons, enrollments) already exists on `dev`.

### A-1 — Data model decision and migrations *(3h)*

**Decision you own and must document:** `schemaV2.sql` hangs attendance and progress off a `videos` table (`attendance.video_id`, `content_progress.video_id`), but Sprint 1 put `video_url` directly on [lesson.entity.ts](apps/api/src/modules/courses/entities/lesson.entity.ts). **Create the `videos` table per `schemaV2.sql`** and make it authoritative for playback, progress, and attendance. Leave `lessons.video_url` in place, unused, to avoid touching Seif's course-detail contract. Sprint 3 removes it. Record this in `docs/api/sprint2-lessons.md` with the reasoning — do not leave the next person guessing.

| File | Action |
|---|---|
| `apps/api/src/database/migrations/1785000010000-CreateVideos.ts` | **New.** `videos` per [schemaV2.sql:297](schemaV2.sql#L297) |
| `apps/api/src/database/migrations/1785000011000-CreateContentProgress.ts` | **New.** `content_progress` per [schemaV2.sql:590](schemaV2.sql#L590), **narrowed**: `video_id` + `lesson_id` only, CHECK limited to `item_type IN ('video','lesson')`, plus the `uq_content_progress_student_item` unique constraint. See §2.5 for why |
| `apps/api/src/database/migrations/1785000012000-CreateAttendance.ts` | **New.** `attendance` per [schemaV2.sql:312](schemaV2.sql#L312), including `uq_attendance_student_video` |
| `apps/api/src/modules/lessons/entities/video.entity.ts`, `content-progress.entity.ts`, `attendance.entity.ts` | **New.** |
| `apps/api/src/database/seeds/video.seed.ts` | **New.** One `recorded` video per seeded lesson with a **real, browser-playable, CORS-friendly URL** and a correct `duration_seconds`. Register in [seed.ts](apps/api/src/database/seed.ts) per §2.6 |

### A-2 — Lesson and heartbeat API *(4h)*

| File | Action |
|---|---|
| `apps/api/src/modules/lessons/lessons.controller.ts` | **New.** `@Controller('api/v1')`, `AuthGuard` + `StudentRoleGuard`: `GET lessons/:lessonId`, `POST lessons/:lessonId/progress` |
| `apps/api/src/modules/lessons/lessons.service.ts` | **New.** Reuse [`EnrollmentsService.assertStudentEnrolled()`](apps/api/src/modules/enrollments/enrollments.service.ts) — do **not** write a second enrollment check |
| `apps/api/src/modules/lessons/dto/update-progress.dto.ts` | **New.** `positionSeconds: number` (int, ≥ 0), `watchedSeconds: number`. `class-validator` decorators — the global `ValidationPipe` with `forbidNonWhitelisted` handles the rest |

**The rule that makes this correct: progress is monotonic and server-derived.** `watchedSeconds` may only ever increase; a lower value is silently ignored, not written. `watchedPercentage` is computed server-side from `videos.duration_seconds` — **never** trusted from the client. `lastVideoPosition` may move freely (that's seeking).

### A-3 — Attendance evaluation *(3h)*

`apps/api/src/modules/lessons/attendance.service.ts` — **new**. Threshold from `ATTENDANCE_THRESHOLD_PERCENT` (default `70`, added to `.env.example` — coordinate with Elgendy's E-1 edit so you don't both touch that file at once). On every heartbeat: if `watchedPercentage >= threshold` and no attendance row exists for `(studentId, videoId)`, insert one. The unique constraint is the real guarantee — catch the conflict and no-op. **Ten concurrent heartbeats must produce exactly one attendance row.**

### A-4 — Lesson player page *(5h)*

| File | Action |
|---|---|
| `apps/web/src/features/lessons/api/lessons.api.ts` | **New.** |
| `apps/web/src/features/lessons/hooks/useLesson.ts` | **New.** |
| `apps/web/src/features/lessons/hooks/useProgressHeartbeat.ts` | **New.** Throttled to one POST per 15s **and** one on `pause`/`ended`/`beforeunload`. Never fires while paused |
| `apps/web/src/features/lessons/pages/StudentLessonPage.tsx` | **New.** `<video>` with `currentTime` seeded from saved position, resume banner, completion state, retryable error. Reuse [LoadingState](apps/web/src/shared/components/LoadingState.tsx) / [ErrorState](apps/web/src/shared/components/ErrorState.tsx) / [ForbiddenState](apps/web/src/shared/components/ForbiddenState.tsx). Visual reference: `ui5/lesson.html` |
| [apps/web/src/features/courses/components/CourseDetailView.tsx](apps/web/src/features/courses/components/CourseDetailView.tsx) | **Edit.** Link each lesson to its player route. **One small edit — announce it in the channel** |

**A media failure must never destroy saved progress.** Show a retry; keep the last persisted position.

### A-5 — Tests and cross-team review *(4h)*

`apps/api/src/modules/lessons/lessons.service.spec.ts` — resume returns the saved position; a lower `watchedSeconds` does not regress stored progress; duplicate heartbeats are idempotent; seek-back then replay doesn't inflate; a student cannot write progress on another student's enrollment; an unenrolled student gets `403`.
`apps/api/src/modules/lessons/attendance.service.spec.ts` — 69.9% awards nothing, 70.0% awards exactly one, 100% still exactly one.
**CF-TASK-083 (2h):** review Habsa's + Elgendy's work for course isolation and upload safety. Record findings in the PR. Two approvals are required on migration and authorization changes — see `CONTRIBUTING.md`.

### A-6 — Smoke test and dead-code cleanup *(3h — moved from Seif, see §1)*

**Carry-over: CF-TASK-024.** Sprint 1 promised this and never delivered it.

| File | Action |
|---|---|
| [apps/api/test/app.e2e-spec.ts](apps/api/test/app.e2e-spec.ts) | **Delete.** It is the untouched NestJS scaffold asserting `GET /` returns `"Hello World!"` — dead weight in the e2e run |
| `apps/api/test/smoke.e2e-spec.ts` | **New.** Reset seed → login as student → `GET /api/v1/courses/:courseId` → `GET /api/v1/lessons/:lessonId` → `POST` one progress heartbeat → logout. Reuse the setup in [auth.e2e-spec.ts](apps/api/test/auth.e2e-spec.ts), which is already well built |

You get this because steps 3 and 4 are your endpoints — when it goes red you will know in seconds whether it is a real regression or a fixture problem. **Note the e2e suite has never been proven green on any machine** (no local Postgres, no `.env` — see the closure audit), so budget the first 30 minutes for getting it to run at all.

---

## 6. Nabile — Quiz End to End, plus Student Registration *(20h — 14h backend, 6h frontend)*

Two vertical slices, both yours top to bottom: the quiz, and student self-registration. Neither has a single cross-person seam — you are the only member with zero ports to consume.

**Nothing blocks you.** The quiz needs only Sprint 1 data; registration needs only the `users` table, which already exists.

### N-1 — Quiz schema and seed *(3h)*

| File | Action |
|---|---|
| `apps/api/src/database/migrations/1785000020000-CreateQuizTables.ts` | **New.** `questions`, `quizzes`, `quiz_questions`, `quiz_submissions`, `quiz_submission_answers` per [schemaV2.sql:356-417](schemaV2.sql#L356-L417). **Omit `quizzes.source_document_id`** — see §2.5 |
| `apps/api/src/modules/quizzes/entities/*.entity.ts` | **New.** Five entities |
| `apps/api/src/database/seeds/quiz.seed.ts` | **New.** One published quiz on the seeded course: 3 MCQ + 2 true/false, real Arabic physics content matching the seeded lessons. Idempotent upsert — follow [course.seed.ts](apps/api/src/database/seeds/course.seed.ts). Register per §2.6 |

### N-2 — Quiz API and grading *(4h)*

| File | Action |
|---|---|
| `apps/api/src/modules/quizzes/quizzes.controller.ts` | **New.** `AuthGuard` + `StudentRoleGuard`: `GET api/v1/quizzes/:quizId`, `POST api/v1/quizzes/:quizId/submissions` |
| `apps/api/src/modules/quizzes/quizzes.service.ts` | **New.** Enrollment check via `EnrollmentsService.assertStudentEnrolled()` |
| `apps/api/src/modules/quizzes/grading.service.ts` | **New.** Pure, deterministic, no I/O — trivially unit-testable |
| `apps/api/src/modules/quizzes/dto/submit-quiz.dto.ts` | **New.** `answers: { questionId: string; selectedAnswer: string }[]` with nested `class-validator` decorators |

**Two rules you cannot bend:**
1. **`GET /quizzes/:quizId` must never serialize `questions.correct_answer`.** Use an explicit response DTO with a whitelist of fields — not entity spreading. Write the test that proves the key is absent from the JSON.
2. **Grading happens server-side only.** A client-sent `isCorrect` or `score` is ignored entirely. Store `quiz_version` on the submission so a later quiz edit can't rewrite history.

One attempt per student per quiz; a second `POST` returns `409` with a clear message.

### N-3 — Quiz UI *(4h)*

`apps/web/src/features/quizzes/api/quizzes.api.ts`, `hooks/useQuiz.ts`, `pages/StudentQuizPage.tsx` — **new**. Form → submit → result with score and per-question correctness (returned by the server *after* submission only). Reuse the shared state components. Visual reference: `ui5/quiz.html`.

### N-4 — Student self-registration, end to end *(6h — 4h API, 2h page)*

**CF-US-037, pulled from POST-MVP by team decision (§1).** Scope is exactly one thing: a logged-out visitor creates their own **student** account and lands in the app. **Password recovery, email verification, and teacher/admin account creation are not in this slice** — if you find yourself building them, stop.

**Backend *(4h)*:**

| File | Action |
|---|---|
| `apps/api/src/modules/auth/dto/register.dto.ts` | **New.** `fullName` (`@IsString`, `@MinLength(3)`), `email` (`@IsEmail`), `password` (`@IsString`, `@MinLength(8)` — same floor as [login.dto.ts](apps/api/src/modules/auth/dto/login.dto.ts), do not invent a different one). **No `role` field, ever** — see rule 1 |
| [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts) | **Edit.** Add `register()`. Reuse the existing argon2id hashing and the existing session-issuing path — **do not write a second hasher or a second session creator** |
| [apps/api/src/modules/auth/auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts) | **Edit.** Add `POST auth/register`, `@HttpCode(201)`, `@UseGuards(ThrottlerGuard)`. Set the session cookie with the **exact same options object** as `login()` — `httpOnly`, `secure`, `sameSite`, `signed`, `maxAge` |
| [apps/api/src/modules/auth/auth.service.spec.ts](apps/api/src/modules/auth/auth.service.spec.ts) | **Edit.** Cases listed below |

**Five rules you cannot bend:**

1. **The role is server-assigned, always `'student'`.** The DTO has no `role` property, so the global `ValidationPipe` with `forbidNonWhitelisted` rejects a body carrying one with `400`. The service still hardcodes `role: 'student'` — belt and braces. **There is no request shape that can create a teacher account.** Same for `status`: server-set to `'active'`.
2. **The response is the same shape as login — `{ user }` — and `passwordHash` is never in it.** Return the existing `AuthenticatedUser` shape from [authenticated-user.interface.ts](apps/api/src/modules/auth/interfaces/authenticated-user.interface.ts); do not spread the entity. Write the test that asserts the key is absent from the JSON.
3. **Register auto-logs-in.** A successful register issues a session and sets the cookie, so the new student lands on `/student/dashboard` without retyping their password. This is a deliberate decision: it reuses the login session path verbatim rather than adding a second unauthenticated flow.
4. **Email is matched case-insensitively and stored lowercased.** A duplicate returns `409` with a plain Arabic "this email is already registered". This does leak that an address exists — accepted knowingly for the MVP, because a registration form cannot avoid it without email verification, which is POST-MVP. Do not "fix" it by returning a fake success.
5. **Rate-limited like login.** Registration is an unauthenticated write endpoint; `ThrottlerGuard` is not optional.

Tests: duplicate email (and `USER@x.com` vs `user@x.com`) → `409`; body with `role: 'teacher'` → `400` and no row created; password under 8 chars → `400`; `passwordHash` absent from the response; a successful register issues a working session so `GET /me` returns the new student with `role: 'student'`.

**Frontend *(2h)*:**

| File | Action |
|---|---|
| `apps/web/src/features/auth/components/RegisterForm.tsx` | **New.** Mirror [LoginForm.tsx](apps/web/src/features/auth/components/LoginForm.tsx) — same field markup, same error surface, same disabled-while-submitting behavior. Client-side validation matches the DTO exactly, with Arabic messages |
| `apps/web/src/features/auth/pages/RegisterPage.tsx` | **New.** Renders `RegisterForm` inside `AuthLayout`; on success, navigate via [get-role-home-path.ts](apps/web/src/features/auth/utils/get-role-home-path.ts) — do not hardcode `/student/dashboard` |
| [apps/web/src/features/auth/api/auth.api.ts](apps/web/src/features/auth/api/auth.api.ts) | **Edit.** Add `register()` against the `RegisterRequest` / `RegisterResponse` types frozen in the day-1 PR |
| [apps/web/src/features/auth/context/AuthContext.tsx](apps/web/src/features/auth/context/AuthContext.tsx) | **Edit.** Expose `register` alongside `login`, setting the same auth state on success — otherwise the new user is authenticated on the server but logged out in the client |
| [apps/web/src/features/auth/pages/LoginPage.tsx](apps/web/src/features/auth/pages/LoginPage.tsx) | **Edit.** One link: "don't have an account? register". A registration page nobody can reach is not shipped |

The `/register` route and its `ROUTE_PATHS.REGISTER` constant are already in place from the day-1 contract PR (§2.2), **inside `AuthLayout` and outside `RequireRole`** — you write the page body only, and you do not touch `router.tsx`.

### N-5 — Tests and cross-team review *(3h)*

`apps/api/src/modules/quizzes/grading.service.spec.ts` — all-correct, all-wrong, partial, unanswered.
`apps/api/src/modules/quizzes/quizzes.service.spec.ts` — **answer key absent from the GET payload**, duplicate submission → `409`, unenrolled student → `403`, result survives a reload.
**CF-TASK-084 (2h):** review Albraa's lesson/attendance flow and Seif's event hooks.

*(Registration's own tests live inside N-4, with the code they cover.)*

---

## 7. Seif — The Tutor End to End, Prompt Safety, and Quality Harness *(17h — 12h backend, 5h frontend)*

Quality & Integration Lead. You carry the Sprint 1 items that never shipped, plus the Tutor **whole** — the grounding, the refusal policy, the citations, *and* the chat page that renders them. The Tutor being a single-owner vertical slice is the point: the citation contract never crosses a person boundary, so a no-answer can never be rendered with citations by someone who didn't write the policy.

**Nothing blocks you.** You call `RetrievalPort`; the day-1 `FixtureRetrieval` returns canned chunks from a seeded fixture, so your grounding and no-answer logic is fully testable before Chroma exists anywhere.

### S-1 — Frontend test harness *(3h — day 1 morning, before anything else)*

**Carry-over: CF-TASK-004/016.** Three people need this today.

| File | Action |
|---|---|
| [apps/web/package.json](apps/web/package.json) | **Edit.** Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `jsdom`. Add `"test": "vitest run"` and `"test:watch": "vitest"` |
| `apps/web/vitest.config.ts` | **New.** jsdom environment, setup file |
| `apps/web/src/testing/setup.ts` | **New.** jest-dom matchers + MSW server lifecycle |
| [apps/web/src/testing/renderWithProviders.tsx](apps/web/src/testing/renderWithProviders.tsx) | **Edit.** Replace the TODO with a real RTL `render` wrapped in [AppProviders](apps/web/src/app/providers/AppProviders.tsx) + `MemoryRouter`, with an auth-state override option |
| [apps/web/src/testing/mocks/handlers.ts](apps/web/src/testing/mocks/handlers.ts) | **Edit.** Replace `export const handlers: unknown[] = []` with handlers for every Sprint 1 endpoint plus the five Sprint 2 contracts — so the other four can mock instantly |
| [package.json](package.json) | Coordinate with Elgendy's E-1 edit: add `test:web` |

Write one proof test (`LoginForm` renders and submits) so the harness is demonstrably working, then announce it.

### S-2 — Chat persistence *(4h)*

| File | Action |
|---|---|
| `apps/api/src/database/migrations/1785000050000-CreateChatTables.ts` | **New.** `chat_conversations`, `chat_messages`, `chat_message_source_chunks` per [schemaV2.sql:462-499](schemaV2.sql#L462-L499). The `chunk_id` FK targets Elgendy's `document_chunks` — your timestamp block runs after his, so this is safe |
| `apps/api/src/modules/tutor/entities/*.entity.ts` | **New.** Three entities |
| `apps/api/src/modules/tutor/conversations.service.ts` | **New.** One active conversation per `(studentId, courseId)`; persist user and assistant messages with `model_name`, `provider`, `prompt_version`, `tokens_used` |

### S-3 — Grounded Tutor endpoint, guardrails, and citations *(5h)*

| File | Action |
|---|---|
| `apps/api/src/modules/tutor/tutor.controller.ts` | **New.** `AuthGuard` + `StudentRoleGuard`: `POST api/v1/courses/:courseId/tutor/messages`. Enrollment check via `EnrollmentsService.assertStudentEnrolled()` |
| `apps/api/src/modules/tutor/tutor.service.ts` | **New.** Inject `RETRIEVAL_PORT` |
| `apps/api/src/modules/tutor/prompt/grounded-prompt.template.ts` | **New.** Server-owned, versioned. Retrieved content goes in a **clearly delimited, explicitly untrusted** block, structurally separate from the instruction block |
| `apps/api/src/modules/tutor/prompt/answer-policy.service.ts` | **New.** Relevance threshold from config; below it, return `status: 'no_answer'` **without ever calling the model** |
| `apps/api/src/modules/tutor/adapters/llm.adapter.ts` | **New.** Provider-agnostic + a deterministic `MockLlmProvider` for tests |

**Four non-negotiables:**
1. Below the relevance threshold ⇒ `no_answer`, **zero citations**, no model call. Cheap, fast, and impossible to hallucinate.
2. Every returned citation is **validated against the chunks actually retrieved** before responding. A citation the model invented is dropped; if that leaves none, the answer is downgraded to `no_answer`.
3. Traces log `traceId`, latency, token counts, status, model — and **never** question text, answer text, or chunk content.
4. Provider timeout / rate-limit / error ⇒ a safe retryable response, never a stack trace to the client.

### S-4 — dataLayer and learning events *(4h — deferred to last sprint)*

**Carry-over: CF-TASK-061/062. Deferred by team decision.** [apps/web/src/shared/analytics/dataLayer.ts](apps/web/src/shared/analytics/dataLayer.ts) remains a TODO stub until the last sprint.

| File | Action |
|---|---|
| `apps/web/src/shared/analytics/dataLayer.ts` | **Edit.** Real versioned `pushDataLayerEvent`, `schemaVersion`, ecommerce-reset rule |
| `apps/web/src/shared/analytics/event-dictionary.ts` | **New.** Typed names + payload shapes for `lesson_start`, `lesson_progress` (25/50/75), `lesson_complete`, `quiz_start`, `quiz_submit`, `quiz_complete`, `ai_tutor_question`, `ai_tutor_answer` |
| `apps/web/src/shared/analytics/pii-denylist.ts` | **New.** Runtime guard that **throws in dev / drops in prod** on any key or value resembling email, password, full name, raw document text, or answer text |
| `apps/web/src/shared/analytics/dataLayer.spec.ts` | **New.** The denylist tests Sprint 1 promised. Assert that an event carrying an email is rejected |

Do not add these files or hook calls in Sprint 2. The last sprint owns analytics/GTM/dataLayer implementation and event verification.

### S-5 — Tutor chat page *(5h — moved from Nabile, see §1)*

Your API, your policy, your UI. Nobody else renders a citation this sprint.

| File | Action |
|---|---|
| `apps/web/src/features/tutor/api/tutor.api.ts` | **New.** Against `apps/web/src/features/tutor/types/tutor.types.ts`, frozen in the day-1 PR |
| `apps/web/src/features/tutor/hooks/useTutorChat.ts` | **New.** |
| `apps/web/src/features/tutor/components/CitationList.tsx` | **New.** Renders `documentName` + `page` per citation |
| `apps/web/src/features/tutor/pages/StudentAssistantPage.tsx` | **New.** Message list, input, typing indicator, retry on failure, mobile RTL. Visual reference: `ui5/assistant.html` |
| [sprint1-plan.md](sprint1-plan.md) | **Edit.** Small carry-over, do it while you wait on a review: fix the stale endpoint table — it still shows `{ data: … }` envelopes that were deliberately dropped (see [docs/api-conventions.md](docs/api-conventions.md) §"Response envelope") |

**The no-answer state is a first-class design, not an error.** When your own S-3 returns `status: 'no_answer'`, render a calm, clear Arabic message that the uploaded material doesn't cover the question — **and render no citations at all**. A fabricated-looking citation next to a no-answer is the single worst possible demo bug, and you now own both halves of preventing it.

Build the page against your own MSW handlers from S-1 while S-3 is still in progress, then point it at the live endpoint. **The smoke test is Albraa's (A-6), not yours** — CF-TASK-024 moved in §1, so do not write a second `smoke.e2e-spec.ts`.

---

## 8. Sprint 2 endpoint contract — frozen day 1

| Endpoint | Owner | Guards | Returns | Errors |
|---|---|---|---|---|
| `POST /api/v1/auth/register` | Nabile | **None** (public) + `ThrottlerGuard` | `201` `{ user: { id, email, fullName, role: 'student', avatarUrl } }` + session cookie | `400`, `409`, `429` |
| `GET /api/v1/lessons/:lessonId` | Albraa | Auth + Student | `{ id, title, video: { id, url, durationSeconds }, progress: { lastPositionSeconds, watchedPercentage, status } }` | `401`, `403`, `404` |
| `POST /api/v1/lessons/:lessonId/progress` | Albraa | Auth + Student | `{ watchedPercentage, status, attendanceAwarded }` | `400`, `401`, `403`, `404` |
| `GET /api/v1/quizzes/:quizId` | Nabile | Auth + Student | `{ id, title, questions: [{ id, type, text, options }] }` — **no `correctAnswer`** | `401`, `403`, `404` |
| `POST /api/v1/quizzes/:quizId/submissions` | Nabile | Auth + Student | `{ submissionId, score, total, answers: [{ questionId, isCorrect }] }` | `400`, `401`, `403`, `404`, `409` |
| `POST /api/v1/teacher/courses/:courseId/documents` | Habsa | Auth + Teacher | `{ id, fileName, processingStatus, version }` | `400`, `401`, `403`, `413` |
| `GET /api/v1/teacher/courses/:courseId/documents` | Habsa | Auth + Teacher | `[{ id, fileName, processingStatus, version, createdAt, errorMessage }]` | `401`, `403`, `404` |
| `POST /api/v1/teacher/documents/:documentId/retry` | Habsa | Auth + Teacher | `{ id, processingStatus }` | `401`, `403`, `404`, `409` |
| `GET /api/v1/notifications` | Habsa | Auth | `[{ id, type, title, message, isRead, createdAt }]` | `401` |
| `GET /api/v1/notifications/unread-count` | Habsa | Auth | `{ count }` | `401` |
| `PATCH /api/v1/notifications/:notificationId/read` | Habsa | Auth | `{ id, isRead }` | `401`, `403`, `404` |
| `POST /api/v1/courses/:courseId/tutor/messages` | Seif | Auth + Student | `{ messageId, status: 'answered' \| 'no_answer', answer, citations: [{ documentId, documentName, page, excerpt }] }` | `400`, `401`, `403`, `404`, `429`, `503` |

**Conventions — unchanged from Sprint 1, per [docs/api-conventions.md](docs/api-conventions.md):** no `{ data }` envelope; every controller hardcodes its own `api/v1/...` prefix; DTOs use `class-validator`; the current user comes from `@CurrentUser()`.

---

## 9. Dependency map — proof that nobody is blocked

```
                   Day-1 contract PR (all five, 2h)
                              |
    +-------------+-----------+-----------+-------------+
    |             |           |           |             |
 Elgendy       Habsa       Albraa      Nabile         Seif
 platform    documents    lessons    quiz +        tutor,
                                     register    brain + UI
    |             |           |           |             |
    |    JobQueuePort -->     |           |             |
    |    <-- NotificationProducerPort     |             |
    |                                  (none)           |
    +------------- RetrievalPort --------------------> |
```

| Seam | Consumer | Provider | Consumer is unblocked by |
|---|---|---|---|
| `JobQueuePort` | Habsa | Elgendy | `InMemoryJobQueue` (day 1) |
| `RetrievalPort` | Seif | Elgendy | `FixtureRetrieval` (day 1) |
| `NotificationProducerPort` | Elgendy | Habsa | `NoopNotificationProducer` (day 1) |
| `documents` table shape | Elgendy | Habsa | Frozen in the contract PR; fixture row until the migration lands |

**Three ports plus one frozen table shape — all one-line swaps.** No seam requires either side to change code the other wrote.

Two seams that existed in the first draft are **gone, not mitigated**: the Tutor response contract is no longer cross-person (Seif owns API *and* page, §7), and registration introduces no seam at all — it touches only `users`, which shipped in Sprint 1. **Nabile is the only member with zero ports to consume**, which is exactly why the registration slice landed on him.

---

## 10. Files nobody may touch outside a coordinated moment

| File | Who edits it | When |
|---|---|---|
| [apps/web/src/app/routes/route-paths.ts](apps/web/src/app/routes/route-paths.ts) | Contract PR only | Day 1 |
| [apps/web/src/app/routes/router.tsx](apps/web/src/app/routes/router.tsx) | Contract PR only | Day 1 |
| [apps/web/src/shared/components/Sidebar.tsx](apps/web/src/shared/components/Sidebar.tsx) | Contract PR only | Day 1 |
| [apps/api/src/app.module.ts](apps/api/src/app.module.ts) | Contract PR only | Day 1 |
| [docker-compose.yml](docker-compose.yml), [.env.example](.env.example) | **Elgendy only** | E-1, day 1 |
| [package.json](package.json) (root) | Elgendy (workspaces) + Seif (`test:web`) | Day 1, in that order |
| [apps/api/src/database/seed.ts](apps/api/src/database/seed.ts) | Append one line, fixed order (§2.6) | Rebase before every push |
| [apps/web/src/shared/api/http-client.ts](apps/web/src/shared/api/http-client.ts) | **Habsa only** (adds `postMultipart`) | H-3 |
| `StudentLayout.tsx` / `TeacherLayout.tsx` | **Habsa only** (notification badge) | H-4 |
| `CourseDetailView.tsx` | **Albraa only** (lesson links) | A-4 |
| `TeacherCourseDetailPage.tsx` | **Habsa only** (Files tab) | H-3 |
| `apps/api/src/modules/auth/` (controller, service, spec, dto) | **Nabile only** (adds `register`) | N-4 |
| `apps/web/src/features/auth/` (api, context, LoginPage) | **Nabile only** (adds `register`) | N-4 |

The `auth` module is Sprint 1 code that everyone else reads and nobody else writes this sprint. Nabile **adds** to it — he does not restructure `login`, `logout`, or the guards. If registration seems to need a change to the login path, that is a conversation in the channel, not a commit.

If you need an edit outside your list: **say so in the channel first.** A ten-second message beats a two-hour merge conflict.

---

## 11. Daily rhythm

| Day | Date | Checkpoint |
|---|---|---|
| **1** | Mon Jul 27 | Contract PR merged by 11:00. Elgendy's E-1 (Redis/Chroma/worker) and Seif's S-1 (test harness) merged by end of day — **everything else waits on these two, so they ship first**. Everyone else: migrations written and run locally. |
| **2** | Tue Jul 28 | Every API endpoint in §8 responds with real data (fakes still allowed behind ports). Habsa's upload stores a file. Albraa's heartbeat persists. Nabile's grading is green and `POST /auth/register` creates a student. |
| **3** | Wed Jul 29 | **Integration day.** All three port fakes are replaced with real adapters. A PDF goes upload → worker → chunks → retrieval. Seif's chat page points at his own live endpoint. UI slices complete, including `/register`. |
| **4** | Thu Jul 30 | Morning: tests, the two-course isolation proof, cross-review sign-offs (CF-TASK-083/084). Afternoon: reset seed and rehearse the demo twice. **No new feature merges after 13:00.** |

Standup, every morning, 15 minutes, three questions only: *Is any port still faked? Is anything blocking you? Does anyone need to touch a file they don't own?*

---

## 12. Definition of Done — Sprint 2

A slice is done when **all** of these are true. Backend-only or frontend-only is not done.

- [ ] Migration runs on an empty database, and `npm run seed` twice in a row produces the same state.
- [ ] Every endpoint enforces `AuthGuard` and the correct role guard, and returns `403` — not `404`, not an empty list — for the wrong owner.
- [ ] Unit tests cover the happy path plus at least the negative cases named in your section.
- [ ] The UI slice has loading, empty, error, and forbidden states, and works at 390px in RTL.
- [ ] No secret, key, or real credential is in any committed file.
- [ ] Your section of `docs/api/sprint2-<feature>.md` exists and matches the shipped behavior — including any deviation from `schemaV2.sql`, with the reason.
- [ ] PR is reviewed by someone else; migrations and authorization changes need **two** approvals per `CONTRIBUTING.md`.

**Sprint-level:**

- [ ] A logged-out visitor registers from `/register`, is signed in automatically, and lands on the student dashboard — and **no request body can create a teacher account.**
- [ ] Student watches a lesson, reloads, and resumes at the saved position; attendance is awarded exactly once at 70%.
- [ ] Student submits the seeded quiz and sees a server-computed score that survives a reload.
- [ ] Teacher uploads a PDF and watches it reach `completed`, then receives a notification.
- [ ] **The two-course isolation test is green.** No chunk from course B is ever returned for course A.
- [ ] A supported Arabic question returns an answer with a citation whose page maps to a real stored chunk.
- [ ] An unsupported question returns the no-answer state with **zero** citations.
- [ ] Analytics/GTM/dataLayer is explicitly deferred to the last sprint; no Sprint 2 slice depends on those hooks.
- [ ] The smoke test runs from a reset seed to assertion (Sprint 1 carry-over closed).
- [ ] `apps/web` has a test command that runs and passes (Sprint 1 carry-over closed).

---

## 13. Explicitly out of scope for Sprint 2

Do not build these, even if the prototype shows them: **password recovery, email verification, and teacher/admin account creation** (registration ships for students only — §6 N-4), checkout, orders, sales metrics, the Analytics Agent, the Proactive Proctor and struggle intervention, mini-quiz generation, progress reports, homework, live streaming, PPTX or OCR ingestion, course creation, public catalog and enrollment, email delivery, automatic suspension, short-answer AI grading, admin console, and the knowledge graph.

If a prototype screen shows one of these, render it **visibly disabled and clearly labeled unavailable**. Do not fake it — a fake button in a demo is worse than a missing one.

---

## 14. Risks and the honest mitigation

| Risk | Mitigation |
|---|---|
| The day-1 lost to a late plan compresses everything | Scope was cut to 102h against 120h capacity (§1), not padded. Four items are named as deferred, not quietly dropped, and the 6h registration add-on was paid for out of buffer in the open. |
| AI/embedding credentials never arrive (external input, was due Jul 23) | **Every test runs on `MockEmbeddingProvider` and `MockLlmProvider`.** The pipeline, isolation proof, and no-answer policy are all demonstrable with zero credentials. Only the final answer prose needs a real key. Escalate on day 1 if it is still missing. |
| Chroma or Redis eats a whole day of setup | E-1 is the first thing merged, by one person, and blocks only Elgendy's own later tasks. Everyone else works behind ports. |
| Arabic PDF text extraction is poor quality | Habsa's fixture PDF is chosen and tested on day 2, not day 4. If extraction fails, we learn while there is still time. |
| Migration conflicts across five people | Assigned timestamp blocks (§2.5), and the two blocking FKs designed out. |
| Merge conflicts on shared React files | All of them edited exactly once in the day-1 contract PR (§10). |
| The Tutor hallucinates a citation in the demo | Server-side citation validation is a hard requirement (S-3, rule 2), with a test. Below threshold, no model call at all. |
| e2e still cannot run because Docker/Postgres is broken locally | Raised at Monday standup as a whole-team item. `docker ps` currently fails with a permission error, and there is no `.env` — fix both before writing code. |
