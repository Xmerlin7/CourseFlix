# Contributing to CourseFlix

This policy applies to every contributor, including repository administrators. Its purpose is to keep `main` releasable, make `dev` the shared integration branch, and ensure every change is reviewable, testable, and traceable to Jira.

## Golden Rules

1. Never commit or push directly to `main`.
2. Normal work must start from `dev` and return to `dev` through a pull request.
3. Use one Jira story, task, or bug per branch whenever practical.
4. Do not merge your own pull request without the required independent approval.
5. Do not merge with failed checks, unresolved review threads, or missing acceptance evidence.
6. Never commit credentials, tokens, private keys, production data, document content, or personal information.
7. Friday and Saturday are holidays. Do not create an expectation of weekend reviews or delivery.

## Branch Model

| Branch | Purpose | Created from | Merges into | Direct push |
|---|---|---|---|---|
| `main` | Stable release history and tagged demo/release candidates | Release PR only | N/A | Forbidden |
| `dev` | Shared integration branch for the next release | `main` initially | `main` through a release PR | Forbidden after bootstrap |
| `feature/*` | Product behavior tied to a Jira story/task | `dev` | `dev` | Allowed only to the branch author |
| `fix/*` | Non-production defect correction | `dev` | `dev` | Allowed only to the branch author |
| `test/*` | Test-only work | `dev` | `dev` | Allowed only to the branch author |
| `docs/*` | Documentation or process changes | `dev` | `dev` | Allowed only to the branch author |
| `chore/*` | Tooling, CI, dependency, or repository maintenance | `dev` | `dev` | Allowed only to the branch author |
| `hotfix/*` | Urgent released-code correction | `main` | `main`, then back to `dev` | Allowed only to the branch author |

Use lowercase kebab-case names containing the Jira key:

```text
feature/cf-us-011-grounded-tutor
feature/cf-task-041-tutor-api
fix/cf-bug-014-order-idempotency
test/cf-task-077-canonical-e2e
docs/team-workflow
```

Do not use personal names as branch names. Delete branches after merge.

## One-Time Repository Bootstrap

The repository was initialized with only `main`. The governance files may be merged once through a reviewed bootstrap PR. A repository administrator must then:

1. Create `dev` from the protected, updated `main`.
2. Push `dev` and set it as the default branch.
3. Apply the rules in [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md).
4. Confirm that normal pull requests default to `dev`.
5. Announce that direct pushes to both protected branches are disabled.

After bootstrap, only release and emergency hotfix pull requests may target `main`.

## Starting Work

Confirm that the Jira ticket is ready, assigned, estimated, and has testable acceptance criteria. Then update local `dev` and create a branch:

```bash
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feature/cf-task-041-tutor-api
```

Before coding, identify affected contracts, migrations, environment variables, analytics events, and test layers. Raise unclear acceptance criteria in Jira before expanding scope.

## Keeping a Branch Current

Rebase a personal branch before requesting final review:

```bash
git fetch origin
git rebase origin/dev
```

Never rebase a branch shared by multiple contributors without agreement. If a rebased personal branch was already pushed, use `git push --force-with-lease`, never `--force`.

Resolve conflicts deliberately. Do not accept one side of a migration, generated contract, lockfile, or security rule without checking the resulting behavior.

## Commits

Use Conventional Commit prefixes and include the Jira key:

```text
feat(api): add course-scoped retrieval (CF-TASK-041)
fix(web): preserve teacher shell on notifications (CF-BUG-006)
test(rag): cover cross-course isolation (CF-TASK-050)
docs(repo): document protected branch flow (CF-TASK-021)
```

Recommended types are `feat`, `fix`, `test`, `docs`, `refactor`, `perf`, `build`, `ci`, `chore`, and `revert`.

Keep commits focused and buildable. Do not mix formatting, unrelated refactoring, generated files, and feature behavior in one commit.

## Pull Requests

Open a draft pull request early when contracts or integration points need team visibility. Normal pull requests target `dev`.

Every pull request must:

- Link the Jira story/task/bug and describe the acceptance criteria addressed.
- Explain what changed, why it changed, and any important design decision.
- Stay focused on one concern; split unrelated changes.
- Include tests appropriate to the risk and affected layers.
- Include screenshots or recordings for visible UI changes at relevant RTL/mobile/desktop states.
- Document API changes, migrations, environment variables, event payloads, and rollback concerns.
- Report commands actually run and any checks that could not be run.
- Use the repository pull request template completely.

