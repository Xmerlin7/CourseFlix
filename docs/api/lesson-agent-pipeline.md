# Lesson Agent Pipeline — خط الوكلاء

A teacher adding a lesson picks how it gets processed: the plain upload, or a
crew of agents that transcribes the video, gates it, indexes it, writes a
handout, and sets a quiz — narrating each handoff while the teacher watches, and
handing every draft back for approval before anything reaches a student.

Follows `docs/api-conventions.md`: `api/v1` prefix per controller, no response
envelope, session cookie auth.

## The crew

| key | name | mandatory | what it does |
| --- | --- | --- | --- |
| `transcript` | المُفرِّغ | ✅ | Fetches captions (Bunny/YouTube) or transcribes with Whisper; owns the `video_transcripts` row and its version |
| `reviewer` | المُراجِع | ✅ | Safety + on-topic check via `VIDEO_MODERATION_PROVIDER`; a rejection stops the run |
| `indexer` | المُفهرِس | ✅ | Chunks, embeds, upserts to Chroma, writes `video_chunks` — this is what makes the lesson askable |
| `handout` | كاتب الشرح | ⬜ | LLM writes a study handout → Arabic PDF named after the lesson → `documents` + `document_chunks` |
| `quizmaster` | واضع الأسئلة | ⬜ | LLM sets a quiz from the transcript → `pending_review` quiz draft |

The first three have no off switch anywhere in the product. Turning them off
would leave a lesson the student assistant cannot answer questions about, which
is the one guarantee the pipeline always keeps — so `teacher_agent_settings` has
no column for them and `LessonAgentsService.toRunConfig` always includes them,
whatever a per-run override says.

## Why the plain ingestion is suppressed

