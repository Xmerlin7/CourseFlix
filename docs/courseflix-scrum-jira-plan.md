# CourseFlix Scrum and Jira Delivery Plan

Plan date: Thursday, July 16, 2026  
Delivery window: Sunday, July 19 through Thursday, August 6, 2026  
Team: Elgendy, Albraa, Nabile, Habsa, Seif  
Status: Planning baseline updated with confirmed React/NestJS stack and authorized UI gap filling

## 1. Executive Summary

This plan converts the available CourseFlix concept, PostgreSQL schema, GTM guide, architecture plan, and the complete `ui5/` static prototype into a three-sprint MVP backlog. The committed outcome is one coherent demonstration: a teacher signs in and manages a seeded course, uploads a PDF, the system indexes it, a student signs in, watches a lesson, asks a grounded question with a citation, triggers a limited struggle intervention, completes a test checkout, and the teacher reviews sales metrics, a limited analytics answer, and traceable agent activity.

The repository contains planning assets, a detailed PostgreSQL schema, and a static RTL Arabic UI prototype, but no implemented application, live API, authentication service, AI pipeline, test suite, deployment configuration, payment integration, or analytics container. The agreed implementation stack is React + TypeScript for the web client and NestJS + TypeScript for the API/worker, with PostgreSQL as transactional storage. Every assignment remains **Provisional** because no Git ownership evidence exists, and estimates include greenfield scaffolding and integration.

The three sprints have 450 gross team hours. This plan commits 348 task hours and preserves 102 hours (22.7%) for Scrum events, additional integration, defects, and uncertainty. GTM/GA4 is a 16-hour additional technical workstream owned exclusively by Seif and staged 4h/4h/8h across Sprints 1/2/3. Six explicit cross-team review tasks are also included. No sprint exceeds 80% utilization. Full homework workflows, production payments, open-ended analytics, advanced autonomous agents, live streaming, broad document support, and automatic suspension are outside the committed MVP.


### Confirmed decisions and remaining external inputs

| Decision/input | Status | Owner/source | Working choice or deadline |
|---|---|---|---|
| Frontend and API stack | **Confirmed** | Team agreement | React + TypeScript + Vite; NestJS + TypeScript |
| Transactional database and ORM | **Confirmed planning choice** | Existing schema + gap-fill authority | PostgreSQL + TypeORM migrations |
| Worker/vector infrastructure | **Confirmed planning choice** | Architecture plan | Redis/BullMQ + ChromaDB |
| Missing UI screens/states | **Authorized** | User direction | Team fills gaps using existing `ui5/` patterns |
| Authentication/session approach | **Confirmed planning choice** | NestJS baseline | Argon2id passwords, opaque PostgreSQL session, HTTP-only same-site cookie, Nest throttling |
| Attendance threshold | **MVP choice** | Existing `ui5/` behavior | 70%, configuration-driven |
| Teacher manages seeded course versus create-course feature | **Scope choice** | Product/team | Manage seeded course in MVP; creation remains SHOULD |
| Video storage/hosting approach | **MVP choice** | Technical team | Seeded browser-playable URL behind storage/media config |
| AI and embedding providers/models | **External input** | Technical team | Provider adapter; credentials/models supplied by July 23 |
| Chroma hosting and persistence | **MVP choice** | Technical team | Local container with persistent demo volume |
| Test-payment adapter | **MVP choice** | Scope baseline | Internal deterministic adapter; gateway remains POST-MVP |
| Currency and timezone | **MVP choice** | Scope baseline | EGP and Africa/Cairo |
| GTM container and GA4 property access | **External access** | Product/team | Supply by July 27; local preview/test listener is fallback |
| Analytics Agent role/range | **MVP choice** | Safety baseline | Teacher-owned courses only; maximum 366 days |

## 2. MVP Scope

### MUST — Committed MVP

- Real login/session handling for seeded student and teacher accounts, role guards, logout, and unauthorized handling.
- Shared responsive Arabic RTL shell, routes, design tokens, reusable states, and role-correct navigation based on `ui5/`.
- Student dashboard, enrolled course list, course detail, and access to one seeded course.
- Teacher dashboard and management of one seeded course and its lesson/document data.
- Video lesson playback using a demo media source, durable progress heartbeat, completion, and attendance calculation.
- Basic published quiz retrieval, MCQ/true-false submission, deterministic grading, and result persistence.
- PDF validation/upload, asynchronous extraction/chunking/embedding, ChromaDB course isolation, processing status, retry, and failure state.
- AI Tutor chat grounded only in active course documents, source citation, explicit no-answer response, trace/cost logging, and prompt-injection checks.
- Event-based struggle rule, weak-concept flag, small generated/fixture-backed quiz, progress report, teacher notification, and agent log.
- Test checkout, backend order/payment records, idempotent purchase completion, and purchase confirmation.
- Structured MVP `dataLayer` events for the demo funnel and backend reconciliation of purchase value.
- Teacher sales totals and best-selling course query from orders.
- Limited Analytics & Store Agent with allowlisted intents and controlled query functions.
- Notifications needed by ingestion/proctor flow, agent/activity logs, health/error visibility, E2E tests, seed reset, and demo documentation.

## 3. Non-Final and Post-MVP Scope

### SHOULD — Implement if core work is stable

- Student-facing notification preferences and profile editing.
- Manual teacher quiz authoring beyond the seeded/basic flow.
- Posts/announcements and basic homework upload without AI grading.
- Public catalog and explicit enrollment for free/test courses.
- Live GTM/GA4 container publication after credentials are supplied.
- Course creation form if core work is stable; its design may be filled from existing `ui5/` patterns.
- PPTX ingestion after the PDF evaluation suite is stable.

### COULD — Stretch

- Revenue comparison with previous period and high-view/low-conversion query.
- Quiz-generation review/edit screen.
- Course reviews and certificate issuance from existing schema entities.
- Email delivery in addition to in-app notifications.

### NOT FINAL — Requires review

- Automatic homework grading and teacher approval workflow shown in the prototype.
- Automatic suspension for low homework marks; no automatic suspension is permitted in the MVP.
- Attendance threshold and anti-fraud policy.
- Live streaming schedule and attendance behavior.
- Knowledge graph entities and content-scout behavior.
- Parent/guardian outreach and emails.

### POST-MVP

- Production payment gateway, refunds, taxes, invoices, discounts, and multi-currency settlement.
- Open-ended natural-language SQL, unrestricted agent database access, and advanced predictive analytics.
- Continuous autonomous student monitoring, complex multi-agent orchestration, and automatic disciplinary actions.
- Native live-streaming infrastructure and device-level attendance controls.
- OCR for scanned PDFs and support for Word, PowerPoint, audio, and arbitrary video ingestion.
- Full short-answer AI grading and full homework lifecycle.
- Advanced knowledge graph and semantic concept graph.
- Registration, password recovery, verification, admin console, multi-teacher tenancy, and granular support roles.
- Production-scale security hardening, compliance program, disaster recovery, and load/performance certification.

## 4. Architecture and Workstream Map

```text
ui5 visual source
       |
       v
React/Vite RTL web client ---- structured dataLayer ---- GTM / GA4
       |                                  |
       v                                  v
NestJS REST API ------------------ backend order reconciliation
       |
       +--> TypeORM/PostgreSQL: users, sessions, courses, lessons, progress,
       |                quizzes, chat metadata, reports, orders, logs
       |
       +--> Object/file storage: PDFs and demo video reference
       |
       +--> BullMQ/Redis -> NestJS worker: extract -> chunk -> embed -> index
       |                                      |
       |                                      v
       |                                  ChromaDB
       |
       +--> AI services: retrieval -> guarded prompt -> answer/citations
       |                                  |
       +--> Rule evaluator -> mini quiz/report/notification/agent log
       |
       +--> Controlled sales query service -> metrics + allowlisted agent
```

Confirmed implementation baseline:

| Layer | Choice | Planning convention |
|---|---|---|
| Web | React + TypeScript + Vite | React Router, TanStack Query, UI components/tokens ported from `ui5/` |
| API | NestJS + TypeScript REST | Feature modules, DTO validation, guards, OpenAPI contract |
| Data | PostgreSQL + TypeORM | Versioned migrations adapted from `schema.sql`; repositories remain API-owned |
| Jobs | Redis + BullMQ + NestJS worker | Retryable, idempotent ingestion jobs with persisted status |
| Vectors | ChromaDB | Mandatory course/document/version metadata filters |
| Testing | Vitest/React Testing Library/Playwright; Jest/Supertest | Frontend unit/component/E2E and Nest unit/API integration coverage |
| Workspace | npm workspaces | `apps/web`, `apps/api`, `apps/worker`, and shared generated API types/config |

Workstreams and boundaries:

| Workstream | Owns | Does not own |
|---|---|---|
| Experience | Routes, components, RTL/responsive behavior, loading/empty/error/unauthorized states | Business truth or direct database access |
| Core API | Sessions, RBAC, course/lesson/quiz/progress contracts, validation | Vector similarity or unrestricted analytics generation |
| Data | Migrations, indexes, seeds, order truth, transaction/idempotency rules | GA4 revenue as a source of truth |
| AI/RAG | Ingestion, embeddings, retrieval, grounding, citations, evaluation | Answers unsupported by active course sources |
| Agent | Explicit events, rules, reports, mini quiz, notifications, audit logs | Continuous surveillance or automatic suspension |
| Commerce/analytics | Test checkout, orders, metrics, allowlisted intents, `dataLayer` | Production gateway settlement or arbitrary SQL |
| Quality/operations | Test harness, fixtures, health checks, structured logs, release and demo | Feature expansion after code freeze |

## 5. Team Allocation Strategy

All assignments are **Provisional** because no Git history provides skill/ownership evidence. The React/NestJS stack is confirmed, but no member-specific specialization is assumed. Primary owners coordinate completion and integration; they are not expected to perform every subtask. Reviewers must be different from the primary owner.

| Team member | Sprint 1 emphasis | Sprint 2 emphasis | Sprint 3 emphasis | Planned total |
|---|---|---|---|---:|
| Elgendy | UI shell, login integration, visual structure | Tutor API/chat and ingestion-worker integration | Checkout UI, service health, and visual QA/release review | 68h |
| Albraa | Auth/data/API contracts and UI integration review | Progress, Chroma, and security review | Orders, sales queries, controlled analytics | 68h |
| Nabile | Responsive components, seed/course management | Quiz, upload/security, prompt safety | Mini quiz, sales/agent UI, bug fixing | 73h |
| Habsa | Student flow and API tests | Ingestion and RAG fixtures | Proctor and agent-log API, commerce/agent review | 65h |
| Seif | Quality foundation, course API, GTM contract | RAG traceability/evaluation, integrated QA, learning GTM | Canonical E2E, GTM, failure analysis, release | 74h |

### Cross-functional role charter

Seif serves as **Quality & Integration Lead** while retaining substantial implementation ownership. Testing is additive to, not a replacement for, backend, AI, analytics, and operational work.

| Role | Responsibilities | Jira evidence | Development value |
|---|---|---|---|
| Quality & Integration Lead | Test strategy, quality commands, auth/integration suites, RAG evaluation, canonical E2E, release gates | T008, T022, T024, T028, T050, T052, T060, T072, T076, T077, T080 | Learns risk-based testing across frontend, API, AI, commerce, and release |
| GTM/GA4 Owner | Event schema, learning/AI/commerce instrumentation, privacy, Preview, order reconciliation | T061-T064 | Owns a complete product-analytics lifecycle |
| Backend/API Contributor | Course API contracts and Tutor citation/trace persistence | T010, T044 | Builds NestJS contracts, persistence, and traceability behavior |
| RAG Traceability Contributor | Source citations, token/cost traces, and evaluation support | T044, T050 | Learns grounded AI architecture and failure analysis |
| Observability & Release Contributor | Safe failure demo, canonical E2E, reset, and release runbook | T076, T077, T080 | Learns operational readiness and end-to-end delivery |

Feature owners remain responsible for unit/component tests local to their work. Seif owns cross-feature integration strategy and release evidence, preventing quality from becoming a late Sprint 3 phase.

Review rotation:

- Elgendy reviews backend/data stories where UI contracts are affected.
- Albraa reviews AI/data integrity and checkout stories not owned by Albraa.
- Nabile reviews frontend interaction and agent UX stories.
- Habsa reviews learning behavior, acceptance tests, and feature-data privacy; GTM/GA4 work is excluded from this review assignment.
- Seif owns GTM/GA4 end to end and reviews testability, observability, release, and cross-cutting security.

## 6. Timeline and Working Calendar

| Period | Dates | Working days | Goal |
|---|---|---:|---|
| Planning/backlog preparation | Thu Jul 16 | 1 planning day, outside sprint delivery capacity | Record React/NestJS architecture, import Jira work, scaffold decisions, and confirm Sprint 1 readiness |
| Weekend | Fri Jul 17-Sat Jul 18 | 0 | Holiday/off |
| Sprint 1 | Sun Jul 19-Thu Jul 23 | 5 | Foundation, authentication, UI shell, core course paths, data/API/test baseline |
| Weekend | Fri Jul 24-Sat Jul 25 | 0 | Holiday/off |
| Sprint 2 | Sun Jul 26-Thu Jul 30 | 5 | Lesson progress, quiz, PDF ingestion, grounded AI Tutor, notifications |
| Weekend | Fri Jul 31-Sat Aug 1 | 0 | Holiday/off |
| Sprint 3 | Sun Aug 2-Thu Aug 6 | 5 | Proctor, test commerce, product analytics, sales agent, logs, E2E release |

Recommended ceremony budget per person per sprint: planning 1.5h, daily Scrums 1.25h total, review 1h, retrospective 0.75h, and refinement/integration coordination 2.5h. These activities consume part of the buffer, not ticket estimates.

## 7. Sprint Capacity Summary

Gross capacity is 5 people x 5 days x 6 productive hours = 150 hours per sprint. GTM is an additional Seif-owned technical workstream spread across the same delivery cycle; planned work remains at or below 80% of team capacity.

| Sprint | Gross | Planned tasks | Buffer | Utilization | Status |
|---|---:|---:|---:|---:|---|
| Sprint 1 | 150h | 118h | 32h | 78.7% | Feasible; GTM contract starts after shell/API conventions |
| Sprint 2 | 150h | 120h | 30h | 80.0% | Feasible; learning/Tutor GTM follows integrated events |
| Sprint 3 | 150h | 110h | 40h | 73.3% | Feasible; commerce/proctor GTM and final validation finish |
| Total | 450h | 348h | 102h | 77.3% | MVP feasible with stated assumptions |

### Per-sprint workload

| Person | Sprint 1 | Sprint 2 | Sprint 3 | Total |
|---|---:|---:|---:|---:|
| Elgendy | 22h | 29h | 17h | 68h |
| Albraa | 25h | 21h | 22h | 68h |
| Nabile | 23h | 28h | 22h | 73h |
| Habsa | 21h | 21h | 23h | 65h |
| Seif | 27h | 21h | 26h | 74h |
| Team | 118h | 120h | 110h | 348h |

Carry-over policy:

1. A MUST story may carry only after its owner identifies remaining acceptance criteria, re-estimates the residue, and Product confirms the next sprint tradeoff.
2. Unstarted SHOULD/COULD work is removed before a committed story is carried.
3. Sprint 3 accepts no new feature after Tuesday, August 4; Wednesday and Thursday prioritize defects, demo reset, and rehearsal.
4. A story is not counted complete when only frontend mocks or only backend endpoints exist.

## 8. Initiative and Epic List

### CF-INIT-01 — Deliver the CourseFlix Demonstrable Learning and Commerce MVP

Deliver a coherent, safe, traceable teacher-to-student course experience in three sprints, using `ui5/` as the visual source of truth and limiting AI and commerce behavior to deterministic, reviewable MVP boundaries.

| Epic | Name | Scope disposition | Primary demo outcome |
|---|---|---|---|
| CF-EPIC-01 | Foundation and UI Design System | MUST | Real responsive app matches the prototype structure |
| CF-EPIC-02 | Authentication and Access Control | MUST | Teacher/student sign in and see correct routes |
| CF-EPIC-03 | Student Course Discovery | MUST for pre-enrolled flow; public enrollment SHOULD | Student opens seeded course |
| CF-EPIC-04 | Teacher Dashboard and Course Management | MUST | Teacher manages seeded course and document |
| CF-EPIC-05 | Lessons, Progress, and Attendance | MUST | Watch progress persists and attendance is derived |
| CF-EPIC-06 | Quizzes and Learning Assessment | MUST basic quiz; homework POST-MVP | Student submits and receives objective result |
| CF-EPIC-07 | Document Upload and Ingestion | MUST PDF | Teacher sees processed/failed status |
| CF-EPIC-08 | Grounded AI Tutor and RAG Safety | MUST | Answer cites course source or declines |
| CF-EPIC-09 | Proactive Proctor and Progress Reports | MUST limited event rules | Struggle signal creates reviewable intervention |
| CF-EPIC-10 | Checkout, Orders, and Payment Abstraction | MUST test flow | Test purchase creates authoritative order |
| CF-EPIC-11 | GTM and GA4 Product Analytics | MUST event contract | Core funnel emits validated events |
| CF-EPIC-12 | Teacher Sales and Analytics Agent | MUST limited intents | Teacher sees revenue and asks supported question |
| CF-EPIC-13 | Notifications and Agent Activity | MUST minimal | Intervention/status notification and trace exist |
| CF-EPIC-14 | Security and Observability | MUST baseline | Validation, logs, health, and safe failures are visible |
| CF-EPIC-15 | Testing, Deployment, and Demo Readiness | MUST | Seeded E2E demo is repeatable |

Evaluation of requested epic candidates: student/teacher navigation is consolidated into CF-EPIC-01/03/04; quiz and homework share CF-EPIC-06 but homework is deferred; RAG retrieval/citations/safety share CF-EPIC-08; mini quiz/progress report share CF-EPIC-09; sales dashboard and Analytics Agent share CF-EPIC-12; security and agent logs remain cross-cutting CF-EPIC-13/14.

## 9. Full Product Backlog

### Committed stories

| Story | Epic | Sprint | Scope | Priority | Owner | Reviewer | Points | Hours | Demo outcome |
|---|---|---|---|---|---|---|---:|---:|---|
| CF-US-001 Build the responsive CourseFlix application shell | CF-EPIC-01 | S1 | MUST | Highest | Elgendy | Nabile | 5 | 18 | Both roles navigate a real responsive app |
| CF-US-002 Authenticate users and enforce role access | CF-EPIC-02 | S1 | MUST | Highest | Albraa | Seif | 8 | 24 | Seeded teacher/student sign in securely |
| CF-US-003 Establish the transactional data and course API baseline | CF-EPIC-01 | S1 | MUST | Highest | Albraa | Habsa | 5 | 20 | Real seeded course data loads from API |
| CF-US-004 Let a student browse and open enrolled courses | CF-EPIC-03 | S1 | MUST | High | Habsa | Elgendy | 5 | 18 | Student dashboard-to-course flow works |
| CF-US-005 Let a teacher manage a seeded course | CF-EPIC-04 | S1 | MUST | High | Nabile | Albraa | 5 | 20 | Teacher dashboard and course page use real data |
| CF-US-006 Establish development, test, and API contract baselines | CF-EPIC-15 | S1 | MUST | High | Seif | Habsa | 3 | 10 | Team can run and test the baseline consistently |
| CF-US-007 Track lesson watch progress and attendance | CF-EPIC-05 | S2 | MUST | Highest | Elgendy | Albraa | 5 | 18 | Student watches; progress persists; attendance updates |
| CF-US-008 Submit and grade a basic quiz | CF-EPIC-06 | S2 | MUST | High | Nabile | Habsa | 5 | 14 | Objective quiz result is persisted |
| CF-US-009 Upload a PDF and show processing status | CF-EPIC-07 | S2 | MUST | Highest | Nabile | Seif | 5 | 14 | Teacher uploads and sees lifecycle states |
| CF-US-010 Process and index course PDF content | CF-EPIC-07 | S2 | MUST | Highest | Habsa | Albraa | 8 | 20 | PDF text becomes course-filtered vectors |
| CF-US-011 Ask the grounded AI Tutor with citations | CF-EPIC-08 | S2 | MUST | Highest | Seif | Nabile | 8 | 24 | Student gets cited answer or explicit no-answer |
| CF-US-012 Receive and manage essential in-app notifications | CF-EPIC-13 | S2 | MUST | Medium | Albraa | Elgendy | 3 | 8 | Processing/intervention status reaches the right user |
| CF-US-013 Validate RAG grounding, security, and the integrated learning flow | CF-EPIC-14 | S2 | MUST | Highest | Habsa | Seif | 5 | 14 | Evaluation proves course isolation and no-answer behavior |
| CF-US-014 Trigger a limited struggle intervention | CF-EPIC-09 | S3 | MUST | Highest | Habsa | Albraa | 8 | 20 | Signal creates mini quiz/report/notification/log |
| CF-US-015 Complete a test checkout and authoritative order | CF-EPIC-10 | S3 | MUST | Highest | Albraa | Seif | 5 | 18 | Test purchase is idempotent and persisted |
| CF-US-016 View teacher sales metrics from backend orders | CF-EPIC-12 | S3 | MUST | High | Nabile | Albraa | 5 | 14 | Revenue/orders/best seller appear with empty states |
| CF-US-017 Ask a limited Analytics & Store Agent question | CF-EPIC-12 | S3 | MUST | High | Nabile | Seif | 5 | 16 | Allowlisted question returns traceable aggregate answer |
| CF-US-018 Inspect agent actions, errors, and service health | CF-EPIC-13 | S3 | MUST | High | Seif | Habsa | 3 | 10 | Demo exposes traceable success/failure records |
| CF-US-019 Release and rehearse the end-to-end MVP | CF-EPIC-15 | S3 | MUST | Highest | Seif | Elgendy | 8 | 20 | Repeatable seeded demo passes E2E and visual checks |