Prefer pull requests below roughly 400 changed lines excluding lockfiles, generated contracts, fixtures, and migrations. Larger changes require a short explanation and should be divided when the parts can be reviewed independently.

## Review Requirements

- Normal pull request to `dev`: at least 1 approval from someone other than the author.
- Auth, authorization, database migration, RAG isolation, AI safety, payment/order, analytics authorization, GTM privacy, CI, or release change: at least 2 approvals, including one relevant domain reviewer.
- Release pull request from `dev` to `main`: at least 2 approvals and all release checks.
- Hotfix pull request to `main`: at least 2 approvals unless a documented active incident makes that impossible; the repository administrator records the exception.

Authors may not dismiss valid review findings without explanation. Reviewers should classify blocking findings clearly, review behavior rather than personal style, and respond within one working day when available.

Resolve every review conversation before merge. A new commit that materially changes approved behavior requires another review.

## Required Quality Gates

As workflows become available, pull requests must pass the applicable checks:

- Formatting, linting, and TypeScript type checking.
- Frontend and backend unit tests.
- API integration and authorization tests.
- Migration apply and clean-rebuild checks.
- Browser tests for changed user flows.
- RAG grounding, citation, prompt-safety, and course-isolation evaluation when affected.
- Order idempotency and reconciliation tests when commerce is affected.
- GTM payload schema, deduplication, privacy, and order reconciliation when analytics is affected.
- Production build and required security scans.

Do not weaken, skip, or delete a failing test merely to make CI green. Fix the behavior or document and approve a deliberate requirement change.

## CourseFlix Engineering Safeguards

- `ui5` is the visual source of truth, not production code. Port its Arabic RTL patterns into React.
- Server authorization is mandatory even when the UI hides an action.
- PostgreSQL migrations are append-only after merge. Never edit a migration already shared through `dev`.
- Never trust client-provided prices, scores, ownership, roles, or completion state.
- Every Chroma query must enforce course, document, and active-version filters.
- AI responses must validate grounding and citations or return the explicit no-answer behavior.
- PostgreSQL orders are the financial source of truth; GA4 is never used for accounting.
- Natural-language analytics may call only the approved, teacher-scoped function registry. No arbitrary SQL path is allowed.
- GTM/GA4 implementation is owned by Seif. Feature owners provide stable hooks; GTM changes require the GTM owner review.
- Testing work assigned to the Quality and Integration Lead is additive. Feature owners still test their own behavior.

## Merging and Releases

Feature, fix, test, docs, and chore pull requests should be squash-merged into `dev`, then their branches should be deleted.

A release uses a pull request from `dev` to `main`. It must include:

- Release scope and linked Jira tickets.
- Passing migrations, tests, build, privacy, security, and demo reset checks.
- No open Severity 1 or Severity 2 defect.
- Known limitations and rollback notes.
- Independent release-readiness approval.

After merge, tag the release using semantic versioning, for example `v0.1.0`. Never make release-only fixes directly on `main`; either return the fix to `dev` before release or use the hotfix process.

For a hotfix, branch from `main`, open a reviewed PR to `main`, tag the corrected release, then immediately merge or cherry-pick the hotfix back into `dev` through a PR.

## Collaboration and Escalation

- Update Jira status when work starts, enters review, is blocked, or is completed.
- Mention blockers in the daily Scrum. Escalate a critical-path blocker after 4 working hours, not at the end of the sprint.
- Keep decisions in Jira, the PR, or repository documentation so they are not lost in private chat.
- Limit each person to one active blocking task at a time.
- Ask before changing another contributor's active branch or assigned scope.
- Pair on difficult integration work, but retain one accountable ticket owner.

## Definition of Done

A ticket is done only when its acceptance criteria pass through the integrated path, required tests and checks pass, authorization and privacy are reviewed, user-facing states are responsive and accessible in Arabic RTL, documentation is updated, review threads are resolved, and no Severity 1 or Severity 2 defect remains open.

Mock-only frontend pages and isolated backend endpoints do not complete an end-to-end story.
