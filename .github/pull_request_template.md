## Summary

<!-- Explain what changed and why. Keep this understandable without reading every diff line. -->

## Jira

- Ticket: CF-
- Sprint:
- Acceptance criteria covered:

## Change Type

- [ ] Feature
- [ ] Bug fix
- [ ] Test
- [ ] Refactor
- [ ] Documentation
- [ ] Build, CI, or dependency change
- [ ] Release or hotfix

## Target Branch

- [ ] This PR targets `dev`.
- [ ] This PR targets `main` only because it is a reviewed release or emergency hotfix.

## Validation

<!-- List exact commands and manual scenarios that passed. State clearly when a check could not run. -->

```text
commands/results
```

## Evidence

<!-- Add RTL/mobile/desktop screenshots for UI work, API examples for contract work, and reports for RAG/GTM/reconciliation changes. Remove this section only when it truly does not apply. -->

## Impact

- [ ] No API contract change
- [ ] API contract documented and consumers updated
- [ ] No database migration
- [ ] Migration includes clean-apply and rollback/rebuild evidence
- [ ] No new or changed environment variable
- [ ] Environment documentation updated without committing secrets
- [ ] No analytics event change
- [ ] GTM owner reviewed event schema/privacy/reconciliation impact
- [ ] No AI/RAG behavior change
- [ ] Grounding, citation, injection, and course-isolation impact tested

## Author Checklist

- [ ] Branch started from current `dev` or approved `main` for a hotfix.
- [ ] Change is focused and linked to one primary Jira ticket.
- [ ] Acceptance criteria are met through the integrated path.
- [ ] Authorization, validation, privacy, and error states were considered.
- [ ] Feature-local tests were added or updated.
- [ ] Lint, types, tests, and build pass where applicable.
- [ ] Arabic RTL and responsive states were checked for UI changes.
- [ ] No secrets, private data, document content, or real payment data were committed.
- [ ] Documentation, OpenAPI contracts, and known limitations are updated.
- [ ] I reviewed my own diff and removed unrelated changes.

## Reviewer Notes

<!-- Call out risky code, important tradeoffs, migration order, follow-up tickets, or areas needing a specific reviewer. -->