### Committed technical and cross-team review tasks

| Task | Sprint | Owner | Hours | Dependencies | Review outcome |
|---|---|---|---:|---|---|
| CF-TASK-061 | S1 | Seif | 4 | CF-US-001, CF-US-003 | Versioned `dataLayer` contract, helper, and denylist tests |
| CF-TASK-062 | S2 | Seif | 4 | T061, CF-US-007/008/011 | Course, lesson, quiz, and Tutor events verified |
| CF-TASK-063 | S3 | Seif | 4 | T061, CF-US-014/015 | Proctor, checkout, and purchase events verified |
| CF-TASK-064 | S3 | Seif | 4 | T061-T063 | GTM/GA4 mapping, privacy, and order reconciliation report |
| CF-TASK-081 | S1 | Seif | 2 | CF-US-002/003 | Auth, migration, and API contract sign-off |
| CF-TASK-082 | S1 | Albraa | 2 | CF-US-001/004/005 | Student/teacher UI/API integration sign-off |
| CF-TASK-083 | S2 | Albraa | 2 | CF-US-009-013 | RAG isolation, citation, and prompt-safety sign-off |
| CF-TASK-084 | S2 | Nabile | 2 | CF-US-007/008/012 | Learning UI, event, and API integration sign-off |
| CF-TASK-085 | S3 | Habsa | 2 | CF-US-015-017 | Order, sales, and Analytics Agent authorization sign-off |
| CF-TASK-086 | S3 | Elgendy | 2 | CF-US-018/019 | Independent release-readiness sign-off |

`CF-TASK-001` through `CF-TASK-060` and `CF-TASK-065` through `CF-TASK-080` are Jira Subtasks under their corresponding stories. `CF-TASK-061` through `CF-TASK-064` are Seif-owned GTM Technical Tasks scheduled across the development cycle. `CF-TASK-081` through `CF-TASK-086` are cross-story review tasks. Bugs are created when discovered using `CF-BUG-###`, linked to affected work, and prioritized by the severity policy in section 20; they are not pre-created as fictional work.

### Deferred backlog

| ID | Issue type | Title | Epic | Scope | Estimate | Reason/dependency |
|---|---|---|---|---|---:|---|
| CF-SPIKE-001 | Spike | Validate course-creation fields and business workflow | CF-EPIC-04 | SHOULD | 4h | Gap-fill design is authorized; feature remains outside committed capacity |
| CF-US-020 | Story | Create and publish a new course | CF-EPIC-04 | SHOULD | 8 pts | Depends on CF-SPIKE-001 |
| CF-US-021 | Story | Browse a public catalog and enroll | CF-EPIC-03 | SHOULD | 8 pts | Enrollment/commerce UX missing |
| CF-US-022 | Story | Author and edit manual quizzes | CF-EPIC-06 | SHOULD | 8 pts | MVP uses seeded/basic quiz |
| CF-US-023 | Story | Submit and review homework | CF-EPIC-06 | SHOULD | 8 pts | Core demo does not require it |
| CF-SPIKE-002 | Spike | Evaluate PPTX extraction quality | CF-EPIC-07 | SHOULD | 6h | PDF-first constraint |
| CF-US-024 | Story | Generate a quiz for teacher review from a document | CF-EPIC-09 | COULD | 8 pts | Review/edit UX incomplete |
| CF-US-025 | Story | Configure email notification delivery | CF-EPIC-13 | COULD | 5 pts | Provider/consent decision missing |
| CF-US-026 | Story | Compare revenue with a previous period | CF-EPIC-12 | COULD | 3 pts | Add only after base metrics stabilize |
| CF-US-027 | Story | Identify high-view low-conversion courses | CF-EPIC-12 | COULD | 5 pts | Needs reliable view analytics |
| CF-SPIKE-003 | Spike | Select production payment gateway | CF-EPIC-10 | POST-MVP | 8h | Legal, credentials, fees, webhook design |
| CF-US-028 | Story | Grade short answers and homework with teacher approval | CF-EPIC-06 | NOT FINAL | 13 pts | Safety/evaluation and approval policy needed |
| CF-US-029 | Story | Automate enrollment suspension | CF-EPIC-09 | NOT FINAL | 8 pts | Explicitly excluded from MVP |
| CF-US-030 | Story | Ingest scanned PDF, PPTX, Word, and video | CF-EPIC-07 | POST-MVP | 21 pts | OCR/media pipeline expansion |
| CF-US-031 | Story | Support unrestricted natural-language analytics | CF-EPIC-12 | POST-MVP | 21 pts | Unsafe without semantic/query control layer |
| CF-US-032 | Story | Run continuous autonomous student monitoring | CF-EPIC-09 | POST-MVP | 21 pts | Privacy, cost, and behavior-model risk |
| CF-US-033 | Story | Operate native live streaming | CF-EPIC-05 | POST-MVP | 21 pts | Infrastructure beyond MVP |
| CF-US-034 | Story | Build an advanced knowledge graph | CF-EPIC-08 | POST-MVP | 21 pts | Not needed for grounded PDF Q&A |
| CF-US-035 | Story | Compare checkout starts with completed purchases | CF-EPIC-12 | COULD | 5 pts | Needs durable funnel events joined safely to order truth |
| CF-US-036 | Story | Report the most-interacted pages and CTAs | CF-EPIC-12 | POST-MVP | 8 pts | Needs GA4 export/report API, retention, consent, and controlled agent function |

## 10. Sprint 1 Backlog

**Sprint goal:** Replace the static-only prototype with a runnable, tested application baseline in which seeded teacher and student users authenticate, land in the correct `ui5/`-based shell, and retrieve real course data.

**Blocking dependencies:** local React/NestJS/PostgreSQL/Redis/Chroma environment agreement and seed credentials on July 16.  
**Critical path:** CF-US-006 -> CF-US-003 -> CF-US-002 -> CF-US-004/005.  
**Risks:** stack setup consumes feature time; schema requires adaptation; shared teacher pages use the wrong shell.  
**Planned/buffer:** 118h planned / 32h buffer, including 4h Seif-owned GTM foundation and 4h cross-team review.

### CF-US-001 — Build the responsive CourseFlix application shell

**Epic:** CF-EPIC-01 | **Sprint:** Sprint 1 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Elgendy (Provisional) | **Reviewer:** Nabile | **Story points:** 5 | **Estimated hours:** 18  
**Dependencies:** Confirmed React + TypeScript + Vite baseline  
**Blockers/decisions:** None; port shared CSS values into React design tokens/components while preserving `ui5/` behavior.

**User story**  
As a CourseFlix user, I want a responsive role-aware application shell matching the approved prototype, so that navigation remains familiar on desktop and mobile.

**Description:** Extract the reusable visual system and convert the 14 static references into route-ready shell/components. Preserve Arabic RTL, light/dark tokens, top bar, teacher/student navigation, and standard states without redesigning the product.

**Acceptance criteria**

1. Given a student or teacher session, when the application opens, then the correct role navigation, profile identity, top bar, and active route are displayed.
2. Given viewport widths of 1440, 1024, 768, and 390 pixels, when core shells render, then navigation and content do not overlap and remain usable in RTL.
3. Given light or dark theme selection, when the page reloads, then the selected theme persists and approved tokens are used.
4. Given loading, empty, error, and unauthorized content, when a page requests data, then a reusable accessible state is available without layout shift.

**Technical notes:** Use React Router and TanStack Query. Treat `build.py` as visual reference, not production architecture. Keep role and route configuration data-driven. Preserve focus-visible and reduced-motion behavior.  
**UI source:** `ui5/build.py`; every generated HTML shell; `ui5/README.md`.  
**API/data requirements:** `GET /me` contract placeholder; route metadata for student/teacher roles.  
**Analytics events:** `page_view` hook consumed by Seif-owned CF-TASK-061/062.  
**Test cases:** role nav snapshot, RTL keyboard navigation, mobile shell, theme persistence, unauthorized state.  
**Definition of Done:** reviewed; shell tests pass; four viewport checks pass; role mismatch fixed; loading/empty/error/unauthorized states documented.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-001 | Inventory routes, tokens, components, and states | Elgendy | 4h | None | Checked UI inventory and token map | Compare against all 14 screens |
| CF-TASK-002 | Implement role-aware shell and route configuration | Elgendy | 6h | T001, T021 | Student/teacher shells and route frame | Component and navigation tests |
| CF-TASK-003 | Implement responsive reusable UI primitives | Nabile | 4h | T001, T021 | Buttons, chips, tabs, lists, fields, dialogs, states | Storybook/harness or route fixture check |
| CF-TASK-004 | Add accessibility and responsive state checks | Habsa | 4h | T002-T003 | Automated checks and viewport evidence | Keyboard plus 390/768/1024/1440 checks |

### CF-US-002 — Authenticate users and enforce role access

**Epic:** CF-EPIC-02 | **Sprint:** Sprint 1 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Albraa (Provisional) | **Reviewer:** Seif | **Story points:** 8 | **Estimated hours:** 24  
**Dependencies:** CF-US-003 session/user migration baseline; CF-US-001 shell  
**Blockers/decisions:** None; use Argon2id, opaque PostgreSQL-backed sessions, HTTP-only same-site cookies, and NestJS throttling.

**User story**  
As a student or teacher, I want to sign in securely and access only routes allowed for my role, so that course and learner data are protected.

**Description:** Replace email-string prototype routing with server-validated credentials, secure password verification, revocable session, current-user endpoint, logout, and server/client route guards.

**Acceptance criteria**

1. Given valid seeded credentials, when the user signs in, then a secure session is created and the correct dashboard opens.
2. Given invalid credentials, when login is attempted, then a generic error appears and no session is created.
3. Given a student session, when a teacher route/API is requested, then the server returns 403 and the UI shows the shared unauthorized state.
4. Given an expired/revoked session, when a protected request occurs, then it returns 401 and the client returns to login without exposing protected data.
5. Given logout, when it completes, then the session is invalidated server-side and protected navigation no longer works.

**Technical notes:** Use HTTP-only, secure-in-production, same-site cookies or an equivalently reviewed mechanism. Hash passwords with an established library. Add rate limiting to login. Never log passwords/tokens.  
**UI source:** `ui5/index.html`, role shells in `ui5/build.py`, unauthorized shared state from CF-US-001.  
**API/data requirements:** `POST /auth/login`, `POST /auth/logout`, `GET /me`; `users`, `sessions`; login attempt rate limit.  
**Analytics events:** no PII-bearing login event in MVP; security failures remain server logs.  
**Test cases:** student success, teacher success, wrong password, missing fields, role bypass, expired session, logout, rate limit.  
**Definition of Done:** credentials are seeded outside source; auth tests pass; cookie policy documented; route and API guards reviewed; errors accessible and generic.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-005 | Implement password verification and session endpoints | Albraa | 6h | T009, T011 | Login/logout/current-user API | API integration tests |
| CF-TASK-006 | Connect the prototype login and session bootstrap UI | Elgendy | 5h | T005, CF-US-001 | Real login, errors, redirect, logout | Browser tests for both roles |
| CF-TASK-007 | Add server and client role authorization guards | Albraa | 6h | T005 | Route/API RBAC middleware | Direct forbidden-request tests |
| CF-TASK-008 | Add auth abuse, expiry, and regression tests | Seif | 7h | T005-T007 | Auth test suite and rate-limit fixture | Automated suite plus log inspection |

### CF-US-003 — Establish the transactional data and course API baseline

**Epic:** CF-EPIC-01 | **Sprint:** Sprint 1 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Albraa (Provisional) | **Reviewer:** Habsa | **Story points:** 5 | **Estimated hours:** 20  
**Dependencies:** Confirmed NestJS + PostgreSQL + TypeORM baseline  
**Blockers/decisions:** None; adapt and validate the existing SQL as TypeORM migrations.

**User story**  
As the delivery team, we want versioned transactional data and stable course APIs, so that parallel frontend, AI, learning, and commerce work shares one reliable contract.

**Description:** Convert only MVP-relevant portions of `schema.sql` into repeatable migrations, add required constraints, seed one teacher/student/course/lesson, and expose read/update course contracts. Defer unused tables rather than claiming they work.

**Acceptance criteria**

1. Given an empty development database, when migrations and seed run, then a consistent teacher, student, enrollment, course, section, lesson, video, and quiz fixture exists.
2. Given a signed-in enrolled student, when course APIs are requested, then only active enrolled course data is returned.
3. Given the owning teacher, when allowed course fields are updated, then validation and ownership checks are applied and changes persist.
4. Given a second reset, when migrations/seeds run again by the documented method, then the environment returns to the same demonstrable state.

**Technical notes:** Organize NestJS feature modules around auth, users, courses, learning, documents, AI, commerce, and analytics. Preserve UUIDs and soft-delete filters. Add commerce tables in Sprint 3 migrations. Do not implement the knowledge graph. Review enum migration flexibility.  
**UI source:** data shown in `dashboard.html`, `courses.html`, `course.html`, `teacher-dashboard.html`, `teacher-course.html`.  
**API/data requirements:** migrations for core user/session/course/section/lesson/enrollment/video/quiz entities; `GET /courses`, `GET /courses/:id`, `PATCH /teacher/courses/:id`.  
**Analytics events:** none directly; stable IDs feed later event contracts.  
**Test cases:** clean migration, seed reset, enrolled access, cross-course denial, teacher ownership, invalid update, soft-deleted exclusion.  
**Definition of Done:** migrations are repeatable; seed is documented; API contract checked in; no secrets in fixtures; authorization and validation tests pass.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-009 | Adapt core PostgreSQL schema into versioned migrations | Albraa | 6h | T021 and DB decision | Runnable MVP migrations | Apply on empty database and rollback/rebuild |
| CF-TASK-010 | Implement course read/update API contracts | Seif | 6h | T009 | Validated course endpoints | API tests and contract examples |
| CF-TASK-011 | Create deterministic teacher/student/course seed | Nabile | 4h | T009 | Resettable demo fixture | Run seed twice and compare IDs/data |
| CF-TASK-012 | Add ownership, enrollment, and soft-delete API tests | Habsa | 4h | T010-T011 | Data access regression suite | Automated positive/negative tests |

### CF-US-004 — Let a student browse and open enrolled courses

**Epic:** CF-EPIC-03 | **Sprint:** Sprint 1 | **Scope:** MUST — Committed MVP | **Priority:** High  
**Primary owner:** Habsa (Provisional) | **Reviewer:** Elgendy | **Story points:** 5 | **Estimated hours:** 18  
**Dependencies:** CF-US-001, CF-US-002, CF-US-003  
**Blockers/decisions:** Public catalog/enrollment is excluded; student is pre-enrolled.

**User story**  
As an enrolled student, I want to see my courses and open their content, so that I can continue learning from the correct lesson.

**Description:** Implement the student dashboard, enrolled-course list/filter, and course details from real APIs. Scope tabs to data required by the demo and render explicit placeholders for deferred homework/posts behavior.

**Acceptance criteria**

1. Given the seeded student, when the dashboard opens, then enrolled course summary and current progress load from the API.
2. Given the course list, when the grade filter changes, then matching enrolled courses are shown without losing accessibility.
3. Given an enrolled course, when its detail opens, then lessons, documents, and quizzes show their real status and stable links.
4. Given no courses, an API failure, loading, or a forbidden course, when the page renders, then the correct reusable state appears.

**Technical notes:** Keep URL IDs, not hard-coded filenames. Use server authorization even when links are hidden. Homework/posts may display a clearly labeled unavailable state.  
**UI source:** `ui5/dashboard.html`, `ui5/courses.html`, `ui5/course.html`.  
**API/data requirements:** `GET /student/dashboard`, `GET /courses`, `GET /courses/:id`; enrollment, course, lesson, document, quiz summaries.  
**Analytics events:** `view_item_list`, `select_item`, `view_item` hooks consumed by Seif-owned CF-TASK-062.  
**Test cases:** normal fixture, empty enrollment, filter, loading, API failure, deep link, unenrolled access, mobile.  
**Definition of Done:** real API data only; prototype layout preserved; all standard states tested; route guard and RTL/mobile checks pass.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-013 | Implement student dashboard with real summaries | Habsa | 5h | US001-US003 | `/student/dashboard` | Browser and API fixture test |
| CF-TASK-014 | Implement enrolled catalog and course-detail routes | Habsa | 6h | T013 | `/student/courses` and detail view | Route/component tests |
| CF-TASK-015 | Integrate filters, lesson/document/quiz summaries | Nabile | 4h | T014 | Data-bound tabs and filters | Fixture and interaction tests |
| CF-TASK-016 | Add empty/error/forbidden/mobile coverage | Elgendy | 3h | T013-T015 | State fixtures and visual evidence | Automated/browser viewport checks |

### CF-US-005 — Let a teacher manage a seeded course

**Epic:** CF-EPIC-04 | **Sprint:** Sprint 1 | **Scope:** MUST — Committed MVP | **Priority:** High  
**Primary owner:** Nabile (Provisional) | **Reviewer:** Albraa | **Story points:** 5 | **Estimated hours:** 20  
**Dependencies:** CF-US-001, CF-US-002, CF-US-003  
**Blockers/decisions:** None; gap-fill design is authorized, while the committed MVP intentionally manages one seeded course.

**User story**  
As a teacher, I want to view my dashboard and manage my seeded course, so that I can prepare the lesson and source document used in the demo.

**Description:** Connect teacher summary/course management screens to real course ownership and data. Allow safe edits to MVP course metadata and existing lesson metadata. File upload is implemented in CF-US-009.

**Acceptance criteria**

1. Given the seeded teacher, when the dashboard opens, then owned-course counts and quick actions use real data or clearly marked zero states.
2. Given the course management route, when it opens, then content, file-status placeholders, and student count are scoped to the teacher’s course.
3. Given valid metadata changes, when saved, then the API persists them and success feedback appears.
4. Given another teacher/course ID or invalid input, when update is attempted, then it is rejected and an accessible error is shown.

**Technical notes:** Do not implement native live streaming, AI homework grading, or automatic suspension. Keep those prototype actions disabled/labeled deferred if visible.  
**UI source:** `ui5/teacher-dashboard.html`, `ui5/teacher-course.html`.  
**API/data requirements:** `GET /teacher/dashboard`, `GET/PATCH /teacher/courses/:id`, lesson summaries, student count.  
**Analytics events:** `cta_click` hooks consumed by Seif-owned CF-TASK-062.  
**Test cases:** teacher ownership, summary empty state, valid edit, validation error, forbidden course, disabled deferred actions, mobile.  
**Definition of Done:** real owned data; no fake approval/suspension actions; role-correct shared shell; validations/tests/visual checks pass.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-017 | Connect teacher dashboard summaries and quick actions | Nabile | 5h | US001-US003 | Real `/teacher/dashboard` | Fixture and empty-state tests |
| CF-TASK-018 | Implement seeded course management UI | Nabile | 6h | T017 | Data-bound course tabs and edit controls | Browser interaction tests |
| CF-TASK-019 | Add teacher ownership/update API behavior | Albraa | 5h | US003 | Validated teacher course endpoints | API authorization tests |
| CF-TASK-020 | Integrate role shell and cross-review course flow | Elgendy | 4h | T017-T019 | Reviewed teacher flow | Mobile/RTL walkthrough and API smoke |

### CF-US-006 — Establish development, test, and API contract baselines

**Epic:** CF-EPIC-15 | **Sprint:** Sprint 1 | **Scope:** MUST — Committed MVP | **Priority:** High  
**Primary owner:** Seif (Provisional) | **Reviewer:** Habsa | **Story points:** 3 | **Estimated hours:** 10  
**Dependencies:** Confirmed React/NestJS/PostgreSQL/Redis/Chroma baseline  
**Blockers/decisions:** Deployment target may be unknown; local reproducibility is the minimum.

**User story**  
As a delivery team, we want one documented run/test workflow and stable API contracts, so that five people can integrate changes without environment drift.

**Description:** Establish environment templates, local service startup, formatting/lint/test commands, contract documentation, and an initial authenticated course smoke test. External credentials remain placeholders.

**Acceptance criteria**

1. Given a clean supported machine, when documented setup steps run, then the app, database, and tests start without committed secrets.
2. Given a contract change, when CI/local checks run, then incompatible examples or tests fail visibly.
3. Given the seeded environment, when the smoke test runs, then login and one course read complete successfully.

