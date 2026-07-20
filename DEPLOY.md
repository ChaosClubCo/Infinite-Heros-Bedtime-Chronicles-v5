# Deploying to Vercel

## Production policy

Production deployments are allowed only from the canonical repository and branch:

- Repository: `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`
- Branch: `main`
- Trigger: `.github/workflows/vercel-deploy.yml`
- Transport: configured `VERCEL_DEPLOY_HOOK_URL`

Do **not** run `vercel --prod` for this project. Manual CLI uploads can include uncommitted files and cannot prove that the deployed artifact matches a reviewed Git commit. `scripts/deploy-vercel.sh` intentionally exits with an error.

## Controlled deployment flow

1. Merge reviewed remediation into canonical `main`.
2. The `Vercel Deploy Hook` workflow posts to the configured deploy hook.
3. Vercel builds the exact Git commit from `main`.
4. `scripts/verify-release-provenance.mjs --phase vercel-build` rejects production builds unless Vercel reports:
   - canonical repository owner and slug;
   - `VERCEL_GIT_COMMIT_REF=main`;
   - a full 40-character `VERCEL_GIT_COMMIT_SHA`.
5. The workflow polls the public production health endpoint and accepts the deployment only when:
   - `releaseSha` exactly equals the triggering commit;
   - `releaseRepo` equals the canonical repository;
   - `releaseRef` equals `main`;
   - health uses `Cache-Control: no-store`;
   - the hosted privacy notice returns HTTP 200.

## Emergency containment

A production alias may be returned to a known clean `main` candidate by creating a documented clean commit on `main`, which triggers the same controlled deploy-hook workflow. This is containment only. It does not approve release and invalidates prior exact-SHA evidence.

## Vercel Hobby limitation

The GitHub workflow uses a Vercel deploy hook because direct Git-triggered builds on a private repository can be blocked by the Hobby plan's commit-author restrictions. The deploy hook still instructs Vercel to build the configured canonical Git branch, preserving repository, branch, and SHA metadata without allowing a local CLI upload.

## Release approval

A successful deployment is not release approval. Freeze the deployed SHA and complete the exact-SHA release-proof workflow, physical-device matrix, deletion proof, restore and rollback drills, alert receipt, provider evidence, privacy/legal review, and app-store disclosure gates before changing the release posture from **NO GO**.
