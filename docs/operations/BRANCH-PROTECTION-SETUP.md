# Branch Protection Setup

**Last Updated:** 2026-07-09  
**Status:** Manual configuration required on GitHub UI

This document describes the branch protection rules that should be configured for the `main` branch to ensure code quality and prevent accidents.

## Overview

Branch protection rules provide guardrails for the primary development branch:
- **Require pull request reviews** — prevents direct pushes; requires at least 1 approval
- **Require status checks** — blocks merge until CI passes (lint, typecheck, test, build)
- **Dismiss stale reviews** — requires fresh approvals when new commits are pushed
- **Allow admins to bypass** — safety valve for urgent hotfixes

## Automated Cleanup Already in Place

The repository already has automated branch cleanup configured (no action needed):
- **Merged branches:** Automatically deleted via `.github/workflows/branch-cleanup.yml` after PR merge
- **Stale branches:** Deleted manually via `workflow_dispatch` input for branches >90 days old with no activity
- **Protected branches:** `main`, `master`, `develop`, `staging`, `production` are exempt from cleanup

## Manual Configuration Steps

To complete branch protection setup for `main`:

### Step 1: Navigate to Branch Protection Settings
1. Go to **Settings** → **Branches** in your GitHub repository
2. Under "Branch protection rules", click **Add rule**

### Step 2: Configure the Rule
Fill in the following fields:

| Field | Value | Purpose |
|-------|-------|---------|
| Branch name pattern | `main` | Protects the main branch |
| Require a pull request before merging | ✓ Checked | Prevents direct pushes |
| Require approvals | ✓ Checked (1) | At least 1 human review |
| Dismiss stale pull request approvals when new commits are pushed | ✓ Checked | Requires re-approval after new commits |
| Require status checks to pass before merging | ✓ Checked | Ensures CI passes |
| Require branches to be up to date before merging | ✓ Checked | Prevents merge conflicts |
| Require code reviews from code owners | — (optional) | Enforce CODEOWNERS file review |
| Allow force pushes | Select → Specify administrators only | Enable hotfix bypass (admins only; don't use the broad "everyone" option) |
| Allow deletions | — (unchecked) | Prevent accidental main branch deletion |

### Step 3: Select Required Status Checks

Check **all** of these CI checks (from `.github/workflows/ci.yml`):

- `Lint and Test`
- `Production Install Smoke Test`
- `Build Server`

**Important:** GitHub matches status check names exactly. Use the names above as they appear in your CI workflow; names in the GitHub UI select dialog must match these job IDs exactly.

### Step 4: Save

Click **Create** to save the rule.

## Verification

To verify the rule is active:

```bash
# From the command line:
gh api repos/ChaosClubCo/infinite-heros-bedtime-chronicles-v5/branches/main/protection

# Expected: Returns JSON with the protection rules; HTTP 200 indicates success
# If rule doesn't exist: HTTP 404
```

Or check via GitHub UI:
1. Go to **Settings** → **Branches**
2. Confirm the `main` rule appears under "Branch protection rules"
3. Click the rule to view/edit its configuration

## Impact on Workflow

Once branch protection is active:

**✓ What still works:**
- Pushing to feature branches (`feat/`, `fix/`, etc.) has no restrictions
- Opening PRs from feature branches → main works normally
- Quick reviews and merges (no additional steps, just need 1 approval)
- Force-pushes by admins in emergencies (for hotfixes)

**✗ What is blocked:**
- Direct commits/pushes to `main` (must use a feature branch + PR)
- Merging a PR without at least 1 approval
- Merging a PR if CI checks are failing
- Merging a PR with out-of-date base (requires rebase)

## Related Files

- `.github/workflows/ci.yml` — Defines the status checks (lint, typecheck, test, build)
- `.github/workflows/branch-cleanup.yml` — Automatic merged-branch and stale-branch deletion
- `CONTRIBUTING.md` — Branch workflow guidance for developers (updated 2026-07-09)

## Troubleshooting

**Q: "Can I commit directly to main in an emergency?"**  
A: Yes, but only admins can force-push. For non-emergencies, use the normal PR flow — reviews take minutes.

**Q: "What if CI is flaky and keeps failing?"**  
A: Admins can temporarily disable the status check requirement, fix the CI, then re-enable. This is a rare scenario and should be documented in the incident runbook.

**Q: "Can I dismiss reviews and merge anyway?"**  
A: No, branch protection enforces the rule. Admins can only bypass via force-push, not via the merge button.

## See Also

- `CONTRIBUTING.md` — Contributing guide with branch lifecycle workflow
- `.github/workflows/ci.yml` — CI pipeline definition (defines required status checks)
