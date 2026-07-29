# Security Policy

## Reporting a Security Issue

Do not open a public GitHub issue for a suspected vulnerability, leaked credential, authorization bypass, cross-course data leak, exposed personal data, payment/order integrity failure, or prompt/document disclosure.

Report it privately to the repository administrators and the relevant team lead through the team's approved private channel. Include:

- A short impact summary.
- Affected branch, commit, route, role, or service.
- Minimal reproduction steps using test data only.
- Logs or screenshots with secrets and personal data removed.
- Whether a credential, order, course, or student record may be exposed.

Do not exploit the issue beyond what is necessary to confirm it. Do not use real user, card, document, or production data during investigation.

## Immediate Response

For a leaked secret or active high-impact issue:

1. Notify repository administrators immediately.
2. Revoke or rotate the affected secret before relying on a code-only fix.
3. Preserve useful redacted evidence.
4. Create a private incident/Jira record.
5. Prepare a `hotfix/*` branch from `main` when released code is affected.
6. Review, test, and merge through the protected hotfix process.
7. Synchronize the fix back into `dev`.

## Severity Guidance

| Severity | Examples | Expected action |
|---|---|---|
| Severity 1 | Auth bypass, cross-course RAG leak, exposed secret, false paid order/revenue, destructive data loss | Stop release/demo, notify immediately, begin incident response |
| Severity 2 | Significant role leak, persistent privacy exposure, repeatable integrity failure, unsafe arbitrary query path | Block affected merge/release and prioritize correction |
| Severity 3 | Limited non-sensitive defect with a safe workaround | Track and prioritize normally |
| Severity 4 | Minor hardening or low-impact observation | Add to backlog with rationale |

No release may proceed with an open Severity 1 or Severity 2 issue.

## Repository Security Rules

- Never commit `.env` files, credentials, API keys, tokens, private keys, or database dumps.
- Use test identities and synthetic fixtures only.
- Keep server-side authorization on every protected API.
- Treat PostgreSQL orders as financial truth and never accept a client-supplied price as authoritative.
- Enforce course/document/version filters in every vector query.
- Redact prompts, source content, personal data, and sensitive order details from routine logs.
- Do not add arbitrary SQL execution to the Analytics Agent.
- Do not send question text, answer text, document text, identity data, or secrets to GTM/GA4.
- Review third-party Actions and dependencies before enabling them.
- Rotate any secret that reaches Git history, even if the commit is later removed.

## Supported Versions

During graduation-project development, only the latest commit on `main` and the active release candidate on `dev` receive security fixes. Older branches and local prototypes are not supported releases.