**Technical notes:** Use npm workspaces for `apps/web`, `apps/api`, and `apps/worker`; generate/share frontend API types from NestJS OpenAPI. Prefer a small repeatable service definition, separate optional AI/GTM variables, and keep production deployment open.  
**UI source:** all routes indirectly; no new design.  
**API/data requirements:** environment schema, health endpoint, contract examples, seed dependency.  
**Analytics events:** none.  
**Test cases:** missing required env, clean setup, health failure, seed smoke, format/lint/unit command.  
**Definition of Done:** setup tested by a second team member; no secret values committed; baseline checks documented and green.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-021 | Scaffold React/NestJS workspace and local services | Seif | 3h | None | npm workspace, environment template, PostgreSQL/Redis/Chroma services | Clean-environment startup |
| CF-TASK-022 | Configure lint, unit, integration, and browser test commands | Seif | 3h | T021 | Common quality commands | Intentionally fail/pass each check |
| CF-TASK-023 | Document API conventions and contract examples | Habsa | 2h | US003 draft | API conventions/reference | Peer review against endpoints |
| CF-TASK-024 | Add authenticated course baseline smoke test | Seif | 2h | US002-US003 | Repeatable smoke test | Run from reset seed to assertion |

### Sprint 1 GTM technical task

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-061 | Define the versioned `dataLayer` contract and helper | Seif | 4h | CF-US-001 route conventions; CF-US-003 ID contracts | Event dictionary, helper, ecommerce reset rule, PII denylist | Unit schema/denylist tests and local listener fixture |

### Sprint 1 cross-team review tasks

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-081 | Review authentication, migration, and API contracts | Seif | 2h | CF-US-002, CF-US-003 | Recorded security/data contract review | No unresolved Severity 1/2 finding; contract tests rerun |
| CF-TASK-082 | Review role UI and API integration end to end | Albraa | 2h | CF-US-001, CF-US-004, CF-US-005 | Student/teacher integration sign-off | Both roles walked through loading/error/forbidden/mobile states |

## 11. Sprint 2 Backlog

**Sprint goal:** Deliver the end-to-end learning and grounded knowledge flow: watch a lesson, persist progress, submit a basic quiz, upload/index a PDF, and receive a cited AI Tutor answer or a safe no-answer response.

**Blocking dependencies:** Sprint 1 auth/course baseline; AI/embedding credentials; PDF fixture; ChromaDB availability; attendance threshold.  
**Critical path:** CF-US-009 -> CF-US-010 -> CF-US-011 -> CF-US-013, in parallel with CF-US-007/008.  
**Risks:** extraction quality, provider latency/quota, vector isolation errors, and late integration between chat UI and retrieval.  
**Planned/buffer:** 120h planned / 30h buffer, including 4h Seif-owned learning/Tutor GTM and 4h cross-team review.

### CF-US-007 — Track lesson watch progress and attendance

**Epic:** CF-EPIC-05 | **Sprint:** Sprint 2 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Elgendy (Provisional) | **Reviewer:** Albraa | **Story points:** 5 | **Estimated hours:** 18  
**Dependencies:** CF-US-002-CF-US-004; seeded video URL  
**Blockers/decisions:** None; the MVP threshold is 70% and remains configuration-driven.

**User story**  
As an enrolled student, I want my unique lesson watch progress saved, so that I can resume learning and receive attendance credit at the agreed threshold.

**Description:** Replace the prototype timer with actual media events and periodic heartbeats. Persist monotonic progress, derive completion/attendance server-side, and show resume, complete, and error states.

**Acceptance criteria**

1. Given an enrolled student and playable lesson, when playback begins, then the lesson starts at the saved position and a progress session is recorded.
2. Given valid playback, when unique watched progress advances, then a throttled heartbeat persists position and watch percentage without decreasing prior progress.
3. Given progress crossing the approved threshold, when the server evaluates it, then one attendance record is awarded idempotently.
4. Given replaying, seeking, duplicate heartbeats, or another student/course, when updates arrive, then progress is not falsely inflated or written across identities.
5. Given media/API failure, when the page cannot continue, then saved progress remains intact and a retryable error is shown.

**Technical notes:** Server is authoritative. Use media duration/current time plus bounded heartbeat rules; MVP anti-fraud is basic, not device-grade.  
**UI source:** `ui5/lesson.html`, progress elements in `course.html` and `progress.html`.  
**API/data requirements:** `GET /lessons/:id`, `POST /lessons/:id/progress`, `content_progress`, `attendance`, video metadata.  
**Analytics events:** `lesson_start`, `lesson_progress` at 25/50/75%, `lesson_complete`, `video_start`, `video_progress`, `video_complete`.  
**Test cases:** resume, threshold boundary, duplicate heartbeat, seek/replay, unenrolled user, media error, API retry, mobile player.  
**Definition of Done:** persisted across reload; attendance rule documented; idempotency tests pass; analytics hooks exist; responsive/error states match design.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-025 | Integrate real media events and resume UI | Elgendy | 6h | Seeded media | Player/resume/progress interface | Browser media fixture test |
| CF-TASK-026 | Implement throttled progress heartbeat API | Albraa | 5h | US003 | Monotonic progress persistence | API sequence/idempotency tests |
| CF-TASK-027 | Implement configuration-driven 70% attendance evaluation | Albraa | 3h | T026 | Idempotent attendance record | Boundary and duplicate tests |
| CF-TASK-028 | Add playback, authorization, and failure tests | Seif | 4h | T025-T027 | Lesson integration suite | Automated browser/API tests |

### CF-US-008 — Submit and grade a basic quiz

**Epic:** CF-EPIC-06 | **Sprint:** Sprint 2 | **Scope:** MUST — Committed MVP | **Priority:** High  
**Primary owner:** Nabile (Provisional) | **Reviewer:** Habsa | **Story points:** 5 | **Estimated hours:** 14  
**Dependencies:** CF-US-002-CF-US-004; seeded published quiz  
**Blockers/decisions:** Short-answer AI grading is excluded; it may display as ungraded/deferred.

**User story**  
As an enrolled student, I want to answer and submit an objective quiz, so that I receive a saved result and the system can identify learning difficulty.

**Description:** Implement one-attempt retrieval and submission for published MCQ/true-false items with deterministic server grading. Preserve the prototype form/result pattern and expose data needed by the proctor.

**Acceptance criteria**

1. Given an available published quiz, when an enrolled student opens it, then questions render without exposing answer keys.
2. Given valid answers, when submitted, then one submission and per-question answers are persisted and objective score is calculated server-side.
3. Given duplicate submission or a closed/foreign quiz, when requested, then the server applies the configured attempt/access rule and returns a clear error.
4. Given success, when the result appears, then score and completion state persist after reload.

**Technical notes:** Never grade trusted client values. Treat generated and manual quiz origin as metadata. Keep short-answer grading POST-MVP.  
**UI source:** `ui5/quiz.html`, quiz tab in `course.html`, `teacher-quizzes.html` list only.  
**API/data requirements:** `GET /quizzes/:id`, `POST /quizzes/:id/submissions`; quiz/question/submission/answer tables.  
**Analytics events:** `quiz_start`, `quiz_submit`, `quiz_complete` with IDs, item count, attempt number, score band; no answer text.  
**Test cases:** correct/incorrect/partial answers, answer-key hiding, duplicate attempt, closed quiz, unenrolled access, reload result.  
**Definition of Done:** server grading and persistence pass; no answer key leaks; result state accessible; event hooks and tests complete.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-030 | Implement quiz retrieval and submission API | Nabile | 4h | US003 | Authorized quiz endpoints | API contract tests |
| CF-TASK-031 | Implement objective server-side grading | Nabile | 3h | T030 | Deterministic score persistence | Unit tests for answer types |
| CF-TASK-029 | Bind quiz form and result states to API | Habsa | 4h | T030 | Data-driven quiz route | Browser interaction test |
| CF-TASK-032 | Add access, duplicate, and result regression tests | Habsa | 3h | T029-T031 | Quiz integration suite | Automated tests |

### CF-US-009 — Upload a PDF and show processing status

**Epic:** CF-EPIC-07 | **Sprint:** Sprint 2 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Nabile (Provisional) | **Reviewer:** Seif | **Story points:** 5 | **Estimated hours:** 14  
**Dependencies:** CF-US-005; file storage decision; CF-US-006 environment  
**Blockers/decisions:** None; use a 20 MB limit and local persistent storage behind a replaceable storage adapter.

**User story**  
As a teacher, I want to upload a PDF and see its processing state, so that I know when it can ground Tutor answers.

**Description:** Implement PDF-only upload with teacher/course authorization, MIME/signature/size validation, checksum/version metadata, job creation, and pending/processing/completed/failed/retry states on the existing teacher course Files tab.

**Acceptance criteria**

1. Given an owned course and valid digital PDF, when uploaded, then file/document/job records are created and pending status appears.
2. Given an invalid type, signature, empty file, or oversized file, when selected, then upload is rejected before ingestion with a useful error.
3. Given job state changes, when the Files tab refreshes/polls, then processing, completed, and failed states render from server data.
4. Given a failed job, when the teacher retries, then a new/renewed attempt is queued without duplicating the active document version.
5. Given a teacher without ownership, when upload/status is requested, then access is denied.

**Technical notes:** Store files outside the public web root; sanitize display name; use generated storage key; never trust extension. PPTX is not committed.  
**UI source:** Files tab and drop zone in `ui5/teacher-course.html`; processed/processing/failed rows already designed.  
**API/data requirements:** `POST /teacher/courses/:id/documents`, `GET /.../documents`, `POST /documents/:id/retry`; `files`, `documents`, `ai_jobs`.  
**Analytics events:** `cta_click` for upload; no document name/text in analytics.  
**Test cases:** valid PDF, spoofed MIME, empty/oversized, duplicate checksum/version, ownership denial, status transitions, retry.  
**Definition of Done:** validation and access tests pass; status survives reload; failures are retryable; storage/config documented.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-033 | Connect teacher PDF upload and progress UI | Nabile | 4h | US005 | Upload interaction and server states | Browser upload fixture |
| CF-TASK-034 | Implement validation, storage, and document/job records | Nabile | 4h | Storage decision | Authorized upload API | File-security API tests |
| CF-TASK-035 | Implement status polling and failed-job retry UI | Elgendy | 3h | T034 | Processing lifecycle display | Simulated state transitions |
| CF-TASK-036 | Add upload security and lifecycle tests | Nabile | 3h | T033-T035 | Upload regression suite | Automated valid/invalid cases |

### CF-US-010 — Process and index course PDF content

**Epic:** CF-EPIC-07 | **Sprint:** Sprint 2 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Habsa (Provisional) | **Reviewer:** Albraa | **Story points:** 8 | **Estimated hours:** 20  
**Dependencies:** CF-US-009; AI embedding credentials; ChromaDB; test PDF  
**Blockers/decisions:** AI embedding credentials/model are external; start with 800-token chunks, 120-token overlap, BullMQ, and one Chroma collection with mandatory metadata filters.

**User story**  
As a teacher, I want an uploaded PDF converted into course-isolated searchable chunks, so that Tutor answers can use only my active course material.

**Description:** Implement worker stages for text extraction, normalization, page-aware chunking, embeddings, Chroma upsert, status/error persistence, and retries. Store metadata sufficient for source citations and active-version filtering.

**Acceptance criteria**

1. Given a valid digital PDF job, when processed, then text is extracted with page references and non-empty chunks are persisted/indexed.
2. Given each vector, when stored, then metadata contains course, document, version, chunk, and page/source identifiers.
3. Given two courses with similar content, when retrieval filters one course, then vectors from the other course are never returned.
4. Given extraction, embedding, or vector failure, when the worker stops, then the stage/error/attempt is logged and the job becomes retryable.
5. Given a replacement document version, when activated, then superseded chunks are excluded from retrieval.

**Technical notes:** Use structured parsers, deterministic chunk metadata, bounded batch sizes, and idempotent upsert IDs. Advanced knowledge graph is excluded.  
**UI source:** status rows in `ui5/teacher-course.html`; no new processing screen.  
**API/data requirements:** worker job claim/update; `documents`, `document_chunks`, `ai_jobs`; Chroma collection/metadata filter.  
**Analytics events:** no content text in analytics; operational timings go to structured logs.  
**Test cases:** normal PDF, blank/scanned PDF no-text failure, retry, duplicate job, version replacement, strict course isolation.  
**Definition of Done:** fixture processes reproducibly; citation metadata exists; isolation and retry tests pass; stage durations/errors are logged.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-037 | Implement page-aware PDF extraction worker stage | Habsa | 5h | T034, T049 | Extracted normalized text/pages | Digital and blank PDF fixtures |
| CF-TASK-038 | Implement deterministic chunking and embeddings | Habsa | 5h | T037, model choice | Chunk/embedding pipeline | Snapshot chunk metadata and mock model test |
| CF-TASK-039 | Implement Chroma upsert and course/version filters | Albraa | 6h | T038, Chroma | Isolated vector index | Two-course leakage test |
| CF-TASK-040 | Connect job stages, retry, idempotency, and status | Elgendy | 4h | T037-T039 | Reliable worker lifecycle | Failure injection and replay tests |

### CF-US-011 — Ask the grounded AI Tutor with citations

**Epic:** CF-EPIC-08 | **Sprint:** Sprint 2 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Seif (Provisional) | **Reviewer:** Nabile | **Story points:** 8 | **Estimated hours:** 24  
**Dependencies:** CF-US-010; AI model credentials; CF-US-004 chat route  
**Blockers/decisions:** Answer-model credentials are external; start with top-k 5, a configurable relevance threshold, Arabic grounded prompt, and redacted metadata-only operational logs.

**User story**  
As an enrolled student, I want to ask a course question and see the source used, so that I can trust the answer is based on teacher-uploaded material.

**Description:** Implement course-scoped conversation/message persistence, retrieval, guarded prompt construction, model call, answer/no-answer response, source citations, and safe chat states. The model must not silently use outside knowledge.

**Acceptance criteria**

1. Given an enrolled student and processed course PDF, when a supported question is asked, then the answer is based on retrieved chunks and includes at least one valid document/page citation.
2. Given weak/no relevant retrieval, when a question is asked, then the Tutor states that the uploaded material does not support an answer and does not fabricate a citation.
3. Given a prompt requesting system instructions, cross-course content, or ungrounded behavior, when processed, then protected instructions/content are not exposed and the response remains course-grounded or declines.
4. Given a citation, when selected/inspected, then its document/page metadata maps to a stored source chunk the student may access.
5. Given provider timeout/error/rate limit, when the request fails, then the UI offers a safe retry and logs trace, status, latency, tokens, and estimated cost without content leakage.

**Technical notes:** Construct prompts from server-owned templates; separate instructions from retrieved content; cap input/output; require retrieval threshold and citation validation.  
**UI source:** `ui5/assistant.html`, assistant entry actions in course/lesson/shell.  
**API/data requirements:** `POST /courses/:id/tutor/messages`, conversation history endpoint; chat conversation/message/source tables; Chroma retrieval; agent/activity log.  
**Analytics events:** `ai_tutor_question`, `ai_tutor_answer` with opaque IDs, course ID, result status, source count, latency band; never question/answer text.  
**Test cases:** supported Arabic question, unsupported question, cross-course attack, prompt injection, citation mapping, timeout, rate limit, long input, unauthorized course.  
**Definition of Done:** grounded fixture passes; no-answer and injection tests pass; citations resolve; privacy-safe telemetry exists; chat standard states work on mobile.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-041 | Implement course-filtered retrieval and message API | Elgendy | 6h | US010 | Tutor retrieval/message endpoint | Grounded API fixture tests |
| CF-TASK-042 | Implement guarded prompt, threshold, and no-answer policy | Nabile | 6h | T041, model choice | Prompt/policy module | Unsupported and injection test set |
| CF-TASK-043 | Connect chat, typing, citation, and retry UI states | Elgendy | 6h | T041-T042 | Real Tutor chat route | Browser happy/error/mobile tests |
| CF-TASK-044 | Persist citations and privacy-safe trace/token/cost logs | Seif | 6h | T041-T042 | Source links and request trace | Database/log reconciliation test |

### CF-US-012 — Receive and manage essential in-app notifications

**Epic:** CF-EPIC-13 | **Sprint:** Sprint 2 | **Scope:** MUST — Committed MVP | **Priority:** Medium  
**Primary owner:** Albraa (Provisional) | **Reviewer:** Elgendy | **Story points:** 3 | **Estimated hours:** 8  
**Dependencies:** CF-US-002; CF-US-009; Sprint 2 document producer hook, with the intervention producer completed later in CF-US-014  
**Blockers/decisions:** Email is excluded; shared page must render correct role shell.

**User story**  
As a CourseFlix user, I want essential processing and intervention notifications in the app, so that I can act without relying on email.

**Description:** Implement notification list, unread count, mark read/all, the document completion/failure producer, and a reusable producer interface. CF-US-014 connects the proctor intervention producer in Sprint 3. Correct teacher/student shell identity.

**Acceptance criteria**

1. Given notifications for the signed-in user, when the page opens, then only that user’s ordered records and unread count are shown.
2. Given mark-read or mark-all, when action succeeds, then state persists and the badge updates.
3. Given a teacher session, when notifications/settings open, then the teacher shell/profile remains visible.
4. Given no notifications or an API failure, when rendered, then an appropriate standard state appears.

**Technical notes:** In-app only. Notification links must be validated internal routes. Minimize sensitive detail in list previews.  
**UI source:** `ui5/notifications.html`; role shells in `ui5/build.py`.  
**API/data requirements:** `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`; notifications table and producer service.  
**Analytics events:** none by default; notification content/identity is not sent to GA4.  
**Test cases:** user isolation, ordering, unread badge, mark one/all, empty/error, teacher shell, invalid link.  
**Definition of Done:** persistent and user-scoped; role shell fixed; producer interface documented; tests pass.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-045 | Implement user-scoped notification endpoints | Albraa | 2h | US002-US003 | List/read APIs | User-isolation API tests |
| CF-TASK-046 | Connect list, filters, badge, and role-aware shell | Nabile | 2h | T045, US001 | Real notification page | Browser tests for both roles |
| CF-TASK-047 | Add document notification and reusable producer hooks | Elgendy | 2h | T045 | Document producer plus reusable notification service interface | Producer fixture test |
| CF-TASK-048 | Add empty/error/read-state regression tests | Elgendy | 2h | T045-T047 | Notification test coverage | Automated API/browser tests |

### CF-US-013 — Validate RAG grounding, security, and the integrated learning flow

**Epic:** CF-EPIC-14 | **Sprint:** Sprint 2 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Habsa (Provisional) | **Reviewer:** Seif | **Story points:** 5 | **Estimated hours:** 14  
**Dependencies:** CF-US-007-CF-US-012  
**Blockers/decisions:** None; Habsa authors the small fixture set and Seif independently reviews it under T050/T083.

**User story**  
As the CourseFlix team, we want repeatable safety and grounding checks, so that the demo does not mistake plausible language for a supported course answer.

**Description:** Create two course-isolated PDF fixtures, expected supported/unsupported Arabic questions, prompt-injection cases, rate/validation checks, and an integrated student flow test from lesson to Tutor citation.

**Acceptance criteria**

1. Given the approved evaluation set, when run, then supported questions return correct source pages and unsupported questions use the no-answer behavior.
2. Given two courses, when cross-course questions are tested, then no chunks/citations/content leak between them.
3. Given oversized, malicious, repeated, or unauthorized requests, when submitted, then validation/rate/permission controls respond safely.
4. Given the seeded student, when the integrated test opens course, watches progress, submits quiz, and asks Tutor, then persisted state and citation are verified.

**Technical notes:** Record deterministic fixtures and tolerant semantic assertions; do not assert exact model prose. Redact source content from routine logs.  
**UI source:** `ui5/course.html`, `lesson.html`, `quiz.html`, `assistant.html`.  
**API/data requirements:** all Sprint 2 contracts; isolated test users/courses/documents; request correlation IDs.  
**Analytics events:** verify privacy-safe Tutor/lesson/quiz payloads at hook level; full `dataLayer` in Sprint 3.  
**Test cases:** at least five supported, five unsupported, three injection, cross-course, long input, unauthorized, timeout, integrated happy path.  
**Definition of Done:** evaluation fixtures versioned; team-agreed threshold met; critical leakage/no-answer tests green; failures produce actionable trace IDs.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-049 | Create isolated PDF fixtures and expected questions | Habsa | 4h | US003 course IDs and approved fixture content | RAG evaluation dataset prepared before T037 | Peer review source/page answers |
| CF-TASK-050 | Automate grounding, citation, and no-answer evaluation | Seif | 4h | T049, US011 | Repeatable RAG eval command | Run report and inspect failures |
| CF-TASK-051 | Add prompt, auth, validation, and rate-limit tests | Albraa | 3h | US011 | AI security regression suite | Negative request matrix |
| CF-TASK-052 | Add integrated lesson-quiz-Tutor browser flow | Seif | 3h | US007-US012 | Sprint 2 E2E path | Reset seed and run browser test |

