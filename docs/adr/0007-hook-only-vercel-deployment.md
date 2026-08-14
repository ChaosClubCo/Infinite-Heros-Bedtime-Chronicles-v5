# ADR-0007 — Hook-Only Vercel Production Deployment

**Status:** proposed
**Date:** 2026-08-13
**Deciders:** <!-- HUMAN INPUT REQUIRED: List names or roles of decision-makers -->

---

## Context

The Vercel integration for this project supports two production-deployment triggers:

1. **Native Git integration** — Vercel watches the connected repository and auto-deploys every push to `main`.
2. **Deploy hook** — A secret URL that, when POSTed, instructs Vercel to build the current head of the configured branch; triggered here by `.github/workflows/vercel-deploy.yml`.

The original rationale for routing all production deploys through the hook (and disabling the native integration) was that the project was believed to run on the **Vercel Hobby plan**, which restricts Git-triggered builds on private repositories to the project owner. Commits authored by bots, Dependabot, or non-owner collaborators would receive a `BLOCKED` status, breaking CI.

That rationale is now **unverified**. Observed evidence contradicts it:

- A Git-triggered production deployment authored by `dependabot[bot]` (deployment `dpl_78oUZSAbpMwdiiXvPQfU8yjMr9Pn`, commit `5e6a19a`) completed with state `READY`. The Hobby commit-author check would have blocked it.
- The project resides under a Vercel **Team** (`flash-fusion`). The Hobby plan applies to personal accounts, not teams.
- The Vercel API does not expose a plan field that can be queried to settle the question programmatically.

Despite the unverified rationale, there are independent reasons to prefer the hook-only path:

- It ensures that only commits that have passed the full GitHub Actions CI pipeline (lint, typecheck, tests) can reach production, because the workflow gate runs before the hook is posted.
- It preserves an exact SHA audit trail: the workflow asserts that `releaseSha` in the health endpoint exactly matches `${{ github.sha }}` before marking the deploy successful.
- It prevents local CLI uploads (`vercel --prod`) from ever reaching production (enforced by `scripts/deploy-vercel.sh` and `scripts/verify-release-provenance.mjs`).

### Failure modes introduced

- If `VERCEL_DEPLOY_HOOK_URL` is unset, the workflow fails in ~10–15 s (at `test -n "$VERCEL_DEPLOY_HOOK_URL"`) and **no deployment fires**. Previously the native integration would have deployed regardless.
- If the workflow is consistently red and native deploys are disabled, production receives no updates until the workflow is fixed.
- Without `cancel-in-progress: true` on the concurrency group, back-to-back pushes queue multiple runs, each posting the hook independently; Vercel builds the branch head at post time, which may not match the SHA the run is verifying.

---

## Decision

Route all Vercel production deployments exclusively through the `.github/workflows/vercel-deploy.yml` deploy-hook workflow, **subject to the following prerequisites being satisfied first**:

1. `VERCEL_DEPLOY_HOOK_URL` is set as a repository Actions secret and a complete, green workflow run has been observed (run duration must exceed 20 s and the final health-check assertion must pass).
2. The workflow concurrency group uses `cancel-in-progress: true` so superseded runs are cancelled rather than queued.
3. The Vercel plan tier is confirmed in the dashboard; if the commit-author check is not in force, this section should be updated to document the verified rationale.

Until prerequisite 1 is satisfied, the native Git integration must remain enabled (no `git.deploymentEnabled.main = false` in `vercel.json`) so that production retains a working deploy path.

---

## Consequences

### Positive
- Every production build is traceable to a reviewed, CI-passed commit.
- CLI uploads are impossible; the provenance gate catches any bypass attempt.
- The exact-SHA health-check assertion provides cryptographic evidence of what is live.

### Negative
- Adds a required repository secret (`VERCEL_DEPLOY_HOOK_URL`); absence silently disables deployments.
- Increases deploy latency (the workflow's 900 s polling window).
- Introduces an operational dependency on GitHub Actions availability for all production changes.

### Neutral
- Preview deployments (non-`main` branches) are unaffected by `git.deploymentEnabled.main`.
- The `DEPLOY.md` "Vercel Hobby limitation" section must be updated once the plan tier is confirmed.

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|---------------|
| Native Git integration only | Does not enforce the CI gate or the exact-SHA health assertion before marking a deploy live. |
| Both triggers active simultaneously | Observed to produce duplicate production deployments of the same commit; wasteful and potentially race-prone. |
| Vercel CLI (`vercel --prod`) | Cannot prove the deployed artifact matches a reviewed Git commit; intentionally blocked by `scripts/deploy-vercel.sh`. |
