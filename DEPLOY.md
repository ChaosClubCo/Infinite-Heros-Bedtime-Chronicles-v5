# Deployment Policy — Infinity Heroes: Bedtime Chronicles

<!-- Last verified: 2026-08-29 -->

## Current production state

The canonical production target for the web/API migration is **Cloudflare Workers + Workers Static Assets**, as defined by `docs/superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md`.

That target is **not yet release-certified from this repository**. As of this verification:

- Vercel repository-driven deployments are disabled.
- `vercel.json` is retained only as a fail-closed tombstone with `git.deploymentEnabled=false` while the Vercel project remains linked.
- The former Vercel deploy-hook workflow is retired.
- Vercel-only serverless/build adapters are being removed from active source.
- The canonical branch does not yet contain the Worker entry/configuration required by the August 28 design (`worker/index.ts` plus Wrangler configuration).
- `/api/health` does not yet expose the complete immutable Cloudflare deployment identity required to prove an exact deployed source SHA.

Therefore **do not detach the production domains from Vercel and do not delete the Vercel project until the Cloudflare provenance gate below passes**. A hosting migration is not complete because a design document says so. Networks remain annoyingly literal.

## Cloudflare production admission gate

Before Cloudflare may be treated as the verified production origin, preserve evidence for all of the following against one exact candidate SHA:

1. Exact Cloudflare account and Worker/Pages project/service identity.
2. Production routes/custom domains for:
   - `bedtime-chronicles.com`
   - `www.bedtime-chronicles.com`
3. Exact Cloudflare deployment/version identifier.
4. Runtime-reported source SHA equal to the candidate SHA.
5. Runtime-reported canonical repository and `main` ref.
6. HTTPS health/privacy smoke on both canonical domains.
7. One previously verified Cloudflare deployment/version and its source SHA as the rollback target.
8. A real rollback rehearsal with post-rollback health and runtime identity verification.

Until every required item exists, deployment provenance and rollback remain **BLOCKED**, not inferred.

## Repository release gates

For every candidate:

```bash
npm ci
npm run preflight
npm run lint -- --max-warnings=0
npm test
npm run test:components
npm run typecheck
node scripts/audit-gate.mjs
npm run server:build
npm run expo:check
npm run expo:build:ci
```

The release-proof workflow additionally validates the deployed target supplied as `base_url`. It must not be used to certify a runtime whose health endpoint cannot report the exact candidate identity.

## Platform-neutral provenance contract

`scripts/verify-release-provenance.mjs --phase release-gate` accepts only a deployment that reports:

- a full 40-character deployed SHA exactly matching the expected candidate;
- `releaseRepo=ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`;
- `releaseRef=main`.

The hosting adapter must bind these values from immutable deployment metadata. Do not populate them from user-controlled request headers or hard-code a candidate SHA into application source.

## Vercel retirement guard

Vercel is no longer an approved deployment target for new revisions.

While its project remains linked, keep this minimal guard in `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": false
  }
}
```

Do not restore Vercel build commands, serverless functions, deploy hooks, preview-origin CORS allowances, or CLI deployment scripts.

After Cloudflare provenance and rollback are independently verified:

1. Detach `bedtime-chronicles.com` and `www.bedtime-chronicles.com` from the Vercel project.
2. Verify both domains still resolve and serve the verified Cloudflare version.
3. Retire/delete the Vercel project.
4. Re-check Vercel deployment inventory and confirm no new deployment exists for the retirement commit.
5. Remove the final `vercel.json` tombstone only after the Vercel Git/project linkage is gone.

## Mobile delivery

Expo/EAS remains the native mobile release path. Web/API hosting changes do not waive Android device, privacy, accessibility, account-isolation, or rollback gates.

See `docs/operations/DEPLOYMENT.md` for the broader operational procedure and `docs/runbooks/deploy.md` for the operator runbook.