### Sprint 2 GTM technical task

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-062 | Instrument course, lesson, quiz, and Tutor events | Seif | 4h | T061; CF-US-007, CF-US-008, CF-US-011 integrated event hooks | MVP learning/Tutor `dataLayer` events | Browser listener assertions, dedup checks, and payload denylist |

### Sprint 2 cross-team review tasks

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-083 | Review RAG isolation, citations, and prompt safety | Albraa | 2h | CF-US-009-CF-US-013 | Recorded AI/data safety review | Leakage/injection/citation evaluation rerun |
| CF-TASK-084 | Review learning UI, events, and API contracts | Nabile | 2h | CF-US-007, CF-US-008, CF-US-012 | Learning-flow integration sign-off | Sprint 2 E2E and responsive states rerun |

## 12. Sprint 3 Backlog

**Sprint goal:** Complete the demonstrable business loop with a safe event-based intervention, test purchase, structured product analytics, backend-sourced teacher sales answers, traceable logs, and a repeatable release candidate.

**Blocking dependencies:** stable Sprint 2 flow and GTM access or local validation fallback. Gap-fill UI authority, test adapter, EGP, and Africa/Cairo are confirmed.  
**Critical path:** CF-US-015 -> CF-US-016 -> CF-US-017; CF-US-014 depends on Sprint 2 events/RAG; all feed CF-US-018/019.  
**Risks:** gap-fill UI workload, analytics credentials, order schema work, agent scope creep, and insufficient stabilization time.  
**Planned/buffer:** 110h planned / 40h buffer, including 8h Seif-owned commerce/proctor GTM and 4h cross-team review. Feature freeze begins Tuesday, August 4 at end of day.

### CF-US-014 — Trigger a limited struggle intervention

**Epic:** CF-EPIC-09 | **Sprint:** Sprint 3 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Habsa (Provisional) | **Reviewer:** Albraa | **Story points:** 8 | **Estimated hours:** 20  
**Dependencies:** CF-US-007, CF-US-008, CF-US-010-CF-US-013  
**Blockers/decisions:** None; the canonical demo trigger is an objective quiz score below 60%, with rule/version stored in the log.

**User story**  
As a teacher, I want a limited, traceable struggle signal to create a small intervention, so that I can follow up with a student without continuous surveillance or automatic discipline.

**Description:** Evaluate explicit “I do not understand,” repeated concept questions, low objective quiz score, or low lesson completion using deterministic rules. On one approved trigger, create a weak-concept report, small course-grounded mini quiz, in-app notification, and agent log. No automatic suspension.

**Acceptance criteria**

1. Given an approved event/threshold, when the rule evaluator runs, then one weak-concept signal is created with rule/version and supporting event IDs.
2. Given a valid concept with active course source chunks, when intervention is created, then a 3-5 question objective mini quiz is generated or a reviewed deterministic fallback is used and its source is traceable.
3. Given an intervention, when completed, then the student can open the mini quiz and the teacher can view the progress report and notification.
4. Given duplicate/replayed events, when evaluated, then the same rule window does not create duplicate active interventions.
5. Given insufficient evidence or generation failure, when evaluated, then no disciplinary action occurs; a safe failed/skipped log is written.

**Technical notes:** Version rule thresholds. Use existing events, not continuous polling. Separate flag/report creation from teacher action. Explicitly prohibit suspension side effects.  
**UI source:** mini quiz in `ui5/quiz.html`; student notes in `progress.html`; teacher reports in `teacher-dashboard.html` and `teacher-students.html`; generated quiz list in `teacher-quizzes.html`.  
**API/data requirements:** evaluator input from quiz/chat/progress events; progress reports, quizzes/questions, notifications, student events, agent logs.  
**Analytics events:** `mini_quiz_generated` with opaque IDs, trigger type, question count, result status; no question/chat text.  
**Test cases:** explicit phrase, low score, repeated concept, low completion, below threshold, duplicate event, no source, generation failure, no suspension mutation.  
**Definition of Done:** one demo trigger works end-to-end; rules/version documented; idempotency and no-suspension tests pass; report, notification, log, and quiz reconcile.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-053 | Implement versioned event-based struggle rules | Habsa | 5h | US007-US013 | Rule evaluator and signal record | Threshold/negative unit tests |
| CF-TASK-054 | Aggregate weak concept and evidence references | Habsa | 4h | T053 | Traceable concept/evidence result | Fixture evidence reconciliation |
| CF-TASK-055 | Generate course-grounded objective mini quiz | Nabile | 5h | T054, US010 | 3-5 question mini quiz/fallback | Source and answer validation tests |
| CF-TASK-056 | Create report, notification, agent log, and teacher view | Habsa | 6h | T053-T055, US012 | End-to-end intervention record | Browser/API idempotency walkthrough |

### CF-US-015 — Complete a test checkout and authoritative order

**Epic:** CF-EPIC-10 | **Sprint:** Sprint 3 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Albraa (Provisional) | **Reviewer:** Seif | **Story points:** 5 | **Estimated hours:** 18  
**Dependencies:** CF-US-002-CF-US-004; commerce migration is delivered inside T058  
**Blockers/decisions:** None; use the confirmed deterministic test adapter, EGP, Africa/Cairo, and authorized `ui5/` gap-fill layout.

**User story**  
As a student, I want to complete a test checkout for a course, so that the team can demonstrate a purchase without moving real money.

**Description:** Add a restrained checkout and result route using existing tokens. Create draft order, validate server-side course/price, simulate approved/declined payment deterministically, complete the order transactionally, and expose a receipt/reference. Backend orders are financial truth.

**Acceptance criteria**

1. Given an eligible course, when checkout opens, then server-returned course, currency, and amount are displayed; client values cannot set the charge.
2. Given the test-success method, when purchase is confirmed, then one paid order/payment record is committed and a stable order reference appears.
3. Given a duplicate confirmation/idempotency key, when retried, then no duplicate paid order or enrollment is created.
4. Given test decline or server failure, when confirmation fails, then order status is accurate, error is actionable, and retry does not misreport success.
5. Given a successful purchase, when metrics/events are reconciled, then backend order ID, amount, currency, and completion time are authoritative.

**Technical notes:** Add `orders`, `order_items`, and `payments`/attempt fields through migration. Use integer minor units/decimal-safe values. Never collect real card data.  
**UI source:** **Authorized gap-fill screen**; reuse `ui5` shell, card, fields, buttons, dialog/snackbar, and success/error tokens.  
**API/data requirements:** `POST /checkout/orders`, `POST /checkout/orders/:id/confirm`, `GET /orders/:id`; order/item/payment tables; optional enrollment transaction.  
**Analytics events:** hooks for `begin_checkout`, `add_payment_info`, `purchase`, and `checkout_error`; Seif emits them under CF-TASK-063 and reconciles under CF-TASK-064.  
**Test cases:** success, decline, server price mismatch, duplicate confirm, unauthorized course, already owned, database failure, receipt access.  
**Definition of Done:** no real payment data; transactional/idempotency tests pass; gap-filled routes pass `ui5/` visual review; order is sole revenue truth; error/success routes are responsive.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-057 | Build gap-filled checkout/result UI | Elgendy | 5h | CF-US-001 | Responsive checkout and status routes | 390/768/1440 visual and token review |
| CF-TASK-058 | Add commerce migration and test-payment endpoints | Albraa | 6h | Currency/adapter decision | Draft/confirm/read order flow | Success/decline API tests |
| CF-TASK-059 | Add transactional idempotency and backend truth rules | Albraa | 4h | T058 | Duplicate-safe purchase completion | Concurrency/retry test |
| CF-TASK-060 | Add checkout integration and security tests | Seif | 3h | T057-T059 | Commerce regression suite | Browser/API test matrix |

### CF-US-016 — View teacher sales metrics from backend orders

**Epic:** CF-EPIC-12 | **Sprint:** Sprint 3 | **Scope:** MUST — Committed MVP | **Priority:** High  
**Primary owner:** Nabile (Provisional) | **Reviewer:** Albraa | **Story points:** 5 | **Estimated hours:** 14  
**Dependencies:** CF-US-015 and authorized `ui5/` gap-fill conventions  
**Blockers/decisions:** None; use EGP, Africa/Cairo, and half-open date ranges `[from, to)` internally while displaying inclusive user dates.

**User story**  
As a teacher, I want sales totals for my courses from confirmed orders, so that I can understand revenue without treating GA4 as accounting data.

**Description:** Add teacher-owned aggregate queries and a compact sales view for date range, successful-order count, revenue, and best-selling course. Include loading, empty, error, forbidden, and currency-formatted states.

**Acceptance criteria**

1. Given a date range, when metrics load, then only successful paid orders for courses owned by the teacher are aggregated in the configured timezone/currency.
2. Given successful order fixtures, when displayed, then revenue, count, and best-selling course reconcile exactly with backend records.
3. Given no successful orders, when the range loads, then zero/empty states appear without implying a system error.
4. Given invalid range, excessive range, or another teacher’s course, when requested, then validation/permission errors are returned safely.
5. Given failed/declined/test-reset orders, when metrics calculate, then they do not contribute to confirmed revenue.

**Technical notes:** Use controlled aggregate SQL/service methods and indexes. Document ties for best seller and date boundary semantics.  
**UI source:** **Authorized gap-fill screen**; reuse teacher dashboard tiles, bar/list/table patterns.  
**API/data requirements:** `GET /teacher/sales/summary?from&to`; orders/items/course ownership; server currency formatter or stable minor units.  
**Analytics events:** optional privacy-safe `page_view`; do not send revenue query contents or use GA4 as source.  
**Test cases:** known totals, empty, date boundary, timezone, failed orders excluded, ownership, invalid/long range, tie.  
**Definition of Done:** fixture reconciliation exact; ownership and range limits tested; gap-filled screen reviewed against `ui5/`; all standard states responsive.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-065 | Implement teacher-owned sales aggregate service | Albraa | 5h | US015 | Controlled revenue/count/best-seller queries | Fixture SQL/service tests |
| CF-TASK-066 | Build gap-filled sales metrics view | Nabile | 5h | T065 | Date filter, tiles, result list | Responsive browser and `ui5/` token checks |
| CF-TASK-067 | Add loading, empty, validation, and error states | Nabile | 2h | T066 | Complete metrics states | State fixture review |
| CF-TASK-068 | Add order-to-metric reconciliation tests | Albraa | 2h | T065 | Financial aggregate regression | Compare fixture ledger to response |

### CF-US-017 — Ask a limited Analytics & Store Agent question

**Epic:** CF-EPIC-12 | **Sprint:** Sprint 3 | **Scope:** MUST — Committed MVP | **Priority:** High  
**Primary owner:** Nabile (Provisional) | **Reviewer:** Seif | **Story points:** 5 | **Estimated hours:** 16  
**Dependencies:** CF-US-016 and the early Sprint 3 log contract from T074  
**Blockers/decisions:** None; use the three allowlisted intents, teacher-owned scope, 366-day maximum, and structured answer shapes in section 18.

**User story**  
As a teacher, I want to ask a small set of sales questions in natural language, so that I can retrieve trusted aggregates without learning report controls.

**Description:** Parse only allowlisted intent/date shapes and call predefined query functions. Initial committed intents: revenue for a date range, successful-order count, and best-selling courses. Return structured answer, interpreted range, currency, source timestamp, and trace ID. Never generate or execute arbitrary SQL.

**Acceptance criteria**

1. Given a supported revenue/count/best-seller question, when submitted, then an allowlisted intent and validated date range call the corresponding controlled service.
2. Given an ambiguous or unsupported question, when submitted, then the Agent lists supported examples and performs no database query beyond validation/logging.
3. Given another teacher or unauthorized role, when asking, then only owned-course aggregates are returned or access is denied.
4. Given empty data, invalid dates, excessive range, or service failure, when answered, then the response is explicit, currency/date formatted, and traceable.
5. Given a completed answer, when its trace is inspected, then intent, normalized parameters, query function/version, row count, duration, and result status are logged without unrestricted SQL or sensitive order data.

**Technical notes:** A deterministic parser/structured model output is acceptable, but its output must pass a strict schema. No raw SQL tool and no unrestricted DB credentials.  
**UI source:** **Authorized gap-fill screen**; use teacher sales panel and existing field/list patterns without copying the student Tutor identity.  
**API/data requirements:** `POST /teacher/analytics/questions`; allowlisted intent schema; CF-US-016 query functions; agent logs.  
**Analytics events:** no natural-language question in GA4; operational agent log only.  
**Test cases:** supported phrasing variants, explicit/relative dates, empty, unsupported, ambiguous, malformed model output, ownership, query failure, currency format.  
**Definition of Done:** exactly three supported intents documented; no arbitrary SQL path; fixtures have expected response shapes; permission, empty, and failure tests pass.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-069 | Implement allowlisted intent/date parser and schema | Nabile | 4h | Intent decision | Validated normalized request | Phrase/invalid-date unit tests |
| CF-TASK-070 | Expose controlled analytics query functions | Albraa | 5h | US016 | Permission-scoped function registry | Fixture and ownership tests |
| CF-TASK-071 | Build gap-filled teacher analytics prompt/result UI | Elgendy | 4h | T069-T070 | Supported examples, result/error panel | Browser state and `ui5/` consistency tests |
| CF-TASK-072 | Add permissions, fixtures, failure, and no-SQL tests | Seif | 3h | T069-T071, T074 | Agent security/integration suite | Verify no raw SQL execution path |

### CF-US-018 — Inspect agent actions, errors, and service health

**Epic:** CF-EPIC-13 | **Sprint:** Sprint 3 | **Scope:** MUST — Committed MVP | **Priority:** High  
**Primary owner:** Seif (Provisional) | **Reviewer:** Habsa | **Story points:** 3 | **Estimated hours:** 10  
**Dependencies:** CF-US-010-CF-US-017  
**Blockers/decisions:** None; migrate the agent enum and expose owned-course summaries to teachers while retaining traces, prompts, stack details, and sensitive diagnostics for operators only.

**User story**  
As the demo team, we want traceable agent actions, failures, and health indicators, so that system behavior can be explained rather than hidden.

**Description:** Standardize correlation IDs and structured logs across ingestion, Tutor, proctor, checkout, and analytics; persist agent action summaries; expose a restricted gap-filled log view and health endpoints suitable for the demo.

**Acceptance criteria**

1. Given any agent execution, when it completes/fails/retries, then one traceable log records type, status, actor/course scope, timestamps, duration, rule/model/function version, and correlation ID.
2. Given a teacher, when logs are viewed, then only actions for owned courses and privacy-safe summaries are returned.
3. Given service degradation, when health is checked, then API/database/vector/AI dependency status is distinguishable without exposing secrets.
4. Given a known failed ingestion/analytics fixture, when demonstrated, then its user-safe error and correlated operational log can be located.

**Technical notes:** Redact prompt/document/order personal data; never expose stack traces to users. Add analytics agent enum/migration safely. Health may distinguish readiness/liveness.  
**UI source:** **Authorized gap-fill screen**; reuse teacher table/list/chip patterns.  
**API/data requirements:** `GET /teacher/agent-logs`, `/health/live`, `/health/ready`; `agent_logs`, `activity_logs`, `ai_jobs`, correlation IDs.  
**Analytics events:** operational only; do not forward agent logs to GA4.  
**Test cases:** success/failure/retry, course isolation, redaction, correlation lookup, dependency down, unauthorized log request.  
**Definition of Done:** core services emit correlated logs; restricted viewer works; health checks and a failure demo are documented/tested.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-074 | Standardize structured error, token, cost, and action logs | Habsa | 2h | Existing ingestion/Tutor log fields and Sprint 3 schema agreement | Logging field contract | Inspect success/failure fixtures |
| CF-TASK-075 | Add liveness/readiness and correlation propagation | Elgendy | 2h | Service topology | Health endpoints/trace IDs | Dependency failure test |
| CF-TASK-073 | Implement agent log API and restricted gap-filled view | Habsa | 4h | T074, CF-US-017 agent records | Filtered log list/detail | Ownership/redaction browser/API tests |
| CF-TASK-076 | Document and validate one safe failure demonstration | Seif | 2h | T073-T075 | Demo failure runbook | Rehearse lookup from UI error to log |

### Sprint 3 GTM technical tasks

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-063 | Instrument proctor, checkout, and purchase events | Seif | 4h | T061; CF-US-014 and CF-US-015 integrated hooks | AI intervention and commerce `dataLayer` events | Duplicate/retry tests and backend order-value assertions |
| CF-TASK-064 | Validate GTM/GA4 mapping, privacy, and order reconciliation | Seif | 4h | T061-T063 | Preview/test mapping report and financial reconciliation evidence | GTM Preview or local listener, PII scan, and database comparison |

### Sprint 3 pre-release cross-team review task

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-085 | Review commerce and Analytics Agent authorization | Habsa | 2h | CF-US-015-CF-US-017 | Recorded order/sales/agent review | Orders reconcile to sales/agent responses and no arbitrary SQL path exists |

### CF-US-019 — Release and rehearse the end-to-end MVP

**Epic:** CF-EPIC-15 | **Sprint:** Sprint 3 | **Scope:** MUST — Committed MVP | **Priority:** Highest  
**Primary owner:** Seif (Provisional) | **Reviewer:** Elgendy | **Story points:** 8 | **Estimated hours:** 20  
**Dependencies:** CF-US-001-CF-US-015, CF-US-016-CF-US-018, CF-TASK-061-CF-TASK-064  
**Blockers/decisions:** Deployment URL and external AI/GTM credentials remain open; Seif owns the canonical demo runbook.

**User story**  
As the CourseFlix team, we want a resettable, tested release candidate and rehearsed script, so that the complete MVP can be demonstrated reliably.

**Description:** Complete the critical E2E path, visual/RTL/mobile regression, integration bug bash, deterministic seed/document/order reset, environment/deployment notes, known-limitations record, and two timed rehearsals.

**Acceptance criteria**

1. Given a clean/reset demo environment, when the canonical scenario runs, then all 13 MVP outcomes complete without manual database edits.
2. Given desktop and mobile target viewports, when core pages render, then no incoherent overlap, clipped text, unusable control, or role-shell error remains.
3. Given the release checks, when run, then migrations, unit/integration/E2E tests, RAG evaluation, privacy event checks, and health checks pass or an accepted limitation is recorded.
4. Given a failure/retry demonstration, when rehearsed, then the team can recover or explain the trace without exposing secrets.
5. Given the Thursday release candidate, when two team members independently follow the runbook, then both can reset and deliver the scenario within the allotted demo time.

**Technical notes:** No new feature after Tuesday EOD. Prioritize severity 1/2 defects. Pin fixture/model settings where possible and retain fallback screenshots/data only as presentation contingency, not fake feature evidence.  
**UI source:** all 14 existing screens plus authorized gap-filled checkout/sales/analytics/log views.  
**API/data requirements:** full MVP; reset/seed scripts; deployment configuration; health endpoints.  
**Analytics events:** complete MVP event validation and order reconciliation.  
**Test cases:** canonical E2E, both roles, mobile/desktop, API/AI failure, reset rerun, privacy scan, migration from clean DB.  
**Definition of Done:** release checklist signed; no open severity 1/2 defects; two rehearsals complete; limitations and deferred scope presented honestly.

**Subtasks**

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-077 | Automate the canonical teacher-to-student E2E flow | Seif | 5h | US001-US015, US016-US018, T061-T064 | Full browser/API E2E test | Run from reset environment |
| CF-TASK-078 | Complete RTL, accessibility, and responsive visual QA | Elgendy | 4h | UI feature freeze | Viewport/accessibility report | 390/768/1024/1440 checks |
| CF-TASK-079 | Run cross-team bug bash and resolve release blockers | Nabile | 6h | Feature freeze, T085 | Triaged/fixed severity 1/2 defects | Re-run affected regression suite |
| CF-TASK-080 | Finalize reset seed, release runbook, and two rehearsals | Seif | 5h | T077-T079 | Repeatable demo package/runbook | Independent rehearsal sign-off |

### Sprint 3 release-readiness review task

| Task | Action | Owner | Estimate | Dependency | Deliverable | Validation |
|---|---|---|---:|---|---|---|
| CF-TASK-086 | Conduct independent release-readiness review | Elgendy | 2h | CF-US-018, CF-US-019 | Release gate sign-off or blocker list | Runbook followed independently and release checklist rerun |

## 13. Per-Person Workload

Assignments remain Provisional and may be swapped during Sprint Planning without changing total capacity or dependencies.

