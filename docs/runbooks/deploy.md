# Runbook: Deploy

<!-- Last verified: 2026-08-29 -->

This runbook covers the active release surfaces for Infinity Heroes: Bedtime Chronicles.

- Web/API hosting authority: Cloudflare.
- Mobile delivery: Expo / EAS.
- Vercel deployment: retired. Do not trigger Vercel deploy hooks, CLI production deploys, or native Git deployments.

For the Cloudflare runtime migration contract and release gates, see [the Cloudflare Runtime Migration Design](../superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md).

---

## Prerequisites

- Changes merged through the repository's protected release process.
- All CI, security, exact-head, and release checks required for the candidate are passing.
- Required environment variables and secrets are configured only on the active target platform.
- The deployed runtime identity can be reconciled to the exact candidate SHA before promotion is claimed.

---

## Canonical Deployment Workflow

### 1. Web/API: Cloudflare

Cloudflare is the canonical web/API hosting authority. The repository must not deploy to Vercel.

1. Build and verify the exact candidate using the repository release gates.
2. Deploy only through the approved Cloudflare deployment surface for the candidate.
3. Verify `/api/health` and release provenance against the exact candidate SHA.
4. Verify the canonical production domains and privacy route.
5. Preserve the Cloudflare deployment/version identifier and candidate SHA in release evidence.
6. Proceed to [Post-Deploy Verification](#post-deploy-verification).

The detailed Cloudflare runtime contract, including Workers Static Assets, exact-SHA provenance, compatibility gates, and rollback requirements, is maintained in the [Cloudflare Runtime Migration Design](../superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md).

### Vercel retirement guard

`vercel.json` is retained only as a fail-closed deployment tombstone with `git.deploymentEnabled=false`. The former `.github/workflows/vercel-deploy.yml` deploy-hook workflow is retired and must not be restored as an active deployment path.

Any future Vercel deployment observed for this repository is deployment drift and must be investigated before release promotion continues.

---

### 2. Mobile Client: EAS Build

Native mobile binaries are built via EAS:

- **Preview (internal APK testing):** `bash scripts/build-android.sh preview`
- **Production (Google Play AAB):** `bash scripts/build-android.sh production`
- See [docs/operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md) and [docs/operations/GOOGLE-PLAY-STORE-REQUIREMENTS.md](../operations/GOOGLE-PLAY-STORE-REQUIREMENTS.md) for signing credentials and submission steps.

---

## Local Production-Mode Smoke

These commands validate the application locally. They are not a production deployment mechanism.

```bash
npm ci
npm run server:build
npm run server:prod
```

Do not substitute local Node success for Cloudflare Worker/workerd, deployed provenance, or rollback evidence when those gates apply.

---

## Post-Deploy Verification

Run health checks against the canonical Cloudflare-backed production domain:

```bash
BASE_URL=https://bedtime-chronicles.com

curl --fail --silent --show-error "$BASE_URL/api/health"
curl --fail --silent --show-error "$BASE_URL/api/ai-providers"
curl --fail --silent --show-error "$BASE_URL/api/voices"
```

A healthy deploy must show, at minimum:

- `/api/health` reports an OK state.
- Runtime release identity matches the exact candidate SHA when provenance is required by the release contract.
- `/api/ai-providers` exposes expected provider availability without leaking secrets.
- Canonical production domains resolve to the intended Cloudflare delivery path.

If any required check fails, follow the [rollback runbook](./rollback.md). A source-only rollback guess is not sufficient for Cloudflare certification; use an identified previously verified deployment/version as required by the migration design.

---

## See Also

- [Cloudflare Runtime Migration Design](../superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md) - canonical web/API migration and release contract
- [rollback.md](./rollback.md) - roll back a bad deployment
- [incident-response.md](./incident-response.md) - respond to a production incident
- [docs/operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md) - broader deployment reference; reconcile any remaining legacy Vercel guidance before treating it as canonical
