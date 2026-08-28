# Main Branch Server-Protection Activation

## Purpose

This runbook closes the gap tracked by Issue #454: repository workflows currently detect invalid `main` updates after GitHub accepts them, while the target state requires GitHub itself to reject those mutations before the ref moves.

The canonical import artifact is:

`.github/rulesets/main-server-protection.json`

## Why the required checks use job names

GitHub rulesets require status-check context names. For GitHub Actions workflows, the context is the job name, not the workflow display name.

The import artifact therefore expands the semantic release gates into the concrete contexts observed on the certified PR head `a8222692f743f4d8fda9c9cb24d2a2a33f9141db`:

### CI Pipeline

- `Lint and Test`
- `Production Install Smoke Test`
- `Build Server`
- `Expo Compatibility and Web Build`

### Agent - Security

- `Security Agent`
- `CodeQL Analysis`

### Archive Recovery Gate

- `Source Archive + GCP Build Gate`

### Exact Head PR Proof

- `Exact Head Security Agent`
- `Exact Head Markdown Links`
- `Exact Head CI`
- `Exact Head CodeQL`
- `Exact Head Evidence Manifest`

### Main Governance Guard

- `Base Freshness`

The pull-request rule itself enforces the human review requirement, so `PR Review Agent` is not used as a substitute for an actual GitHub approval.

## Administrator activation

1. Open the repository's **Settings**.
2. Open **Rules → Rulesets**.
3. Choose **New ruleset → Import a ruleset**.
4. Import `.github/rulesets/main-server-protection.json`.
5. Before saving, verify all of the following:
   - target is the default branch (`~DEFAULT_BRANCH`);
   - enforcement is `Active`;
   - bypass list is empty;
   - pull request required;
   - one approving review required;
   - stale approvals dismissed after reviewable pushes;
   - CODEOWNERS review required;
   - approval of the latest push required;
   - review threads must be resolved;
   - required status checks are strict, so the branch must be current with `main`;
   - deletion is blocked;
   - non-fast-forward updates are blocked.
6. Save the ruleset.
7. Re-read the live ruleset through the GitHub API before attempting destructive adversarial tests.

Do not disable the existing `Hero Protect` ruleset merely to activate this one. Multiple applicable rulesets are cumulative. Remove or consolidate an older ruleset only after proving that doing so cannot weaken the effective policy.

## Required adversarial verification

Issue #454 remains open until the live GitHub server policy proves every row below.

| Case | Attempt | Required result |
|---|---|---|
| A1 | Merge PR with zero approvals | rejected |
| A2 | Merge PR with fewer than one qualifying approval | rejected |
| A3 | Push a new reviewable commit after approval | stale approval invalidated |
| A4 | Change CODEOWNERS-controlled content without CODEOWNER approval | merge rejected |
| A5 | Approve, then have the approver push the latest commit | latest-push approval requirement remains unsatisfied |
| A6 | Let `main` advance while a PR remains behind | stale PR cannot merge until synchronized |
| A7 | Omit/fail each required CI context individually | merge rejected for every missing gate |
| A8 | Direct fast-forward update of `main` outside a PR | rejected before ref moves |
| A9 | Force update `main` | rejected before ref moves |
| A10 | Delete `main` | rejected |
| A11 | API merge using an obsolete `expected_head_sha` | rejected |

## Safety ordering

Run A1–A7 and A11 first because they operate on disposable branches and PRs. Run A8–A10 only after the live ruleset read proves the imported active rule targets `~DEFAULT_BRANCH` and contains the deletion/non-fast-forward/pull-request/status-check rules. If the server policy is absent or ambiguous, do not attempt a direct update, force push, or deletion against `main`.

## Closure evidence

Issue #454 may be closed only when the evidence bundle contains:

- live ruleset ID and normalized rule payload;
- exact `main` SHA used as the test baseline;
- disposable PR and branch identifiers for the test cases;
- per-case GitHub rejection/success response;
- proof that `main` did not move during rejected direct/force/delete cases;
- stale `expected_head_sha` rejection evidence;
- final live ruleset read showing the same active policy after testing.
