# Production containment — 2026-07-20

## Status

**Containment action only. Release posture remains NO GO.**

A Vercel CLI deployment from the unmerged branch `fix/activate-cloud-sync-triggers` had been promoted to the production aliases with deployment metadata indicating `gitDirty: 1`. That artifact was not reproducible from the canonical repository and invalidated exact-SHA release evidence.

This clean commit on canonical `main` intentionally triggers the repository-controlled Vercel deploy hook so production can be returned to a Git-backed, exact-SHA deployment from:

- Repository: `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`
- Branch: `main`
- Parent baseline: `2778e207fe607b7f3b8ec4b05dc97d04c4bb319b`

## Required verification

The containment is complete only when the public production domain proves all of the following:

1. `/api/health` returns HTTP 200.
2. `releaseSha` equals this containment commit's full SHA.
3. `releaseRepo` equals `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`.
4. `releaseRef` equals `main`.
5. The response uses `Cache-Control: no-store`.
6. `/privacy` returns HTTP 200 from the same deployed candidate.
7. Vercel deployment metadata identifies a Git-backed `main` deployment and does not report dirty source state.

## Release control

- This commit and deployment are emergency containment, not release approval.
- PR #378 remains unmerged and must not be promoted as a release candidate.
- All prior release evidence is stale after this commit.
- A new candidate must be frozen and the exact-SHA release proof, device, deletion, restore, rollback, alert, provider, legal, and store gates must be rerun.
