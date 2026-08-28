# Main Branch Governance

## Target server-side protection

`main` must be configured in GitHub so that changes can land only through reviewed pull requests. The desired policy is also recorded in `.github/main-protection-policy.json`.

Required controls:

- require a pull request before merging;
- require at least one approving review;
- dismiss stale approvals after new commits;
- require CODEOWNERS review where applicable;
- require approval after the most recent push;
- require the branch to be up to date before merging;
- require the repository's release gates, including `CI Pipeline`, `Exact Head PR Proof`, `Agent - Security`, and `Archive Recovery Gate`;
- require the `Base Freshness` status produced by `Main Governance Guard`;
- disallow direct pushes to `main`;
- disallow force pushes;
- disallow branch deletion;
- do not bypass these controls for routine automation.

## Exact-head merge discipline

Automation must bind every merge to the exact pull-request head SHA that was verified. If the PR head or `main` moves after evidence is collected, the evidence is stale and the candidate must be synchronized and re-run before merge.

For API-driven merges, pass the verified PR head as `expected_head_sha`. Do not merge on branch name alone.

## Repository-side guardrails

`.github/workflows/main-governance-guard.yml` provides two fail-visible controls that work independently of server-side protection:

1. **Base Freshness** checks that a PR head contains the current `main` commit and publishes a `Base Freshness` commit status. Whenever `main` advances, all still-open PR heads are marked pending until synchronized and re-verified.
2. **Main Push Provenance** runs after every push to `main` and fails when the resulting commit has no associated merged PR. This detects a prohibited direct push immediately.

These workflows are evidence and detection controls. They do not replace GitHub branch protection because an Actions workflow runs after Git accepts a push.

## Current platform limitation

At the time this policy was committed, the connected GitHub integration could not read or mutate classic branch-protection settings (`403 Resource not accessible by integration`). The repository rulesets endpoint also reported that rulesets are unavailable for this private repository on the current plan.

Therefore the live GitHub server-side toggles must be applied by a repository administrator after the relevant GitHub plan/permission capability is available. Until then, the workflow guardrails above detect drift but cannot prevent GitHub from accepting a direct push.

## Verification

A protection change is not complete until all of the following are true:

1. GitHub reports `main` as protected.
2. The required review count is at least one.
3. Required checks include the four release gates plus `Base Freshness`.
4. Strict/up-to-date status checking is enabled.
5. Force pushes and deletions are disabled.
6. A synthetic stale branch is blocked from merge.
7. A PR with a moved head cannot be merged using the old expected SHA.
8. Direct push attempts are rejected by GitHub itself, not merely detected afterward.