| Person | Sprint 1 tasks (hours) | Sprint 2 tasks (hours) | Sprint 3 tasks (hours) |
|---|---|---|---|
| Elgendy | T001 4, T002 6, T006 5, T016 3, T020 4 = **22h** | T025 6, T035 3, T040 4, T041 6, T043 6, T047 2, T048 2 = **29h** | T057 5, T071 4, T075 2, T078 4, T086 2 = **17h** |
| Albraa | T005 6, T007 6, T009 6, T019 5, T082 2 = **25h** | T026 5, T027 3, T039 6, T045 2, T051 3, T083 2 = **21h** | T058 6, T059 4, T065 5, T068 2, T070 5 = **22h** |
| Nabile | T003 4, T011 4, T015 4, T017 5, T018 6 = **23h** | T030 4, T031 3, T033 4, T034 4, T036 3, T042 6, T046 2, T084 2 = **28h** | T055 5, T066 5, T067 2, T069 4, T079 6 = **22h** |
| Habsa | T004 4, T012 4, T013 5, T014 6, T023 2 = **21h** | T029 4, T032 3, T037 5, T038 5, T049 4 = **21h** | T053 5, T054 4, T056 6, T073 4, T074 2, T085 2 = **23h** |
| Seif | T008 7, T010 6, T021 3, T022 3, T024 2, T061 4, T081 2 = **27h** | T028 4, T044 6, T050 4, T052 3, T062 4 = **21h** | T060 3, T063 4, T064 4, T072 3, T076 2, T077 5, T080 5 = **26h** |

Workload guardrails:

- A member should have at most one active blocking task at a time.
- Pair/review time comes from sprint buffer unless a review produces implementation work, which is recorded as a bug/task.
- Seif’s GTM and quality work is deliberately staged; his 27h/21h/26h workload stays below the 30h individual gross limit and keeps at least 4h personal contingency in Sprint 3.
- Cross-feature tests T052 and T077 are sequenced after their feature dependencies; feature owners retain local test responsibility.
- Albraa’s data-heavy work is sequenced: auth/data in S1, vector integration in S2, then orders/aggregates in S3.
- Any absence reduces committed tasks before consuming the full buffer; defer the lowest-priority unstarted story/task first.

## 14. Dependency Map

```text
CF-TASK-021/022 Workspace and test-command baseline
   +--> CF-US-003 Data/API baseline
          +--> CF-US-002 Authentication/RBAC
          +--> CF-US-004 Student course flow
          +--> CF-US-005 Teacher course flow

CF-US-002 + CF-US-003
   +--> CF-TASK-023/024 complete the API/test baseline

CF-US-004 + CF-US-005
   +--> CF-US-007 Lesson progress
   +--> CF-US-008 Basic quiz
   +--> CF-US-009 PDF upload
          +--> CF-US-010 PDF ingestion/index
                 +--> CF-US-011 Grounded Tutor
                        +--> CF-US-013 RAG/integration validation
                               +--> CF-US-014 Proctor intervention

CF-US-003 + authorized gap-fill UI conventions
   +--> CF-US-015 Test checkout/order
          +--> CF-US-016 Sales metrics
                 +--> CF-US-017 Limited Analytics Agent

All user-facing stories
   +--> CF-TASK-061-064 Seif-owned GTM/dataLayer workstream
   +--> CF-US-018 logs/health
   +--> CF-US-019 E2E release and rehearsal
```

| Dependency | Needed by | Risk response |
|---|---|---|
| React/NestJS workspace scaffolding | Sprint 1 day 1 | Stack is confirmed; create shared run/test conventions immediately |
| AI/embedding credentials | CF-US-010/011 | Provider adapter plus deterministic mocks; escalate by July 23 |
| ChromaDB runtime | CF-US-010 | Local container and isolated collection fixture |
| Digital PDF fixture with known answers/pages | CF-US-010/013 | Prepare T049 on Sprint 2 day 1 before T037; no OCR dependency |
| Attendance threshold | CF-US-007 | Confirmed configuration-driven 70%, matching `ui5/` |
| Gap-filled UI consistency | CF-US-015/016/017/018 | No external approval blocker; reviewer verifies existing tokens/patterns in each story DoD |
| Test payment/currency/timezone | CF-US-015/016 | Confirmed internal adapter, EGP, Africa/Cairo |
| GTM/GA4 access | CF-TASK-061-064 | Contract/local listener remains complete; live publish becomes external blocker |
| Stable orders | CF-US-016/017 | Never substitute GA4 metrics for missing order data |

## 15. Critical Path

Jira IDs are stable planning keys, not chronological start numbers. Within each sprint, execute tasks by the dependency waves below; independent entries in the same wave may run in parallel, while ranges and arrows retain their listed dependencies.

T049 and T074 are intentional enabling subtasks: they start early to unblock ingestion and Analytics Agent integration, but their parent stories cannot close until all story-level dependencies and acceptance criteria are complete.

| Sprint | Wave 1 | Wave 2 | Wave 3 | Exit/review wave |
|---|---|---|---|---|
| Sprint 1 | T001; T021-T022 | T002-T003; T009-T011 | T004; T005-T008; T012-T020; T023 | T024; T061; T081-T082 |
| Sprint 2 | T049; T025-T026; T030; T034 | T027-T029; T031; T033; T035; T037-T040; T045 | T032; T036; T041-T048 | T050-T052; T062; T083-T084 |
| Sprint 3 | T053-T055; T057-T059; T069; T074-T075 | T056; T060; T065-T068 | T070-T073; T063 | T064; T076; T085; feature freeze; T077-T080; T086 |

The release critical path is:

1. **Jul 16-20:** T021/T022 scaffold the React/NestJS workspace and test commands -> migrations/seed -> session/RBAC -> real course APIs.
2. **Jul 21-23:** complete student/teacher core routes and baseline tests; Seif finishes T061 after route/ID contracts stabilize.
3. **Jul 26-27:** prepare T049 fixtures in parallel with PDF upload/validation -> job record.
4. **Jul 27-28:** extraction -> chunking/embeddings -> Chroma course/version index.
5. **Jul 28-29:** retrieval -> guarded prompt -> citation persistence -> chat integration.
6. **Jul 30:** grounding/security evaluation and Sprint 2 integrated flow; Seif completes T062 against integrated learning/Tutor hooks.
7. **Aug 2-3:** test order persistence -> sales aggregates -> allowlisted agent.
8. **Aug 2-4 in parallel:** event-based proctor -> mini quiz/report/log; Seif completes T063 for proctor/commerce events.
9. **Aug 4 EOD:** feature freeze.
10. **Aug 5-6:** Seif completes T064 GTM/privacy/order reconciliation; team runs E2E, bug fixes, reset, and two rehearsals.

Critical-path exit criteria:

- Sprint 1 does not exit with mock-only auth or hard-coded course screens.
- Sprint 2 does not exit until a known supported question cites the correct page and an unsupported question declines.
- Sprint 3 does not exit until purchase and sales totals reconcile to backend orders and the complete demo resets cleanly.

## 16. GTM and GA4 Tracking Plan

Global rules: every event uses a documented `schema_version`, opaque `event_id`, timestamp, route, and consent/analytics state. Never include name, email, phone, chat text, answer text, document name/content, raw payment data, or unrestricted user-entered text. Purchase value comes only from the successful backend order response; the order database remains the source of truth.

GTM ownership is exclusive: **Seif owns CF-TASK-061 through CF-TASK-064 and every GTM/GA4 implementation, mapping, privacy, and validation change.** Feature owners expose stable IDs and confirmed lifecycle hooks as part of their normal API/UI stories, but they are not assigned GTM work.

| Sprint | Seif-owned GTM work | Timing gate | Hours |
|---|---|---|---:|
| Sprint 1 | T061 event contract/helper | After React route names and Nest API IDs stabilize; finish by Jul 23 | 4h |
| Sprint 2 | T062 course/lesson/quiz/Tutor events | After each learning flow integrates; final verification Jul 30 | 4h |
| Sprint 3 | T063 proctor/checkout/purchase events | After CF-US-014/015 integration; finish by Aug 4 feature freeze | 4h |
| Sprint 3 | T064 GTM/GA4/privacy/reconciliation QA | After T063 and before final rehearsal; finish Aug 5 | 4h |

| Event | Trigger | Required properties | Data source | Privacy | Test | Scope |
|---|---|---|---|---|---|---|
| `page_view` | Successful route render | page name/path, role, course ID when relevant | Router/session | Opaque IDs only | Route listener; no duplicate initial view | MUST |
| `view_item_list` | Enrolled course list loaded | list ID, item IDs/count | Course API response | No course title needed | Empty/populated fixture | MUST |
| `select_item` | Student selects course from list | list ID, course ID, position | Click context + API ID | Opaque ID | One event per activation | MUST |
| `view_item` | Course detail loads successfully | course ID, price/currency if offered | Course API response | No teacher/student identity text | Deep-link/load test | MUST |
| `add_to_cart` | Course added to cart | course ID, server price, currency | Cart/order API | No client-entered price | Contract test | POST-MVP; no cart in MVP |
| `begin_checkout` | Draft order created and checkout shown | order ID, item IDs, value, currency | Backend draft order | Opaque order ID | Browser/API listener | MUST |
| `add_payment_info` | Test payment method accepted for confirmation | order ID, payment type=`test`, value, currency | Backend order + fixed UI option | No card/payment secrets | Success/decline fixture | MUST |
| `purchase` | Backend confirms paid order | transaction/order ID, items, value, currency, coupon if supported | Successful backend response | No buyer PII | Dedup + DB reconciliation | MUST |
| `checkout_error` | Checkout/confirmation fails | order ID if available, stage, safe error code | Backend error response | No raw error/card data | Decline/server error fixtures | MUST |
| `course_enroll` | Enrollment transaction succeeds | enrollment ID, course ID, order ID or method | Backend enrollment result | Opaque IDs | Enrollment integration test | SHOULD; pre-enrolled MVP |
| `lesson_start` | First active lesson session starts | course/lesson IDs, resume flag | Lesson API/media state | No title/student text | Resume/new session tests | MUST |
| `lesson_progress` | Unique progress crosses 25/50/75 | course/lesson IDs, milestone, session ID | Server-accepted progress | No raw viewing timeline | Seek/replay/dedup tests | MUST |
| `lesson_complete` | Server marks lesson complete | course/lesson IDs, completion percent | Server progress result | Opaque IDs | Threshold/replay test | MUST |
| `video_start` | Media first plays in session | course/lesson/video IDs, start position | Media event + API metadata | No media URL | Player listener test | MUST |
| `video_progress` | Media reaches 25/50/75 milestones | video ID, milestone, duration band | Media + server state | Coarse duration only | Seek/dedup test | MUST |
| `video_complete` | Media ends or server confirms completion | video ID, completion percent | Media/server result | Opaque IDs | Ended/threshold test | MUST |
| `quiz_start` | Published quiz loads and attempt starts | course/quiz IDs, question count, origin | Quiz API | No question text | Reload/attempt test | MUST |
| `quiz_submit` | Submission accepted | quiz/submission IDs, answered count, attempt | Backend submission response | No answers | Double-submit test | MUST |
| `quiz_complete` | Objective result returned | quiz/submission IDs, score band, result status | Backend grading result | Score band preferred | Fixture grade test | MUST |
| `ai_tutor_question` | Valid Tutor request accepted | request/conversation/course IDs, input length band | Tutor API acknowledgement | Never question text | Payload denylist test | MUST |
| `ai_tutor_answer` | Answer/no-answer/failure resolves | request ID, result status, source count, latency band | Tutor response | Never answer/source text | Supported/no-answer/error tests | MUST |
| `mini_quiz_generated` | Intervention quiz committed | agent run/quiz/course IDs, trigger type, item count, status | Proctor service result | No trigger text/student identity | Idempotency/failure tests | MUST |
| `cta_click` | Approved high-value CTA activated | CTA ID, placement, destination, course ID if relevant | UI action registry | No button free text/user text | Registry and duplicate test | MUST |

GTM delivery:

1. CF-TASK-061 defines the event dictionary and clears prior ecommerce data before each ecommerce push.
2. CF-TASK-062/063 instrument confirmed state transitions rather than arbitrary DOM selectors.
3. CF-TASK-064 maps events to GA4 tags/triggers and validates through GTM Preview if credentials exist.
4. A reconciliation fixture compares `purchase.transaction_id`, value, and currency to the order database.
5. GA4 delays, ad blockers, consent, or tag failure never change order state.

## 17. RAG Delivery Plan

| Stage | Input | Output | Guardrail | Failure behavior | Owner task |
|---|---|---|---|---|---|
| Validate/upload | Teacher PDF | Stored file, document, job | Ownership, PDF signature, size, checksum | Reject before queue with safe reason | T034 |
| Extract | Digital PDF | Page-numbered normalized text | Structured PDF parser; no OCR claim | Failed `no_extractable_text`, retry after replacement | T037 |
| Chunk | Page text | Stable chunk IDs/text/metadata | Bounded size/overlap, preserve page | Job stage failure; no partial active version | T038 |
| Embed | Chunks | Embedding vectors | Configured model/version, batch bounds | Retry with attempt/cost logs | T038/T040 |
| Index | Vectors | Chroma records | Mandatory course/document/version metadata | Idempotent upsert/cleanup | T039 |
| Retrieve | Student question/course | Ranked active chunks | Enrollment + `course_id` + active version filter | Empty result becomes no-answer | T041 |
| Prompt | Question + chunks | Guarded model request | Server template, content delimiters, token cap, injection rule | Decline/validation error | T042 |
| Answer | Model output | Answer/no-answer + source IDs | Claims constrained to sources; citation validation | Invalid citation becomes safe failure/no-answer | T041/T044 |
| Persist/trace | Response metadata | Messages, source links, trace/tokens/cost | Redaction and retention policy | User-safe retry with correlation ID | T044 |
| Evaluate | Two PDFs + known questions | Grounding report | Supported/unsupported/leakage/injection suite | Sprint 2 not accepted on critical failure | T049-T051 |

MVP RAG quality gates:

- All citations resolve to a current course document chunk and page.
- Zero cross-course source leakage in the evaluation suite.
- Unsupported questions use explicit no-answer behavior.
- Prompt injection does not reveal system instructions or bypass course grounding.
- Text/token/cost logs follow the approved retention/redaction policy.
- Scanned PDF failure is transparent; OCR is not implied.

## 18. Agent Delivery Plan

### Proactive Proctor

```text
Accepted learning event
   -> validate identity/course/event schema
   -> apply versioned threshold/rule window
   -> no trigger: record nothing or a compact evaluated marker
   -> trigger: create weak-concept signal with evidence IDs
   -> retrieve active course sources
   -> generate/validate 3-5 objective questions (or reviewed fallback)
   -> persist mini quiz + progress report
   -> notify student/teacher
   -> write agent log and `mini_quiz_generated`
```

Committed trigger inputs: explicit difficulty signal, low objective quiz score, repeated questions mapped to one concept, and low lesson completion. The canonical demo uses an objective quiz score below 60%; other rules may be tested but do not block the demo. Rules must be idempotent and cannot suspend enrollment.

### Analytics & Store Agent

| Allowed intent | Inputs | Controlled function | Response shape |
|---|---|---|---|
| `revenue_for_period` | teacher ID from session, from/to dates | `getTeacherRevenue()` | intent, range, amount, currency, successful orders, as-of, trace ID |
| `successful_order_count` | teacher ID, from/to dates | `getSuccessfulOrderCount()` | intent, range, count, as-of, trace ID |
| `best_selling_courses` | teacher ID, from/to dates, bounded limit | `getBestSellingCourses()` | intent, range, ranked course IDs/titles, units/revenue, currency, trace ID |

Agent controls:

- Session determines teacher identity; the prompt cannot override ownership.
- Dates are normalized in Africa/Cairo, bounded to 366 days, and returned to the user.
- Currency is EGP unless product changes the decision; formatting occurs after numeric aggregation.
- Unsupported/ambiguous questions return examples and execute no aggregate function.
- Empty data returns a successful zero/empty answer, not invented business insight.
- Every run logs normalized intent, safe parameters, function/version, duration, row count, and status.
- Open-ended natural-language SQL and predictive recommendations are POST-MVP.

## 19. Checkout and Sales Analytics Plan

Order state model for MVP: `draft -> processing -> paid` or `draft/processing -> failed`. A successful confirmation and optional enrollment occur in one transaction or compensating-safe workflow. Each confirmation requires an idempotency key.

| Concern | MVP decision |
|---|---|
| Payment | Deterministic test adapter; no real card fields or funds |
| Price | Server course/order price only; client display is non-authoritative |
| Money | Integer minor units or exact decimal; never binary float |
| Currency/timezone | EGP and Africa/Cairo; half-open internal date ranges `[from, to)` |
| Source of truth | PostgreSQL paid orders and items |
| GA4 | Behavioral reporting only; reconciled but not accounting truth |
| Security | Auth, ownership/eligibility, validation, rate limits, idempotency, redacted logs |
| Gap-filled UI | Team-authored screens reuse `ui5` tokens/components and pass story review; no external approval gate |

Sales fixture examples:

- Paid: Order A, Course 1, EGP 1,000; Order B, Course 1, EGP 1,000; Order C, Course 2, EGP 750.
- Failed: Order D, Course 2, EGP 750; excluded from revenue/count.
- Expected period answer: revenue EGP 2,750; 3 successful orders; Course 1 best-selling with 2 units and EGP 2,000.
- Previous period/high-view-low-conversion remain COULD and must not block the base three intents.

## 20. Testing Strategy

| Layer | Required coverage | Sprint gate |
|---|---|---|
| Static/unit | validation, auth helpers, progress/attendance rules, grading, chunk metadata, parser, idempotency, event schemas | Every story |
| API/integration | sessions/RBAC, ownership, migrations, upload lifecycle, Chroma filtering, orders, aggregates, agent logs | S1/S2/S3 review |
| RAG evaluation | supported/no-answer, citation page, cross-course isolation, injection, timeout | Sprint 2 exit |
| Browser/component | role shell, course flow, lesson, quiz, chat, checkout, sales, notifications, logs | Story DoD |
| E2E | canonical teacher upload -> student learning/Tutor -> proctor -> checkout -> teacher analytics/logs | Sprint 3 release |
| Visual/responsive | RTL at 390/768/1024/1440; light/dark; loading/empty/error/unauthorized; no overlap | S1 baseline and S3 regression |
| Accessibility | keyboard, focus, labels/names, dialog focus, contrast spot check, reduced motion | Core routes |
| Security/privacy | role bypass, file spoofing, injection, rate limit, payload/log denylist, order price/idempotency | Relevant story + release |
| Operational | clean migration, seed reset, dependency health, failure/retry, correlation IDs | Release gate |

Defect priorities:

- Severity 1: data leak, auth bypass, false purchase/revenue, cross-course RAG leak, unrecoverable demo blocker. Stop feature work.
- Severity 2: core path failure, lost progress, invalid citation, duplicate intervention/order. Fix before release.
- Severity 3: non-core visual/behavior defect with workaround. Fix from buffer or document.
- Severity 4: polish/deferred behavior. Move to backlog.

## 21. Security and Privacy Checklist

- [ ] Passwords use an established slow hash; sessions are revocable and cookies use reviewed flags.
- [ ] Login, Tutor, upload, checkout, and analytics endpoints have rate limits.
- [ ] Server enforces role, course ownership, enrollment, and object-level authorization.
- [ ] Inputs use schemas, length/range bounds, and safe error messages.
- [ ] PDFs are checked by signature/MIME/size, stored outside public paths, and use generated keys.
- [ ] Course/version filters are mandatory at vector retrieval, with automated leakage tests.
- [ ] Prompt templates are server-owned; retrieved text is treated as untrusted content.
- [ ] Tutor no-answer/citation validation prevents unsupported answers from appearing grounded.
- [ ] Agents have allowlisted actions/functions and least-privilege credentials; no arbitrary SQL.
- [ ] Proctor cannot suspend, punish, or message guardians automatically in MVP.
- [ ] Checkout validates server price, uses exact money types, idempotency, and no real card data.
- [ ] Order DB, not GA4, is revenue truth.
- [ ] `dataLayer` excludes PII, free text, source text, quiz answers, and payment secrets.
- [ ] Logs redact tokens, credentials, prompts/source content, PII, and internal stack traces from users.
- [ ] Correlation IDs support tracing without exposing secrets.
- [ ] Seed credentials and API keys are environment values, never committed.
- [ ] Soft-deleted/archived records are consistently excluded.
- [ ] Demo/test data is clearly synthetic and resettable.
- [ ] Data retention for chat, source text, logs, and model-provider requests is documented.
- [ ] Dependency and license/security checks run before release where the chosen stack supports them.

## 22. Definition of Ready

A story may enter a sprint only when:

- The user/demo outcome, scope label, owner, reviewer, points, and hours are present.
- Given/When/Then acceptance criteria include success and relevant failure/unauthorized states.
- UI source is linked; gap-filled routes name the reused `ui5` patterns and responsive states.
- API/data contract and migration impact are understood enough to begin.
- Analytics/privacy impact is listed, including “none” where appropriate.
- Tasks are 2-8 hours, assigned, dependency-ordered, and total to the story estimate.
- Required credentials/fixtures/decisions are available or a tested fallback is agreed.
- Dependencies are complete or scheduled early enough within the sprint.
- Test approach and demo evidence are defined.
- The team confirms the story fits capacity without consuming contingency.

## 23. Definition of Done

A committed story is Done only when:

- [ ] All acceptance criteria pass against integrated code, not isolated mocks.
- [ ] Every subtask is complete and the story estimate/actuals are updated.
- [ ] Primary owner self-tests and a different reviewer approves.
- [ ] Unit/integration/browser tests appropriate to risk pass.
- [ ] Loading, empty, success, error, unauthorized, and mobile states are handled where relevant.
- [ ] RTL Arabic layout and approved `ui5/` patterns are checked at target viewports.
- [ ] Server-side authorization, validation, privacy, and logging are reviewed.
- [ ] Analytics events and payload privacy are tested, or analytics is marked not applicable.
- [ ] Migrations/seeds are repeatable and no secrets are committed.
- [ ] API/runbook/decision documentation is updated.
- [ ] The visible demo outcome is demonstrated in Sprint Review.
- [ ] No unresolved Severity 1/2 defect remains for the story.

## 24. Daily Scrum Template

```md
## Daily Scrum — YYYY-MM-DD

Sprint goal confidence: Green / Amber / Red

| Person | Completed since last Scrum | Next work | Blocker/decision | Help/review needed |
|---|---|---|---|---|
| Elgendy | | | | |
| Albraa | | | | |
| Nabile | | | | |
| Habsa | | | | |
| Seif | | | | |

Critical-path change:
Integration/test status:
Scope or capacity action:
```

## 25. Sprint Planning Template

```md
## Sprint N Planning — Date

Sprint goal:
Gross capacity:
Planned hours:
Buffer hours:
Known absences:

Committed stories:
- [ ] Story ID — outcome — owner — points/hours

Decisions confirmed:
Dependencies ready:
Risks and mitigations:
Review pairs:
Demo slice:
Carry-over removed/traded:
```

## 26. Sprint Review Template

```md
## Sprint N Review — Date

Sprint goal: Met / Partially met / Not met

Demonstrated outcomes:
- Story ID — evidence/result

Not completed:
- Story ID — remaining criteria — revised estimate — tradeoff

Metrics:
- Planned vs completed hours:
- Stories accepted:
- Defects by severity:
- RAG/event/order checks where applicable:

Stakeholder feedback:
Backlog changes:
Decisions required before next sprint:
```

## 27. Sprint Retrospective Template

```md
## Sprint N Retrospective — Date

Keep:
-

Improve:
-

Stop:
-

Start:
-

Data considered:
- Goal outcome, cycle time, blocked time, defects, review delay, buffer used

Actions (maximum three):
| Action | Owner | Due date | Success measure |
|---|---|---|---|
| | | | |
```

## 28. Jira Copy-Paste Ticket Blocks

The following blocks repeat every committed MVP story as standalone Jira-ready content. Assignments are Provisional.

### CF-US-001 — Build the responsive CourseFlix application shell

**Issue Type:** Story  
**Epic:** CF-EPIC-01  
**Sprint:** Sprint 1  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Elgendy  
**Reviewer:** Nabile  
**Story Points:** 5  
**Estimated Hours:** 18  
**Dependencies:** Confirmed React + TypeScript + Vite baseline  
**Blockers/Decisions:** None; port generated tokens/components into React without treating generated HTML as the app architecture.

**User Story**  
As a CourseFlix user, I want a responsive role-aware application shell matching the approved prototype, so that navigation remains familiar on desktop and mobile.

**Description**  
Build route-ready Arabic RTL student/teacher shells, design tokens, reusable controls/states, theme persistence, and responsive navigation from all 14 `ui5/` screens.

**Acceptance Criteria**

1. Given either role, when the app opens, then correct identity, navigation, active route, and top bar render.
2. Given 390/768/1024/1440 widths, when core shells render, then controls/content remain usable with no overlap.
3. Given a saved theme, when the app reloads, then the selection and approved tokens persist.
4. Given loading, empty, error, or unauthorized content, when requested, then an accessible reusable state renders.

**Technical Notes:** Use React Router and TanStack Query; preserve focus-visible, reduced motion, RTL, and data-driven role navigation.  
**UI Source:** `ui5/build.py` and all generated screens.  
**API/Data:** `GET /me` bootstrap contract and route role metadata.  
**Analytics:** `page_view` hook; implementation by Seif in CF-TASK-061/062.  
**Test Cases:** role nav, RTL keyboard, theme persistence, four viewports, unauthorized state.

**Subtasks**

- [ ] CF-TASK-001 — Inventory routes, tokens, components, and states — Elgendy — 4h — Dependency: None — Deliverable: checked inventory/token map — Validate against 14 screens
- [ ] CF-TASK-002 — Implement role-aware shell and route configuration — Elgendy — 6h — Dependency: T001/T021 — Deliverable: route frame — Validate component/nav tests
- [ ] CF-TASK-003 — Implement responsive reusable UI primitives — Nabile — 4h — Dependency: T001/T021 — Deliverable: control/state library — Validate fixture harness
- [ ] CF-TASK-004 — Add accessibility and responsive state checks — Habsa — 4h — Dependency: T002-T003 — Deliverable: test evidence — Validate keyboard and target viewports

**Definition of Done**

- [ ] Reviewed by Nabile
- [ ] Shell tests and target viewport checks passed
- [ ] Responsive UI checked against `ui5/`
- [ ] Loading/empty/error/unauthorized states handled
- [ ] Documentation updated

---

### CF-US-002 — Authenticate users and enforce role access

**Issue Type:** Story  
**Epic:** CF-EPIC-02  
**Sprint:** Sprint 1  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Albraa  
**Reviewer:** Seif  
**Story Points:** 8  
**Estimated Hours:** 24  
**Dependencies:** CF-US-001, CF-US-003  
**Blockers/Decisions:** None; use Argon2id, opaque PostgreSQL-backed sessions, HTTP-only same-site cookies, and NestJS throttling.

**User Story**  
As a student or teacher, I want to sign in securely and access only routes allowed for my role, so that course and learner data are protected.

**Description**  
Replace prototype email-string routing with server credentials, password verification, revocable sessions, current-user bootstrap, logout, RBAC, and abuse controls.

**Acceptance Criteria**

1. Given valid credentials, when signing in, then a secure session and correct dashboard are returned.
2. Given invalid credentials, when submitted, then a generic error appears and no session is created.
3. Given a student requests a teacher route/API, when authorized, then 403 and the unauthorized UI are returned.
4. Given expired/revoked session or logout, when protected data is requested, then access ends without data exposure.

**Technical Notes:** HTTP-only reviewed cookies, established password hash, login rate limit, no token/password logs.  
**UI Source:** `ui5/index.html`, role shells in `ui5/build.py`.  
**API/Data:** `POST /auth/login`, `POST /auth/logout`, `GET /me`; `users`, `sessions`.  
**Analytics:** No PII-bearing login event.  
**Test Cases:** both roles, wrong password, validation, role bypass, expiry, logout, rate limit.

**Subtasks**

- [ ] CF-TASK-005 — Implement password verification and session endpoints — Albraa — 6h — Dependency: T009/T011 — Deliverable: auth API — Validate integration tests
- [ ] CF-TASK-006 — Connect login and session bootstrap UI — Elgendy — 5h — Dependency: T005/US001 — Deliverable: real login/errors/logout — Validate browser tests
- [ ] CF-TASK-007 — Add server/client role authorization guards — Albraa — 6h — Dependency: T005 — Deliverable: RBAC — Validate direct forbidden requests
- [ ] CF-TASK-008 — Add auth abuse, expiry, and regression tests — Seif — 7h — Dependency: T005-T007 — Deliverable: auth suite — Validate automated matrix

**Definition of Done**

- [ ] Reviewed by Seif
- [ ] Credentials stored outside source
- [ ] RBAC, expiry, logout, and rate-limit tests passed
- [ ] Generic accessible errors handled
- [ ] Cookie/session policy documented

---

### CF-US-003 — Establish the transactional data and course API baseline

**Issue Type:** Story  
**Epic:** CF-EPIC-01  
**Sprint:** Sprint 1  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Albraa  
**Reviewer:** Habsa  
**Story Points:** 5  
**Estimated Hours:** 20  
**Dependencies:** Confirmed NestJS + PostgreSQL + TypeORM baseline  
**Blockers/Decisions:** None; adapt and validate `schema.sql` as TypeORM migrations.

**User Story**  
As the delivery team, we want versioned transactional data and stable course APIs, so that parallel work shares one reliable contract.

**Description**  
Adapt MVP-relevant `schema.sql` entities into migrations, seed deterministic users/course content, and expose enrolled/owned course read/update contracts.

**Acceptance Criteria**

1. Given an empty database, when migration/seed runs, then the complete seeded course fixture exists.
2. Given an enrolled student, when course APIs run, then only active enrolled data returns.
3. Given the owning teacher, when valid course fields update, then validated changes persist.
4. Given a reset, when setup reruns, then the same demonstrable state is restored.

**Technical Notes:** Use NestJS feature modules and TypeORM migrations; preserve UUIDs/soft delete; defer knowledge graph; review rigid enums.  
**UI Source:** student and teacher dashboard/course screens.  
**API/Data:** core migrations; `GET /courses`, `GET /courses/:id`, `PATCH /teacher/courses/:id`.  
**Analytics:** Stable IDs feed later contracts.  
**Test Cases:** clean migration, reset, enrollment/ownership, invalid update, soft delete.

**Subtasks**

- [ ] CF-TASK-009 — Adapt core PostgreSQL schema into migrations — Albraa — 6h — Dependency: T021/DB decision — Deliverable: migrations — Validate clean rebuild
- [ ] CF-TASK-010 — Implement course read/update API contracts — Seif — 6h — Dependency: T009 — Deliverable: endpoints — Validate API tests
- [ ] CF-TASK-011 — Create deterministic teacher/student/course seed — Nabile — 4h — Dependency: T009 — Deliverable: fixture — Validate repeated reset
- [ ] CF-TASK-012 — Add ownership/enrollment/soft-delete tests — Habsa — 4h — Dependency: T010-T011 — Deliverable: access suite — Validate positive/negative cases

**Definition of Done**

- [ ] Reviewed by Habsa
- [ ] Migrations and reset seed repeat successfully
- [ ] Authorization and validation tests passed
- [ ] No fixture secrets committed
- [ ] Contract examples documented

---

### CF-US-004 — Let a student browse and open enrolled courses

**Issue Type:** Story  
**Epic:** CF-EPIC-03  
**Sprint:** Sprint 1  
**Priority:** High  
**Scope:** MUST — Committed MVP  
**Assignee:** Habsa  
**Reviewer:** Elgendy  
**Story Points:** 5  
**Estimated Hours:** 18  
**Dependencies:** CF-US-001-CF-US-003  
**Blockers/Decisions:** Public catalog/enrollment excluded; use pre-enrolled fixture.

**User Story**  
As an enrolled student, I want to see my courses and open their content, so that I can continue learning from the correct lesson.

**Description**  
Implement dashboard, enrolled-course filters, and course details from real APIs with explicit standard states and deferred labels for non-MVP tabs.

**Acceptance Criteria**

1. Given seeded student, when dashboard opens, then real enrollment/progress summary loads.
2. Given course filters, when changed, then matching enrolled courses remain accessible.
3. Given enrolled course, when opened, then lessons/documents/quizzes show real status and links.
4. Given loading, empty, failure, or forbidden course, when rendered, then the correct state appears.

**Technical Notes:** Use stable route IDs and server authorization; do not implement public enrollment.  
**UI Source:** `ui5/dashboard.html`, `courses.html`, `course.html`.  
**API/Data:** `GET /student/dashboard`, `GET /courses`, `GET /courses/:id`.  
**Analytics:** Hooks for `view_item_list`, `select_item`, `view_item`.  
**Test Cases:** normal/empty/filter/loading/error/deep link/forbidden/mobile.

**Subtasks**

- [ ] CF-TASK-013 — Implement student dashboard with real summaries — Habsa — 5h — Dependency: US001-US003 — Deliverable: dashboard — Validate browser/API fixture
- [ ] CF-TASK-014 — Implement catalog and course-detail routes — Habsa — 6h — Dependency: T013 — Deliverable: routes — Validate route tests
- [ ] CF-TASK-015 — Integrate filters and content summaries — Nabile — 4h — Dependency: T014 — Deliverable: data tabs/filters — Validate interactions
- [ ] CF-TASK-016 — Add empty/error/forbidden/mobile coverage — Elgendy — 3h — Dependency: T013-T015 — Deliverable: state evidence — Validate automated viewports

**Definition of Done**

- [ ] Reviewed by Elgendy
- [ ] Real API data replaces mock page data
- [ ] Route authorization tests passed
- [ ] Standard and responsive states checked against `ui5/`
- [ ] Event hooks documented

---

### CF-US-005 — Let a teacher manage a seeded course

**Issue Type:** Story  
**Epic:** CF-EPIC-04  
**Sprint:** Sprint 1  
**Priority:** High  
**Scope:** MUST — Committed MVP  
**Assignee:** Nabile  
**Reviewer:** Albraa  
**Story Points:** 5  
**Estimated Hours:** 20  
**Dependencies:** CF-US-001-CF-US-003  
**Blockers/Decisions:** None; course-creation design may be filled by the team, but the feature remains SHOULD and the committed MVP manages one seeded course.

**User Story**  
As a teacher, I want to view my dashboard and manage my seeded course, so that I can prepare the lesson and source document used in the demo.

**Description**  
Connect teacher dashboard/course management to real owned data and safe metadata edits; disable or defer uncommitted live, grading, and suspension actions.

**Acceptance Criteria**

1. Given seeded teacher, when dashboard opens, then owned counts/actions use real data or zero states.
2. Given course management, when opened, then content/status/student count are owned-course scoped.
3. Given valid metadata edits, when saved, then changes persist with success feedback.
4. Given foreign course/invalid input, when submitted, then it is rejected accessibly.

**Technical Notes:** File upload is CF-US-009; no live infrastructure, AI homework grading, or suspension.  
**UI Source:** `ui5/teacher-dashboard.html`, `teacher-course.html`.  
**API/Data:** `GET /teacher/dashboard`, `GET/PATCH /teacher/courses/:id`.  
**Analytics:** `cta_click` hooks.  
**Test Cases:** ownership, zero state, valid/invalid edit, forbidden, deferred actions, mobile.

**Subtasks**

- [ ] CF-TASK-017 — Connect teacher dashboard summaries/actions — Nabile — 5h — Dependency: US001-US003 — Deliverable: teacher dashboard — Validate fixtures
- [ ] CF-TASK-018 — Implement seeded course management UI — Nabile — 6h — Dependency: T017 — Deliverable: course tabs/edits — Validate browser tests
- [ ] CF-TASK-019 — Add teacher ownership/update API — Albraa — 5h — Dependency: US003 — Deliverable: endpoints — Validate authorization tests
- [ ] CF-TASK-020 — Integrate role shell and cross-review flow — Elgendy — 4h — Dependency: T017-T019 — Deliverable: reviewed teacher path — Validate RTL/mobile smoke

**Definition of Done**

- [ ] Reviewed by Albraa
- [ ] Real owned data and edits integrated
- [ ] Fake approval/suspension behavior removed or disabled
- [ ] Standard states and role shell tested
- [ ] Limitations documented

---

### CF-US-006 — Establish development, test, and API contract baselines

**Issue Type:** Story  
**Epic:** CF-EPIC-15  
**Sprint:** Sprint 1  
**Priority:** High  
**Scope:** MUST — Committed MVP  
**Assignee:** Seif  
**Reviewer:** Habsa  
**Story Points:** 3  
**Estimated Hours:** 10  
**Dependencies:** Confirmed React/NestJS/PostgreSQL/Redis/Chroma baseline  
**Blockers/Decisions:** Deployment target may remain open; local reproducibility is mandatory.

**User Story**  
As a delivery team, we want one documented run/test workflow and stable API contracts, so that five people can integrate without environment drift.

**Description**  
Provide environment templates, service startup, quality commands, API conventions, and an authenticated course smoke test without committed secrets.

**Acceptance Criteria**

1. Given a clean supported machine, when setup runs, then app/database/tests start without source secrets.
2. Given a contract break, when checks run, then tests/examples fail visibly.
3. Given the seed, when smoke runs, then login and course read succeed.

**Technical Notes:** Use npm workspaces for React web, NestJS API/worker, and OpenAPI-generated shared API types; separate required/optional AI/GTM values.  
**UI Source:** No new design.  
**API/Data:** environment schema, health endpoint, contract examples, seed.  
**Analytics:** None.  
**Test Cases:** missing env, clean startup, health fail, seed smoke, lint/unit commands.

**Subtasks**

- [ ] CF-TASK-021 — Scaffold React/NestJS workspace and local services — Seif — 3h — Dependency: None — Deliverable: npm workspace plus PostgreSQL/Redis/Chroma environment — Validate clean startup
- [ ] CF-TASK-022 — Configure lint/unit/integration/browser commands — Seif — 3h — Dependency: T021 — Deliverable: quality commands — Validate intentional fail/pass
- [ ] CF-TASK-023 — Document API conventions/examples — Habsa — 2h — Dependency: US003 draft — Deliverable: API reference — Validate peer review
- [ ] CF-TASK-024 — Add authenticated course smoke test — Seif — 2h — Dependency: US002-US003 — Deliverable: smoke — Validate reset-to-assertion run

**Definition of Done**

- [ ] Reviewed by Habsa
- [ ] Setup confirmed by a second team member
- [ ] Baseline checks pass
- [ ] No secret values committed
- [ ] API/run commands documented

---

### CF-US-007 — Track lesson watch progress and attendance

**Issue Type:** Story  
**Epic:** CF-EPIC-05  
**Sprint:** Sprint 2  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Elgendy  
**Reviewer:** Albraa  
**Story Points:** 5  
**Estimated Hours:** 18  
**Dependencies:** CF-US-002-CF-US-004; seeded video  
**Blockers/Decisions:** None; use a configuration-driven 70% attendance threshold.

**User Story**  
As an enrolled student, I want my unique lesson watch progress saved, so that I can resume learning and receive attendance credit.

**Description**  
Use real media events and bounded heartbeats to persist monotonic progress and derive idempotent attendance server-side.

**Acceptance Criteria**

1. Given a playable lesson, when opened/played, then it resumes saved position and records a session.
2. Given valid progress, when heartbeats arrive, then position/percentage persist without decreasing.
3. Given threshold crossing, when evaluated, then attendance is awarded once.
4. Given seek/replay/duplicate/foreign requests, when processed, then progress is not inflated or crossed between users.
5. Given media/API failure, when shown, then progress remains intact and retry is available.

**Technical Notes:** Server authoritative; basic anti-inflation, not device-grade anti-fraud.  
**UI Source:** `ui5/lesson.html`, course/progress bars.  
**API/Data:** lesson read/progress endpoint; `content_progress`, `attendance`, video metadata.  
**Analytics:** `lesson_*` and `video_*` milestone events.  
**Test Cases:** resume, threshold, duplicate, seek/replay, unauthorized, media/API failure, mobile.

**Subtasks**

- [ ] CF-TASK-025 — Integrate media events and resume UI — Elgendy — 6h — Dependency: seeded media — Deliverable: player — Validate browser media test
- [ ] CF-TASK-026 — Implement throttled progress API — Albraa — 5h — Dependency: US003 — Deliverable: persistence — Validate sequence/idempotency
- [ ] CF-TASK-027 — Implement configuration-driven 70% attendance evaluation — Albraa — 3h — Dependency: T026 — Deliverable: attendance rule — Validate boundary/duplicate
- [ ] CF-TASK-028 — Add playback/auth/failure tests — Seif — 4h — Dependency: T025-T027 — Deliverable: lesson suite — Validate automated matrix

**Definition of Done**

- [ ] Reviewed by Albraa
- [ ] Progress persists after reload
- [ ] Attendance/idempotency tests pass
- [ ] Analytics hooks and error/mobile states checked
- [ ] Threshold documented

---

### CF-US-008 — Submit and grade a basic quiz

**Issue Type:** Story  
**Epic:** CF-EPIC-06  
**Sprint:** Sprint 2  
**Priority:** High  
**Scope:** MUST — Committed MVP  
**Assignee:** Nabile  
**Reviewer:** Habsa  
**Story Points:** 5  
**Estimated Hours:** 14  
**Dependencies:** CF-US-002-CF-US-004; seeded quiz  
**Blockers/Decisions:** Short-answer AI grading excluded.

**User Story**  
As an enrolled student, I want to answer and submit an objective quiz, so that I receive a saved result and the system can identify difficulty.

**Description**  
Retrieve a published MCQ/true-false quiz, hide keys, persist one submission and answers, and grade deterministically on the server.

**Acceptance Criteria**

1. Given available quiz, when opened, then questions render without answer keys.
2. Given valid answers, when submitted, then answers/result persist and server computes score.
3. Given duplicate/closed/foreign quiz, when requested, then configured access rule and clear error apply.
4. Given success, when reloaded, then result remains visible.

**Technical Notes:** Never trust client score/keys; short answers remain ungraded/deferred.  
**UI Source:** `ui5/quiz.html`, course quiz tab.  
**API/Data:** quiz read/submit; quizzes/questions/submissions/answers.  
**Analytics:** `quiz_start`, `quiz_submit`, `quiz_complete`; no answer text.  
**Test Cases:** correct/incorrect/partial, key hiding, duplicate, closed, unauthorized, reload.