Creating a lesson with a video normally fires `VideoIngestionService.enqueueForVideo`.
`CreateLessonDto.useAgents` suppresses exactly that one call
(`CoursesService.syncLessonVideo`'s `deferIngestionToAgents`), because the
pipeline transcribes and indexes the same video itself — two jobs writing chunks
for one transcript would race over which version ends up active.

Starting the run is a **separate call**. `CoursesService` never reaches into
`LessonAgentsService`; the web does `POST lessons` then `POST agent-runs`, so a
failure to start the crew still leaves the lesson saved.

## Draft visibility

An unapproved artifact must not reach a student through *any* path, so each has
its own gate:

- **Quiz** — written `status: 'pending_review'`, the same gate manually
  requested AI exams already pass through.
- **Handout** — `documents.is_agent_draft` (new column, defaults `false`, so
  every pre-existing and ordinary upload is unaffected) hides it from
  `listStudentDocuments` and `getFileForStudentDownload`. Its
  `document_chunks.is_active` is written `false`, and `RetrievalService` drops
  any Chroma hit whose Postgres chunk isn't active — so the tutor can't cite it
  either.

The vectors *are* written to Chroma at generation time. Approval is therefore a
single Postgres flag flip, not a re-embed.

## Schema

Migration `1786613700000-CreateLessonAgentPipeline`, five tables:

- `teacher_agent_settings` — per-teacher, keyed by teacher (no surrogate id). A
  teacher who never opened the form has **no row**; the defaults live in
  `LessonAgentsService.DEFAULT_SETTINGS` so they can change without a backfill.
- `lesson_agent_runs` — one per execution. `config` is a frozen snapshot of the
  settings at submit time, so editing settings later can't rewrite what a
  finished run says it did.
- `lesson_agent_steps` — one row per agent per run, `UNIQUE (run_id, agent_key)`.
  `status` (machine) and `review_status` (teacher) move independently.
- `lesson_agent_events` — append-only narration; `type` is plain TEXT because the
  vocabulary grows with every new thing an agent learns to say.
- `lesson_agent_step_feedback` — teacher notes driving one step's re-run.

## Endpoints

All under `AuthGuard` + `TeacherOrAssistantRoleGuard`, scoped via `scopeTeacherId`.

| method | path | notes |
| --- | --- | --- |
| `GET` | `/teacher/agents` | Static roster (names, roles, icons) so the web doesn't keep a copy that drifts |
| `GET` | `/teacher/agent-settings` | Materialises defaults when no row exists |
| `PATCH` | `/teacher/agent-settings` | Merge-on-write — a one-field PATCH can't blank the other eleven |
| `POST` | `/teacher/lessons/:lessonId/agent-runs` | `400` with no video, `409` if a run is already in flight |
| `GET` | `/teacher/courses/:courseId/agent-runs` | Newest first |
| `GET` | `/teacher/agent-runs/:runId` | Run + steps + events + feedback + `canPublish` |
| `POST` | `/teacher/agent-runs/:runId/steps/:stepId/approve` | |
| `POST` | `/teacher/agent-runs/:runId/steps/:stepId/reject` | Discards the artifact immediately |
| `POST` | `/teacher/agent-runs/:runId/steps/:stepId/feedback` | Re-queues **only that agent** |
| `POST` | `/teacher/agent-runs/:runId/publish` | `409` while any agent still awaits a verdict |

Every review action returns the full refreshed run, so the panel updates from the
response instead of waiting out a poll.

## Run lifecycle

```
queued ─► running ─► pending_review ─► completed   (teacher publishes)
                └──► completed                     (no reviewable agent produced anything)
                └──► failed                        (a mandatory agent failed)
```

The worker never sets `completed` when there is something to publish — that
transition is the teacher's, and it's the moment drafts become visible.

## Failure policy

Two policies on purpose, in `LessonAgentsProcessor`:

- **Mandatory agent fails** → the run stops. Everything downstream reads what it
  didn't produce.
- **Optional agent fails** → the failure is recorded on its own step and the run
  carries on, so a handout the model fumbled never costs the teacher the quiz.

`AgentFailure` carries a message already written in Arabic for the teacher and is
surfaced verbatim; anything else is wrapped as `حصلت مشكلة تقنية: …`.

## Single-step re-runs

`enqueueLessonAgents(runId, onlyAgentKey)` skips straight to one agent. Since the
transcriber didn't run, `LessonAgentsProcessor.rehydrateTranscript` rebuilds the
transcript from the chunks the indexer already stored — de-overlapping them with
`DEFAULT_VIDEO_CHUNK_WORDS`/`_OVERLAP` imported from the chunker, so a change to
the windowing is followed rather than silently producing a stuttering transcript.

## Frontend

- `TeacherContentManager` — a `manual`/`agents` switch on the add-lesson form,
  plus each lesson's live run state inline.
- `AgentRunPanel` — crew strip (every agent, including sit-outs, with the live
  baton arrow), the event feed, per-agent review cards, and publish.
  Polls at 2.5s while working. Holds **no** client state the teacher can lose:
  closing the page and returning re-renders exactly where the crew got to.
- `AgentSettingsForm` — settings tab "وكلاء الدروس", teacher-only.

## Providers

`HANDOUT_LLM_PROVIDER` follows the existing mock/OpenAI pattern — without a real
`OPENAI_API_KEY` (or under `NODE_ENV=test`) `MockHandoutLlmProvider` produces
exactly the requested section count, so the whole pipeline runs end to end
offline. `pdf/` is vendored from `apps/api/src/database/seeds/pdf/` (Arabic
shaping + Noto Naskh); the two copies differ only in PDF metadata.

## Known gaps

- No live Postgres/Redis integration test in this environment — coverage is
  `lesson-agents.service.spec.ts` (16), `lesson-agents.processor.spec.ts` (10)
  and `AgentRunPanel.spec.tsx` (7), all with mocked adapters.
- The moderation prompt in `video-moderation-llm.adapter.ts` is still worded
  physics-specific (pre-existing); the reviewer agent inherits that wording.
- Unlike the plain path, the reviewer moderates **every** source, not just
  YouTube — a teacher asking for an agent review is asking for exactly that.
