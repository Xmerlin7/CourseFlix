# CourseFlix

CourseFlix is an Arabic-first, RTL learning platform for teachers and students. The graduation-project MVP combines course delivery, progress tracking, objective quizzes, PDF-grounded AI assistance, deterministic learning interventions, test commerce, teacher sales analytics, and privacy-safe product analytics.

> Status: planning and repository setup. Sprint 1 starts on Sunday, July 19, 2026. Application scaffolding is the first committed implementation work.

## MVP

### Student experience

- Secure role-based sign-in and navigation.
- Enrolled-course dashboard, course details, lessons, resume progress, and attendance.
- Objective quiz submission with server-side grading.
- Course-scoped AI Tutor answers with document/page citations or an explicit no-answer response.
- In-app notifications and a limited, rule-based learning intervention.
- Deterministic test checkout with an authoritative order receipt.

### Teacher experience

- Role-aware dashboard and seeded course management.
- Secure PDF upload with processing, failure, and retry states.
- Course-isolated document ingestion and vector indexing.
- Reviewable progress reports, mini quizzes, notifications, and agent activity.
- Sales totals sourced only from paid backend orders.
- A limited Analytics Agent supporting three allowlisted aggregate intents without arbitrary SQL.

### Cross-cutting delivery

- Responsive Arabic RTL UI based on the approved `ui5` design handoff.
- Authentication, authorization, validation, redaction, rate limiting, and course isolation.
- Correlation IDs, structured logs, health endpoints, deterministic reset data, and release rehearsals.
- GTM/GA4 event contracts and privacy validation, with PostgreSQL remaining the financial source of truth.

## Technology

| Layer | Choice |
|---|---|
| Web | React, TypeScript, Vite, React Router, TanStack Query |
| API | NestJS, TypeScript, REST, DTO validation, guards, OpenAPI |
| Data | PostgreSQL and TypeORM migrations |
| Jobs | Redis, BullMQ, and a NestJS worker |
| Vector store | ChromaDB with mandatory course/document/version filters |
| Frontend tests | Vitest, React Testing Library, Playwright |
| Backend tests | Jest and Supertest |
| Workspace | npm workspaces |

The planned monorepo structure is:

```text
CourseFlix/
|-- apps/
|   |-- web/       # React application
|   |-- api/       # NestJS REST API
|   `-- worker/    # NestJS ingestion worker
|-- packages/      # Shared contracts, config, and test helpers
|-- docs/          # Repository documentation after project import
`-- README.md
```

## Delivery Plan

The team works Sunday through Thursday. Friday and Saturday are holidays and are not included in capacity.

| Sprint | Dates | Goal | Planned | Buffer |
|---|---|---|---:|---:|
| Sprint 1 | Jul 19-23 | Workspace, UI shell, auth, data/API baseline, student and teacher course paths | 118h | 32h |
| Sprint 2 | Jul 26-30 | Lesson progress, quiz, PDF ingestion, grounded Tutor, notifications | 120h | 30h |
| Sprint 3 | Aug 2-6 | Intervention, test commerce, sales/agent analytics, observability, release | 110h | 40h |
| Total | 15 working days | Demonstrable MVP | 348h | 102h |

The committed baseline contains 15 epics, 19 MVP stories, and 86 tasks. Jira ticket IDs are stable identifiers; execution follows dependency order rather than numeric order.

## Team

| Member | Main contribution areas | Planned hours |
|---|---|---:|
| Elgendy | UI shell, full-stack Tutor flow, ingestion integration, checkout UI, health checks, visual/release review | 68h |
| Albraa | Authentication, data contracts, Chroma isolation, commerce, sales and analytics services | 68h |
| Nabile | UI primitives, course management, quiz/upload APIs, sales/agent UI, bug fixing | 73h |
| Habsa | Student flow, ingestion, RAG fixtures, intervention, agent logs and cross-team review | 65h |
| Seif | Quality and integration, backend/RAG traceability, GTM/GA4, security tests, E2E and release | 74h |

GTM/GA4 implementation is an additional technical workstream owned exclusively by Seif and staged across all three sprints. Feature owners still expose stable lifecycle hooks and remain responsible for tests local to their work.

## Team Workflow

`main` is release-only. Nobody commits or pushes directly to it. Normal work starts from `dev`, uses a Jira-named feature/fix/test/docs branch, and returns to `dev` through a reviewed pull request with passing checks. Only reviewed release or emergency hotfix pull requests may target `main`.

- [Contribution and review policy](CONTRIBUTING.md)
- [GitHub branch protection setup](.github/BRANCH_PROTECTION.md)
- [Security reporting policy](SECURITY.md)
- [Pull request template](.github/pull_request_template.md)

The repository administrator must apply the documented GitHub rulesets after the one-time bootstrap; policy files alone do not block direct pushes.

## Product Boundaries

The committed MVP uses one seeded teacher/student/course flow, digital PDF files, objective quiz grading, deterministic event rules, an internal test-payment adapter, and three controlled analytics intents.

The following are outside the commitment: real payments, public enrollment, full homework workflows, short-answer AI grading, automatic suspension, unrestricted SQL or analytics, continuous autonomous monitoring, OCR/PPTX ingestion, native live streaming, and an advanced knowledge graph.

## Design Rules

- Treat the static `ui5` files as the approved visual and interaction reference, not as production architecture.
- Port the established Arabic RTL layout, tokens, role shells, responsive behavior, and standard states into React.
- Reuse existing patterns for authorized gap-filled checkout, sales, analytics, and agent-log pages.
- Do not copy unsafe prototype behavior such as automatic suspension or trusted client-side grading.

## Planning References

The initial planning assets currently live in the parent Courseflex workspace and will be imported into the repository during setup:

- [Full Scrum and Jira plan](../docs/courseflix-scrum-jira-plan.md)
- [UI handoff notes](../ui5/README.md)
- [Product idea](../courseflix_idea.md)
- [Database schema](../schema.sql)
- [GTM integration guide](../Courseflix_GTM_Integration_Guide.pdf)

The Scrum/Jira plan is the current source of truth for scope, acceptance criteria, dependencies, estimates, ownership, testing, security, risks, and the demo runbook.

## Definition of Done

A story is complete only when its acceptance criteria pass through the real integrated path, owner-local tests and required cross-feature tests pass, authorization and privacy checks pass, Arabic RTL states are responsive and accessible, documentation is updated, and no Severity 1 or Severity 2 defect remains open.

Mock-only frontend pages or isolated backend endpoints do not count as completed stories.