**Subtasks**

- [ ] CF-TASK-030 — Implement quiz read/submission API — Nabile — 4h — Dependency: US003 — Deliverable: endpoints — Validate contract tests
- [ ] CF-TASK-031 — Implement objective server grading — Nabile — 3h — Dependency: T030 — Deliverable: persisted score — Validate unit tests
- [ ] CF-TASK-029 — Bind quiz form/result to API — Habsa — 4h — Dependency: T030 — Deliverable: quiz route — Validate browser interaction
- [ ] CF-TASK-032 — Add access/duplicate/result tests — Habsa — 3h — Dependency: T029-T031 — Deliverable: quiz suite — Validate automated cases

**Definition of Done**

- [ ] Reviewed by Habsa
- [ ] Server grading and persistence pass
- [ ] Answer keys do not leak
- [ ] Accessible result/error states work
- [ ] Event hooks tested

---

### CF-US-009 — Upload a PDF and show processing status

**Issue Type:** Story  
**Epic:** CF-EPIC-07  
**Sprint:** Sprint 2  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Nabile  
**Reviewer:** Seif  
**Story Points:** 5  
**Estimated Hours:** 14  
**Dependencies:** CF-US-005-CF-US-006; storage decision  
**Blockers/Decisions:** None; use a 20 MB limit and local persistent storage behind a replaceable adapter.

**User Story**  
As a teacher, I want to upload a PDF and see its processing state, so that I know when it can ground Tutor answers.

**Description**  
Implement authorized PDF-only upload, signature/MIME/size checks, storage, checksum/version/job records, lifecycle polling, failure, and retry.

**Acceptance Criteria**

1. Given owned course/valid PDF, when uploaded, then records/job are created and pending appears.
2. Given invalid/spoofed/empty/oversized file, when submitted, then it is rejected before ingestion.
3. Given job updates, when Files reloads/polls, then current lifecycle state renders.
4. Given failure/retry, when selected, then processing retries without duplicate active version.
5. Given non-owner, when upload/status requested, then access is denied.

**Technical Notes:** Generated storage keys, safe names, no public path, extension is not trusted, PDF only.  
**UI Source:** Files tab in `ui5/teacher-course.html`.  
**API/Data:** upload/list/retry endpoints; `files`, `documents`, `ai_jobs`.  
**Analytics:** Privacy-safe upload `cta_click`; no filename.  
**Test Cases:** valid, spoofed, empty/large, duplicate/version, ownership, state/retry.

**Subtasks**

- [ ] CF-TASK-033 — Connect PDF upload/progress UI — Nabile — 4h — Dependency: US005 — Deliverable: upload interaction — Validate browser fixture
- [ ] CF-TASK-034 — Implement validation/storage/records — Nabile — 4h — Dependency: storage decision — Deliverable: upload API — Validate security tests
- [ ] CF-TASK-035 — Implement status polling/retry UI — Elgendy — 3h — Dependency: T034 — Deliverable: lifecycle states — Validate simulated transitions
- [ ] CF-TASK-036 — Add upload security/lifecycle tests — Nabile — 3h — Dependency: T033-T035 — Deliverable: suite — Validate valid/invalid cases

**Definition of Done**

- [ ] Reviewed by Seif
- [ ] Validation, ownership, status, and retry tests pass
- [ ] State survives reload
- [ ] Storage/config documented
- [ ] PDF-only limitation visible

---

### CF-US-010 — Process and index course PDF content

**Issue Type:** Story  
**Epic:** CF-EPIC-07  
**Sprint:** Sprint 2  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Habsa  
**Reviewer:** Albraa  
**Story Points:** 8  
**Estimated Hours:** 20  
**Dependencies:** CF-US-009; embeddings; ChromaDB; test PDF  
**Blockers/Decisions:** Embedding credentials/model are external; use 800-token chunks, 120 overlap, BullMQ, and metadata-filtered Chroma.

**User Story**  
As a teacher, I want an uploaded PDF converted into course-isolated searchable chunks, so that Tutor answers use only active course material.

**Description**  
Build extraction, page-aware chunking, embeddings, Chroma upsert, active-version filters, status/error stages, idempotency, and retry.

**Acceptance Criteria**

1. Given valid PDF job, when processed, then non-empty page-referenced chunks are persisted/indexed.
2. Given vectors, when stored, then course/document/version/chunk/page metadata is present.
3. Given two courses, when one is retrieved, then no other-course vector returns.
4. Given stage failure, when stopped, then stage/error/attempt log and retry state persist.
5. Given replacement version, when active, then old chunks are excluded.

**Technical Notes:** Structured parser, deterministic IDs, bounded batches, idempotent upserts; no knowledge graph.  
**UI Source:** document lifecycle rows in `ui5/teacher-course.html`.  
**API/Data:** worker lifecycle; document/chunk/job tables; Chroma metadata.  
**Analytics:** Operational timings only; no source text.  
**Test Cases:** digital PDF, blank/scanned, retry, duplicate, version replacement, leakage.

**Subtasks**

- [ ] CF-TASK-037 — Implement PDF extraction stage — Habsa — 5h — Dependency: T034/T049 — Deliverable: page text — Validate digital/blank fixtures
- [ ] CF-TASK-038 — Implement chunking/embeddings — Habsa — 5h — Dependency: T037/model — Deliverable: vectors/metadata — Validate snapshot/mock
- [ ] CF-TASK-039 — Implement Chroma upsert/course filters — Albraa — 6h — Dependency: T038 — Deliverable: isolated index — Validate two-course leakage
- [ ] CF-TASK-040 — Connect stages/retry/idempotency/status — Elgendy — 4h — Dependency: T037-T039 — Deliverable: worker lifecycle — Validate failure/replay

**Definition of Done**

- [ ] Reviewed by Albraa
- [ ] Known fixture indexes reproducibly
- [ ] Citation metadata and active version exist
- [ ] Isolation/retry tests pass
- [ ] Stage logs are traceable

---

### CF-US-011 — Ask the grounded AI Tutor with citations

**Issue Type:** Story  
**Epic:** CF-EPIC-08  
**Sprint:** Sprint 2  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Seif  
**Reviewer:** Nabile  
**Story Points:** 8  
**Estimated Hours:** 24  
**Dependencies:** CF-US-010; model credentials; student chat route  
**Blockers/Decisions:** Answer-model credentials are external; use top-k 5, configurable threshold, Arabic grounded prompt, and metadata-only operational logs.

**User Story**  
As an enrolled student, I want to ask a course question and see the source used, so that I can trust the answer is based on teacher material.

**Description**  
Implement scoped chat/message persistence, retrieval, guarded prompt, answer/no-answer, citations, retries, and privacy-safe traces.

**Acceptance Criteria**

1. Given supported question, when asked, then grounded answer has a valid document/page citation.
2. Given weak/no evidence, when asked, then Tutor explicitly declines without fake citation.
3. Given injection/cross-course request, when processed, then instructions/content remain protected and response declines/stays grounded.
4. Given citation, when resolved, then it maps to an accessible active source chunk.
5. Given provider failure, when shown, then safe retry and redacted trace/token/cost log exist.

**Technical Notes:** Server templates, delimited untrusted context, token caps, retrieval threshold, citation validation.  
**UI Source:** `ui5/assistant.html` and assistant entry actions.  
**API/Data:** Tutor message/history endpoints; chat/source tables; Chroma; agent/activity logs.  
**Analytics:** `ai_tutor_question/answer` with IDs/status/count/bands, never content.  
**Test Cases:** supported, unsupported, leakage, injection, citation, timeout, rate limit, long/unauthorized.

**Subtasks**

- [ ] CF-TASK-041 — Implement scoped retrieval/message API — Elgendy — 6h — Dependency: US010 — Deliverable: Tutor endpoint — Validate grounded fixtures
- [ ] CF-TASK-042 — Implement guarded prompt/threshold/no-answer — Nabile — 6h — Dependency: T041/model — Deliverable: policy module — Validate unsupported/injection
- [ ] CF-TASK-043 — Connect chat/citation/retry UI — Elgendy — 6h — Dependency: T041-T042 — Deliverable: real chat — Validate browser/mobile states
- [ ] CF-TASK-044 — Persist citations and safe trace/token/cost logs — Seif — 6h — Dependency: T041-T042 — Deliverable: sources/traces — Validate DB/log reconciliation

**Definition of Done**

- [ ] Reviewed by Nabile
- [ ] Grounded and no-answer fixtures pass
- [ ] Cross-course/injection checks pass
- [ ] Citations resolve
- [ ] Privacy-safe telemetry and responsive states verified

---

### CF-US-012 — Receive and manage essential in-app notifications

**Issue Type:** Story  
**Epic:** CF-EPIC-13  
**Sprint:** Sprint 2  
**Priority:** Medium  
**Scope:** MUST — Committed MVP  
**Assignee:** Albraa  
**Reviewer:** Elgendy  
**Story Points:** 3  
**Estimated Hours:** 8  
**Dependencies:** CF-US-002, CF-US-009; Sprint 2 document producer hook, with intervention production completed in CF-US-014  
**Blockers/Decisions:** In-app only; fix role-aware shared page.

**User Story**  
As a CourseFlix user, I want essential processing and intervention notifications in the app, so that I can act without email.

**Description**  
Implement list, unread count/filter, mark read/all, role-correct shell, the document producer, and a reusable interface that CF-US-014 connects to proctor interventions in Sprint 3.

**Acceptance Criteria**

1. Given notifications, when listed, then only current user’s ordered records/count display.
2. Given mark one/all, when successful, then state persists and badge updates.
3. Given teacher session, when shared page opens, then teacher identity/navigation remain.
4. Given empty/API failure, when rendered, then correct state appears.

**Technical Notes:** Validate internal links; minimize sensitive previews; email excluded.  
**UI Source:** `ui5/notifications.html`, shared shell.  
**API/Data:** list/read/read-all endpoints; notifications and producer service.  
**Analytics:** None.  
**Test Cases:** isolation, ordering, unread, read one/all, empty/error, both roles, invalid link.

**Subtasks**

- [ ] CF-TASK-045 — Implement user notification endpoints — Albraa — 2h — Dependency: US002-US003 — Deliverable: APIs — Validate isolation
- [ ] CF-TASK-046 — Connect list/filter/badge/role shell — Nabile — 2h — Dependency: T045/US001 — Deliverable: page — Validate both roles
- [ ] CF-TASK-047 — Add document notification/reusable producer hooks — Elgendy — 2h — Dependency: T045 — Deliverable: document producer/service interface — Validate producer fixture
- [ ] CF-TASK-048 — Add state regression tests — Elgendy — 2h — Dependency: T045-T047 — Deliverable: coverage — Validate API/browser suite

**Definition of Done**

- [ ] Reviewed by Elgendy
- [ ] Persistence and user isolation pass
- [ ] Teacher/student shell behavior passes
- [ ] Empty/error/read states pass
- [ ] Producer interface documented

---

### CF-US-013 — Validate RAG grounding, security, and integrated learning flow

**Issue Type:** Story  
**Epic:** CF-EPIC-14  
**Sprint:** Sprint 2  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Habsa  
**Reviewer:** Seif  
**Story Points:** 5  
**Estimated Hours:** 14  
**Dependencies:** CF-US-007-CF-US-012  
**Blockers/Decisions:** None; Habsa authors the fixture set and Seif independently reviews it.

**User Story**  
As the CourseFlix team, we want repeatable safety and grounding checks, so that plausible language is not mistaken for a supported answer.

**Description**  
Create isolated PDFs/questions/injections and an integrated lesson-quiz-Tutor browser path with semantic assertions and correlation IDs.

**Acceptance Criteria**

1. Given evaluation set, when run, then supported questions cite correct pages and unsupported questions decline.
2. Given two courses, when tested, then no cross-course chunks/citations/content leak.
3. Given malicious/long/repeated/unauthorized requests, when submitted, then controls respond safely.
4. Given seeded student flow, when run, then progress, quiz, Tutor answer, and citation persist.

**Technical Notes:** Tolerant semantic assertions; do not match exact model prose or log full content.  
**UI Source:** course, lesson, quiz, assistant screens.  
**API/Data:** all Sprint 2 APIs; isolated fixtures; correlation IDs.  
**Analytics:** Verify privacy-safe hook payloads.  
**Test Cases:** five supported, five unsupported, three injection, leakage, long, unauthorized, timeout, integrated path.

**Subtasks**

- [ ] CF-TASK-049 — Create isolated PDFs/expected questions — Habsa — 4h — Dependency: US003 course IDs/approved fixture content — Deliverable: evaluation set before T037 — Validate source/page review
- [ ] CF-TASK-050 — Automate grounding/citation/no-answer eval — Seif — 4h — Dependency: T049/US011 — Deliverable: eval command — Validate report
- [ ] CF-TASK-051 — Add prompt/auth/validation/rate tests — Albraa — 3h — Dependency: US011 — Deliverable: security suite — Validate negative matrix
- [ ] CF-TASK-052 — Add lesson-quiz-Tutor E2E — Seif — 3h — Dependency: US007-US012 — Deliverable: browser flow — Validate reset run

**Definition of Done**

- [ ] Reviewed by Seif
- [ ] Team threshold met
- [ ] Zero critical leakage/no-answer failures
- [ ] Integrated flow passes from reset seed
- [ ] Evaluation report and trace IDs available

---

### CF-US-014 — Trigger a limited struggle intervention

**Issue Type:** Story  
**Epic:** CF-EPIC-09  
**Sprint:** Sprint 3  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Habsa  
**Reviewer:** Albraa  
**Story Points:** 8  
**Estimated Hours:** 20  
**Dependencies:** CF-US-007-CF-US-013  
**Blockers/Decisions:** None; canonical trigger is an objective quiz score below 60% with a versioned rule.

**User Story**  
As a teacher, I want a limited, traceable struggle signal to create a small intervention, so that I can follow up without surveillance or automatic discipline.

**Description**  
Apply deterministic event rules and create one grounded 3-5 question mini quiz, report, notification, and agent log; never suspend automatically.

**Acceptance Criteria**

1. Given approved threshold, when evaluated, then one signal records rule/version/evidence IDs.
2. Given valid concept/source, when triggered, then grounded objective mini quiz or reviewed fallback is persisted.
3. Given intervention, when viewed, then student quiz and teacher report/notification are available.
4. Given replayed events, when processed, then no duplicate active intervention is created.
5. Given weak evidence/failure, when handled, then no discipline occurs and safe skipped/failed log exists.

**Technical Notes:** Event-based only, versioned rules, separate signal from teacher action, prohibit suspension side effects.  
**UI Source:** quiz, progress, teacher dashboard/students/quizzes.  
**API/Data:** learning events; reports/quizzes/questions/notifications/student events/agent logs.  
**Analytics:** `mini_quiz_generated`, no user content.  
**Test Cases:** each trigger, below threshold, duplicate, no source, generation failure, no suspension.

**Subtasks**

- [ ] CF-TASK-053 — Implement versioned struggle rules — Habsa — 5h — Dependency: US007-US013 — Deliverable: evaluator — Validate threshold/negative tests
- [ ] CF-TASK-054 — Aggregate concept/evidence references — Habsa — 4h — Dependency: T053 — Deliverable: signal evidence — Validate fixture reconciliation
- [ ] CF-TASK-055 — Generate grounded objective mini quiz — Nabile — 5h — Dependency: T054/US010 — Deliverable: quiz/fallback — Validate sources/answers
- [ ] CF-TASK-056 — Create report/notification/log/teacher view — Habsa — 6h — Dependency: T053-T055/US012 — Deliverable: intervention — Validate E2E/idempotency

**Definition of Done**

- [ ] Reviewed by Albraa
- [ ] One trigger works end to end
- [ ] Rule/idempotency documented and tested
- [ ] Quiz/report/notification/log reconcile
- [ ] No suspension mutation exists

---

### CF-US-015 — Complete a test checkout and authoritative order

**Issue Type:** Story  
**Epic:** CF-EPIC-10  
**Sprint:** Sprint 3  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Albraa  
**Reviewer:** Seif  
**Story Points:** 5  
**Estimated Hours:** 18  
**Dependencies:** CF-US-002-CF-US-004; commerce migration is delivered inside T058  
**Blockers/Decisions:** None; gap filling is authorized and the MVP uses a deterministic test adapter, EGP, and Africa/Cairo.

**User Story**  
As a student, I want to complete a test checkout for a course, so that purchase can be demonstrated without moving real money.

**Description**  
Create gap-filled checkout/result UI, draft order, server price validation, deterministic success/decline, transactional idempotent completion, and receipt.

**Acceptance Criteria**

1. Given eligible course, when checkout opens, then server course/value/currency display.
2. Given test success, when confirmed, then one paid order/payment and stable reference persist.
3. Given duplicate confirmation, when retried, then no duplicate paid order/enrollment exists.
4. Given decline/failure, when handled, then accurate state/retry appears without false success.
5. Given success, when reconciled, then backend order fields are authoritative.

**Technical Notes:** Exact money type, no real card data, server price, idempotency; gap-filled UI must reuse existing visual language.  
**UI Source:** Authorized gap-fill route using existing `ui5` tokens/components.  
**API/Data:** draft/confirm/read order endpoints; orders/items/payments.  
**Analytics:** `begin_checkout`, `add_payment_info`, `purchase`, `checkout_error`.  
**Test Cases:** success, decline, mismatch, duplicate, unauthorized/already owned, DB failure, receipt.

**Subtasks**

- [ ] CF-TASK-057 — Build gap-filled checkout/result UI — Elgendy — 5h — Dependency: CF-US-001 — Deliverable: routes — Validate target viewports and tokens
- [ ] CF-TASK-058 — Add commerce migration/test-payment API — Albraa — 6h — Dependency: adapter/currency — Deliverable: order flow — Validate success/decline
- [ ] CF-TASK-059 — Add transaction/idempotency/truth rules — Albraa — 4h — Dependency: T058 — Deliverable: duplicate-safe completion — Validate concurrency/retry
- [ ] CF-TASK-060 — Add checkout security/integration tests — Seif — 3h — Dependency: T057-T059 — Deliverable: suite — Validate browser/API matrix

**Definition of Done**

- [ ] Reviewed by Seif
- [ ] No real payment data collected
- [ ] Transaction/idempotency tests pass
- [ ] Backend order is sole revenue truth
- [ ] Gap-filled design and responsive states reviewed against `ui5/`

---

### CF-TASK-061 — Define the versioned `dataLayer` contract and helper

**Issue Type:** Technical Task  
**Epic:** CF-EPIC-11  
**Sprint:** Sprint 1  
**Owner:** Seif  
**Estimate:** 4h  
**Dependency:** CF-US-001 route conventions and CF-US-003 ID contracts  
**Action:** Define the event dictionary, versioned push helper, ecommerce reset rule, dedup fields, and PII denylist before feature instrumentation begins.  
**Deliverable:** Tested `dataLayer` helper/schema and local event-listener fixture.  
**Validation Method:** Unit schema/denylist tests plus representative `page_view`, `view_item`, and CTA payloads.

### CF-TASK-062 — Instrument course, lesson, quiz, and Tutor events

**Issue Type:** Technical Task  
**Epic:** CF-EPIC-11  
**Sprint:** Sprint 2  
**Owner:** Seif  
**Estimate:** 4h  
**Dependency:** T061 and integrated hooks from CF-US-007, CF-US-008, CF-US-011  
**Action:** Connect confirmed course, playback, quiz, and Tutor transitions to the shared event helper without changing feature ownership.  
**Deliverable:** Verified learning/Tutor events from the section 16 MVP matrix.  
**Validation Method:** Browser listener assertions, milestone deduplication, and payload privacy denylist.

### CF-TASK-063 — Instrument proctor, checkout, and purchase events

**Issue Type:** Technical Task  
**Epic:** CF-EPIC-11  
**Sprint:** Sprint 3  
**Owner:** Seif  
**Estimate:** 4h  
**Dependency:** T061 and integrated hooks from CF-US-014 and CF-US-015  
**Action:** Connect mini-quiz generation, checkout stages, errors, and backend-confirmed purchase to the shared event helper.  
**Deliverable:** Verified proctor and commerce events with backend-sourced order values.  
**Validation Method:** Duplicate/retry checks, safe-error payload checks, and order ID/value/currency assertions.

### CF-TASK-064 — Validate GTM/GA4 privacy and order reconciliation

**Issue Type:** Technical Task  
**Epic:** CF-EPIC-11  
**Sprint:** Sprint 3  
**Owner:** Seif  
**Estimate:** 4h  
**Dependency:** T061-T063  
**Action:** Map validated events to GTM/GA4, perform Preview or local-listener QA, scan for prohibited data, and reconcile purchase to PostgreSQL orders.  
**Deliverable:** GTM mapping/test report with privacy and financial reconciliation evidence.  
**Validation Method:** GTM Preview when access exists, local fallback otherwise, payload scan, and database comparison.

