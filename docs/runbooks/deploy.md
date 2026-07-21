# Runbook: Deploy

<!-- Last verified: 2026-07-21 -->

This runbook covers deploying a new version of Infinity Heroes: Bedtime Chronicles to Replit or Vercel.

For the full, detailed deployment guide see [docs/operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md).

---

## Prerequisites

- Changes merged to `main` branch
- All CI checks passing (lint, typecheck, tests, build)
- Required environment variables set in the target platform's secrets/config

---

## Replit Deploy

1. Push or merge changes to the `main` branch (Replit's **Push to Deploy** triggers automatically on push to `main`).
2. Watch the **Deployments** tab in the Replit workspace — the new build will appear with a progress indicator.
3. Once the build turns green, proceed to [Post-Deploy Verification](#post-deploy-verification).

---

## Vercel Deploy

Vercel deployments are triggered automatically on push to `main` via the [vercel-deploy.yml](../../.github/workflows/vercel-deploy.yml) workflow.

1. Monitor the workflow run in GitHub Actions.
2. On success, the new version is live at the configured Vercel production URL.
3. Proceed to [Post-Deploy Verification](#post-deploy-verification).

---

## Manual / Emergency Deploy

```bash
# 1. Install dependencies
npm ci

# 2. Build server bundle
npm run server:build

# 3. Start production server
npm run server:prod
```

See [docs/operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md) for full EAS mobile build and environment variable setup.

---

## Post-Deploy Verification

Run these health checks against the deployed instance to confirm a successful deploy:

```bash
BASE_URL=https://<your-deployment-url>.app

# 1. Server health (expected: {"status":"ok", ...})
curl $BASE_URL/api/health

# 2. AI provider reachability
curl $BASE_URL/api/ai-providers

# 3. Voices list (expected: {"voices": [...], "defaults": {...}})
curl $BASE_URL/api/voices
```

A healthy deploy shows:
- `/api/health` → `{ "status": "ok" }`
- `/api/ai-providers` → at least one provider with `"available": true`

If any check fails, follow the [rollback runbook](./rollback.md).

---

## See Also

- [rollback.md](./rollback.md) — Roll back a bad deployment
- [incident-response.md](./incident-response.md) — Respond to a production incident
- [docs/operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md) — Full deployment reference (EAS, Vercel, Replit)
