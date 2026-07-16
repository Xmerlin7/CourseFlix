# GitHub Repository Protection Setup

These settings must be configured by a repository administrator after the one-time governance bootstrap. This file documents the expected controls; GitHub does not apply branch protection merely because this file exists.

## Initial Setup

1. Merge the governance bootstrap PR into `main` after review.
2. Create `dev` from that exact `main` commit and push it to GitHub.
3. Set `dev` as the repository default branch.
4. Enable automatic deletion of head branches after pull request merge.
5. Allow squash merging for normal work and merge commits for `dev` to `main` release PRs.
6. Grant write access only to active team members and admin access only to maintainers who manage repository settings.

## Protect `main`

Create a branch ruleset targeting `main` with:

- Restrict deletions.
- Block force pushes.
- Require a pull request before merging.
- Require 2 approvals.
- Dismiss stale approvals when new commits are pushed.
- Require approval of the most recent reviewable push by someone other than its author.
- Require all conversations to be resolved.
- Require status checks to pass.
- Require the branch to be up to date before merge.
- Block direct updates except narrowly controlled emergency administrator bypass.
- Apply the rules to administrators whenever the repository plan supports it.

Only these pull request types may target `main`:

- Release: `dev` to `main`.
- Emergency hotfix: `hotfix/*` to `main`, followed by synchronization back to `dev`.

## Protect `dev`

Create a branch ruleset targeting `dev` with:

- Restrict deletions.
- Block force pushes.
- Require a pull request before merging.
- Require at least 1 approval.
- Dismiss stale approvals when new commits are pushed.
- Require all conversations to be resolved.
- Require status checks to pass.
- Require the branch to be up to date before merge.
- Block direct updates except a documented administrator recovery action.

Raise the approval requirement to 2 for high-risk changes as defined in [CONTRIBUTING.md](../CONTRIBUTING.md).

## Required Checks

Add checks to the rulesets only after the matching GitHub Actions jobs exist, otherwise all pull requests will be blocked. The intended required checks are:

```text
lint
typecheck
unit-web
unit-api
api-integration
migration-check
build
e2e
```

Add RAG evaluation, security, and GTM validation checks when those workflows become stable and deterministic.

## Repository Settings

- Set `dev` as the default pull request base branch.
- Disable merge commits for ordinary feature PRs by team convention; use squash merge.
- Keep merge commits available for release synchronization from `dev` to `main`.
- Enable automatic deletion of merged branches.
- Enable secret scanning, push protection, Dependabot alerts, and private vulnerability reporting when available.
- Store credentials only in GitHub Actions secrets or protected environments.
- Create a protected release environment if deployment is added; require an approver who did not author the deployment change.
- Do not allow Actions from untrusted sources without pinning and review.

## Administrator Bypass

Bypass is for repository recovery or an active production incident, not convenience. Every bypass must be followed by:

1. A GitHub issue or Jira incident record explaining the reason.
2. Independent review of the resulting commit.
3. Restored passing checks.
4. Synchronization between `main` and `dev`.
5. Rotation of any exposed credential if the incident involved secrets.

## Verification

After configuration, test the rules with a temporary branch and confirm:

- A direct push to `main` is rejected.
- A direct push to `dev` is rejected.
- A PR cannot merge without required approvals.
- A PR cannot merge with a failing required check.
- A stale approval is dismissed after a material new commit.
- A merged branch is deleted automatically.