---

### CF-US-016 — View teacher sales metrics from backend orders

**Issue Type:** Story  
**Epic:** CF-EPIC-12  
**Sprint:** Sprint 3  
**Priority:** High  
**Scope:** MUST — Committed MVP  
**Assignee:** Nabile  
**Reviewer:** Albraa  
**Story Points:** 5  
**Estimated Hours:** 14  
**Dependencies:** CF-US-015 and authorized `ui5/` gap-fill conventions  
**Blockers/Decisions:** None; use EGP, Africa/Cairo, and half-open internal ranges `[from, to)`.

**User Story**  
As a teacher, I want sales totals for my courses from confirmed orders, so that I can understand revenue without treating GA4 as accounting data.

**Description**  
Provide teacher-owned date-range revenue, successful order count, best-selling course, and complete UI states from backend paid orders.

**Acceptance Criteria**

1. Given range, when loaded, then only teacher-owned paid orders aggregate in configured timezone/currency.
2. Given fixtures, when displayed, then revenue/count/best seller exactly reconcile.
3. Given no paid orders, when loaded, then zero/empty state appears.
4. Given invalid/excessive/foreign range, when requested, then safe validation/permission error returns.
5. Given failed/reset orders, when calculated, then they are excluded.

**Technical Notes:** Controlled aggregate service, documented date/tie rules; GA4 excluded.  
**UI Source:** Authorized gap-fill route reusing teacher tiles/list/table.  
**API/Data:** teacher sales summary endpoint; orders/items/course ownership.  
**Analytics:** Optional `page_view` only.  
**Test Cases:** totals, empty, boundaries/timezone, failed excluded, ownership, invalid, tie.

**Subtasks**

- [ ] CF-TASK-065 — Implement teacher sales aggregate service — Albraa — 5h — Dependency: US015 — Deliverable: controlled queries — Validate fixtures
- [ ] CF-TASK-066 — Build gap-filled sales metrics view — Nabile — 5h — Dependency: T065 — Deliverable: filter/tiles/list — Validate responsive browser and tokens
- [ ] CF-TASK-067 — Add loading/empty/validation/error states — Nabile — 2h — Dependency: T066 — Deliverable: full states — Validate fixtures
- [ ] CF-TASK-068 — Add order-metric reconciliation tests — Albraa — 2h — Dependency: T065 — Deliverable: financial regression — Validate ledger comparison

**Definition of Done**

- [ ] Reviewed by Albraa
- [ ] Fixture reconciliation exact
- [ ] Ownership/range/failed-order tests pass
- [ ] Gap-filled design and responsive states reviewed against `ui5/`
- [ ] Backend truth documented

---

### CF-US-017 — Ask a limited Analytics & Store Agent question

**Issue Type:** Story  
**Epic:** CF-EPIC-12  
**Sprint:** Sprint 3  
**Priority:** High  
**Scope:** MUST — Committed MVP  
**Assignee:** Nabile  
**Reviewer:** Seif  
**Story Points:** 5  
**Estimated Hours:** 16  
**Dependencies:** CF-US-016 and the early Sprint 3 log contract from T074  
**Blockers/Decisions:** None; use three allowlisted intents, teacher-owned scope, 366-day maximum, and section 18 response shapes.

**User Story**  
As a teacher, I want to ask a small set of sales questions, so that I can retrieve trusted aggregates without learning report controls.

**Description**  
Parse only revenue, successful-order-count, and best-selling-course intents into validated dates and predefined teacher-scoped functions; no arbitrary SQL.

**Acceptance Criteria**

1. Given supported question, when submitted, then normalized intent/range invokes the correct controlled function.
2. Given unsupported/ambiguous question, when submitted, then examples return and no aggregate query runs.
3. Given unauthorized/other teacher, when asked, then owned scope is enforced or denied.
4. Given empty/invalid/long range/failure, when answered, then explicit formatted traceable state returns.
5. Given completed answer, when logged, then safe intent/parameters/function/version/rows/duration/status exist without raw SQL.

**Technical Notes:** Strict parser/structured output schema; no SQL tool; least-privilege service functions.  
**UI Source:** Authorized gap-fill teacher sales prompt/result panel.  
**API/Data:** analytics question endpoint, three function registry entries, agent logs.  
**Analytics:** No question text in GA4.  
**Test Cases:** phrase variants, dates, empty, unsupported, malformed, ownership, failure, currency.

**Subtasks**

- [ ] CF-TASK-069 — Implement intent/date parser/schema — Nabile — 4h — Dependency: intent decision — Deliverable: normalized request — Validate phrase/date tests
- [ ] CF-TASK-070 — Expose controlled analytics functions — Albraa — 5h — Dependency: US016 — Deliverable: function registry — Validate fixtures/ownership
- [ ] CF-TASK-071 — Build gap-filled prompt/result UI — Elgendy — 4h — Dependency: T069-T070 — Deliverable: panel — Validate browser states and tokens
- [ ] CF-TASK-072 — Add permission/failure/no-SQL tests — Seif — 3h — Dependency: T069-T071/T074 — Deliverable: security suite — Validate no arbitrary path

**Definition of Done**

- [ ] Reviewed by Seif
- [ ] Exactly three intents documented
- [ ] No arbitrary SQL/database access path
- [ ] Permission/empty/failure fixtures pass
- [ ] Responses/logs are traceable and formatted

---

### CF-US-018 — Inspect agent actions, errors, and service health

**Issue Type:** Story  
**Epic:** CF-EPIC-13  
**Sprint:** Sprint 3  
**Priority:** High  
**Scope:** MUST — Committed MVP  
**Assignee:** Seif  
**Reviewer:** Habsa  
**Story Points:** 3  
**Estimated Hours:** 10  
**Dependencies:** CF-US-010-CF-US-017  
**Blockers/Decisions:** None; migrate the enum, show owned-course summaries to teachers, and restrict sensitive diagnostics to operators.

**User Story**  
As the demo team, we want traceable agent actions, failures, and health, so that behavior can be explained instead of hidden.

**Description**  
Standardize correlation/structured logs, persist agent summaries, expose a restricted gap-filled viewer, health endpoints, and one safe failure demo.

**Acceptance Criteria**

1. Given agent execution, when it resolves, then type/status/scope/time/duration/version/correlation are logged.
2. Given teacher log view, when requested, then only owned-course privacy-safe summaries return.
3. Given dependency degradation, when health checked, then service status is useful without secrets.
4. Given known failure fixture, when demonstrated, then UI error and operational trace correlate.

**Technical Notes:** Redact PII/prompts/sources/order details; no user stack traces; readiness/liveness.  
**UI Source:** Authorized gap-fill table/list/chip view.  
**API/Data:** agent log endpoint, health endpoints, agent/activity/job logs.  
**Analytics:** Operational only, not GA4.  
**Test Cases:** success/fail/retry, isolation, redaction, correlation, dependency down, unauthorized.

**Subtasks**

- [ ] CF-TASK-074 — Standardize error/token/cost/action logs — Habsa — 2h — Dependency: existing ingestion/Tutor fields and Sprint 3 schema agreement — Deliverable: contract — Validate fixtures
- [ ] CF-TASK-075 — Add health/correlation propagation — Elgendy — 2h — Dependency: topology — Deliverable: endpoints/trace IDs — Validate failure
- [ ] CF-TASK-073 — Implement agent-log API/restricted view — Habsa — 4h — Dependency: T074/US017 records — Deliverable: log UI/API — Validate ownership/redaction
- [ ] CF-TASK-076 — Document/validate safe failure demo — Seif — 2h — Dependency: T073-T075 — Deliverable: runbook — Validate rehearsal

**Definition of Done**

- [ ] Reviewed by Habsa
- [ ] Core services emit correlated logs
- [ ] Restricted viewer and health checks pass
- [ ] Redaction/isolation tests pass
- [ ] Failure runbook rehearsed

---

### CF-TASK-085 — Review commerce and Analytics Agent authorization

**Issue Type:** Technical Task  
**Sprint:** Sprint 3  
**Owner:** Habsa  
**Estimate:** 2h  
**Dependency:** CF-US-015-CF-US-017  
**Action:** Review order idempotency, server price, teacher-owned sales queries, the Analytics Agent allowlist, and no-arbitrary-SQL boundary.  
**Deliverable:** Recorded order/sales/agent authorization review with reconciliation evidence.  
**Validation Method:** Reconcile paid orders to sales and agent responses, then verify ownership and no-arbitrary-SQL tests.

---

### CF-US-019 — Release and rehearse the end-to-end MVP

**Issue Type:** Story  
**Epic:** CF-EPIC-15  
**Sprint:** Sprint 3  
**Priority:** Highest  
**Scope:** MUST — Committed MVP  
**Assignee:** Seif  
**Reviewer:** Elgendy  
**Story Points:** 8  
**Estimated Hours:** 20  
**Dependencies:** CF-US-001-CF-US-015, CF-US-016-CF-US-018, CF-TASK-061-CF-TASK-064  
**Blockers/Decisions:** Deployment URL and external AI/GTM credentials remain open; Seif owns the demo runbook.

**User Story**  
As the CourseFlix team, we want a resettable tested release and rehearsed script, so that the complete MVP can be demonstrated reliably.

**Description**  
Finish canonical E2E, RTL/mobile/a11y regression, bug bash, deterministic reset, release docs, known limits, and two timed rehearsals after feature freeze.

**Acceptance Criteria**

1. Given clean reset, when canonical scenario runs, then all 13 MVP outcomes pass without DB edits.
2. Given target viewports, when pages render, then no overlap/clipping/unusable control/role error remains.
3. Given release checks, when run, then migrations/tests/RAG/privacy/order/health gates pass or accepted limitation is recorded.
4. Given failure demo, when rehearsed, then recovery/trace is explainable without secrets.
5. Given runbook, when two members follow it, then each can reset and deliver within demo time.

**Technical Notes:** Feature freeze Aug 4 EOD; fix Severity 1/2; pin fixture/model settings.  
**UI Source:** all 14 screens plus authorized gap-filled views.  
**API/Data:** full MVP, reset seed, deployment/config/health.  
**Analytics:** Complete event/privacy/order reconciliation.  
**Test Cases:** canonical flow, both roles, mobile/desktop, failure, reset, privacy, clean migration.

**Subtasks**

- [ ] CF-TASK-077 — Automate canonical teacher-to-student E2E — Seif — 5h — Dependency: US001-US015, US016-US018, T061-T064 — Deliverable: E2E — Validate reset run
- [ ] CF-TASK-078 — Complete RTL/a11y/responsive visual QA — Elgendy — 4h — Dependency: freeze — Deliverable: report — Validate target viewports
- [ ] CF-TASK-079 — Run bug bash/fix release blockers — Nabile — 6h — Dependency: freeze/T085 — Deliverable: resolved defects — Validate regressions
- [ ] CF-TASK-080 — Finalize reset/runbook/two rehearsals — Seif — 5h — Dependency: T077-T079 — Deliverable: demo package — Validate independent sign-off

**Definition of Done**

- [ ] Reviewed by Elgendy
- [ ] Full reset E2E and release checks passed
- [ ] No open Severity 1/2 defect
- [ ] Responsive UI checked against `ui5/`
- [ ] Two rehearsals and known-limitations review completed

### CF-TASK-081 — Review authentication, migration, and API contracts

**Issue Type:** Technical Task  
**Sprint:** Sprint 1  
**Owner:** Seif  
**Estimate:** 2h  
**Dependency:** CF-US-002, CF-US-003  
**Action:** Review session/RBAC controls, migration safety, ownership filters, and API examples across the integrated baseline.  
**Deliverable:** Recorded security/data contract review with findings linked as bugs or resolved notes.  
**Validation Method:** Re-run auth/data contract tests and confirm no unresolved Severity 1/2 finding.

### CF-TASK-082 — Review role UI and API integration end to end

**Issue Type:** Technical Task  
**Sprint:** Sprint 1  
**Owner:** Albraa  
**Estimate:** 2h  
**Dependency:** CF-US-001, CF-US-004, CF-US-005  
**Action:** Independently review student/teacher routes, identity, ownership, and standard states against the UI inventory.  
**Deliverable:** Role-flow integration sign-off or linked defects.  
**Validation Method:** Walk through both roles at desktop/mobile with loading, error, and forbidden fixtures.

### CF-TASK-083 — Review RAG isolation, citations, and prompt safety

**Issue Type:** Technical Task  
**Sprint:** Sprint 2  
**Owner:** Albraa  
**Estimate:** 2h  
**Dependency:** CF-US-009-CF-US-013  
**Action:** Cross-review upload-to-retrieval boundaries, active-version filtering, citation resolution, no-answer behavior, and injection controls.  
**Deliverable:** Recorded RAG safety review with linked defects.  
**Validation Method:** Re-run leakage, injection, unsupported, and citation evaluation cases.

### CF-TASK-084 — Review learning UI, events, and API contracts

**Issue Type:** Technical Task  
**Sprint:** Sprint 2  
**Owner:** Nabile  
**Estimate:** 2h  
**Dependency:** CF-US-007, CF-US-008, CF-US-012  
**Action:** Review lesson, quiz, notification UI/API integration and event hook semantics.  
**Deliverable:** Learning-flow integration sign-off or linked defects.  
**Validation Method:** Re-run Sprint 2 E2E and responsive loading/error/unauthorized states.

### CF-TASK-086 — Conduct independent release-readiness review

**Issue Type:** Technical Task  
**Sprint:** Sprint 3  
**Owner:** Elgendy  
**Estimate:** 2h  
**Dependency:** CF-US-018, CF-US-019  
**Action:** Independently run the release checklist, reset procedure, canonical demo, and known-limitations review.  
**Deliverable:** Release gate sign-off or a prioritized blocker list.  
**Validation Method:** Follow the runbook without author assistance and re-run release checks.

## 29. Risks and Mitigations

| Risk | Probability/impact | Early signal | Mitigation/owner | Scope response |
|---|---|---|---|---|
| No implemented app stack | High/High | Setup incomplete by Jul 19 noon | Time-box decision and use smallest team-familiar stack; Seif | Remove SHOULD work; keep seeded single-course flow |
| PostgreSQL/Mongo conflict | Medium/High | Parallel incompatible data work | Decide Jul 16; default schema.sql/PostgreSQL; Albraa | Defer unused schema entities |
| AI credentials/quota unavailable | Medium/High | No real model call by Jul 26 | Provider adapter, mocks for tests, escalate Jul 23; Seif | Demo grounded retrieval with configured fallback only if honestly labeled |
| PDF extraction/embedding quality | Medium/High | Known Q&A cannot retrieve by Jul 28 | Digital PDF fixture, page-aware chunks, tune bounded settings; Habsa | PDF only; no OCR/PPTX |
| Cross-course RAG leak | Low/Very High | Isolation test fails | Mandatory filters, leakage tests, release blocker; Albraa/Seif | Do not demo/release Tutor until fixed |
| Agent scope expansion | High/High | Requests for autonomous SQL/monitoring | Strict three intents and event rules; Nabile/Habsa | Move open-ended behavior POST-MVP |
| Gap-fill commerce/sales UI takes longer than estimated | Medium/Medium | Core route is not responsive by Aug 3 | Reuse existing components exactly and review in-story; Elgendy | Reduce polish, not core order/metric behavior |
| Payment gateway decision/access | High/High | No sandbox by Jul 26 | Internal test adapter; Albraa | Production gateway POST-MVP |
| GTM/GA4 credentials missing | Medium/Medium | No Preview access by Jul 27 | Local contract listener and mapping docs; Seif | Defer live publish, not instrumentation |
| Order/event mismatch | Medium/High | Purchase differs from DB | Backend values only, reconciliation tests; Albraa/Seif | GA4 never used for revenue truth |
| Team overload/integration delay | Medium/High | >2 blocked tasks/person or buffer >50% used | WIP limit, daily critical-path review, pair unblock | Drop SHOULD/COULD and reduce gap-filled UI polish |
| Friday/Saturday work assumed | Medium/Medium | Carry-over plan uses holidays | Calendar fixed to Sun-Thu; all owners | Re-scope; do not rely on weekend overtime |
| UI prototype contains unsafe behavior | High/High | Auto suspension/AI grading copied | Explicit exclusions and API guards; reviewers | Disable/defer unsafe actions |
| Demo instability | Medium/High | Reset/rehearsal fails Aug 5 | Feature freeze, deterministic seed, two rehearsals; Seif | No new features; use buffer for blockers |

## 30. Demo Scenario

Target length: 10-12 minutes. Reset before starting.

1. Sign in as seeded teacher and show the role-correct teacher dashboard.
2. Open the seeded course, edit one safe metadata field, and upload the known digital PDF.
3. Show pending -> processing -> completed status; optionally demonstrate one safe failed-file trace.
4. Sign out and sign in as seeded student.
5. Open dashboard -> enrolled course -> lesson; play/resume until a progress milestone and show persisted progress/attendance.
6. Open basic quiz, submit objective answers, and show saved result.
7. Open AI Tutor and ask a known supported Arabic question; show answer and valid document/page source.
8. Ask one unsupported or injection-style question; show explicit safe no-answer behavior.
9. Trigger the approved deterministic struggle event; show mini quiz/student notice and teacher progress report/agent log.
10. Open the gap-filled checkout, choose the test method, complete purchase, and show order reference.
11. Inspect core `dataLayer` events, especially `purchase`, and reconcile order/value/currency with backend order data.
12. Return as teacher, open sales metrics, verify totals/best seller, and ask one supported Analytics Agent question.
13. Show agent/activity logs, health status, and known MVP limitations.

Demo fallback rules:

- A retry may be used for an intentionally demonstrated failure, but no direct database editing is allowed.
- If an external AI/GTM service is unavailable, explain the outage through health/trace evidence and run the documented deterministic test path; do not present fixture text as a live result.
- Do not demonstrate automatic suspension, real payment, unrestricted analytics, or unsupported file formats.

## 31. Deferred Decisions

| Decision | Why deferred | Revisit trigger | Related backlog |
|---|---|---|---|
| Production deployment target | React/NestJS are confirmed, but hosting is not | After local integrated baseline | CF-US-006 |
| Course creation release scope/business rules | Gap-fill design is authorized but 15-day capacity is fixed | Core course management is stable | CF-SPIKE-001, CF-US-020 |
| Public catalog/enrollment | Gap-fill design is allowed but commerce rules and capacity remain | Commerce MVP stable | CF-US-021 |
| Homework/short-answer AI grading | Safety and review policy incomplete | Objective assessment stable + evaluation plan | CF-US-023, CF-US-028 |
| Automatic suspension | High-impact, unsafe for MVP | Formal policy, appeal, audit, explicit approval | CF-US-029 |
| PPTX/OCR/multi-format ingestion | PDF-first quality gate | PDF RAG metrics pass | CF-SPIKE-002, CF-US-030 |
| Production payment gateway | Credentials/legal/webhook/refund decisions | Post-demo commerce planning | CF-SPIKE-003 |
| Open-ended analytics | Arbitrary query and privacy risk | Semantic layer/query sandbox design | CF-US-031 |
| Abandoned-checkout and interaction reports | Needs reliable analytics export joined to order truth | Core GTM/order reconciliation stable | CF-US-035, CF-US-036 |
| Continuous autonomous proctor | Privacy/cost/behavior risk | Consent and governance review | CF-US-032 |
| Live streaming | Infrastructure exceeds release | Dedicated media architecture | CF-US-033 |
| Advanced knowledge graph | Not required for PDF RAG | Measured retrieval need | CF-US-034 |
| Registration/recovery/admin | Gap fill is allowed but these flows are not demo-critical | MVP accepted | New POST-MVP epics |

## 32. Final Feasibility Assessment

**Assessment: Feasible with strict scope control, but high integration risk.** The plan uses 348 of 450 gross team hours, leaving 102 hours (22.7%) for ceremonies, additional integration, defects, and uncertainty. Cross-functional ownership keeps every member within a balanced 65-74 planned-hour range; Seif’s 27h/21h/26h sprint loads remain below the 30h individual gross limit. All 86 tasks are 2-8 hours.

The 15-working-day release is credible only if the team scaffolds the confirmed React/NestJS/PostgreSQL baseline immediately, uses a seeded single-course flow, receives AI credentials before Sprint 2, accepts PDF-only digital documents, uses the internal test payment adapter, limits the proctor to deterministic event rules, and limits the Analytics Agent to three predefined functions. Course creation, public enrollment, full homework, short-answer AI grading, production payments, advanced analytics, continuous monitoring, live streaming, and multi-format ingestion must remain outside the commitment.

Release confidence should be changed to **Red** if any of these occur: authentication/core APIs are not integrated by July 23; a course-isolated PDF cannot answer and cite the known fixture by July 29; backend orders are unavailable by August 3; cross-course leakage, auth bypass, or false purchase/revenue remains unresolved; or the resettable E2E flow has not passed by August 5.

Planning baseline counts: **1 initiative, 15 epics, 19 committed MVP stories, 20 deferred stories/spikes, and 86 committed tasks/subtasks (including four Seif-owned GTM tasks and six explicit cross-team review tasks).**
