# Runbook: Rollback

This runbook covers how to roll back a bad deployment of Infinity Heroes: Bedtime Chronicles.

**Last Updated:** 2026-03-16

---

## Overview

The primary production backend is deployed on Vercel Serverless Functions (`nodejs22.x`), while the mobile client is distributed via EAS Build / Google Play Store. Rollback is achieved by promoting the previous stable deployment on Vercel or rolling back OTA updates via EAS.

---

## Step 1: Identify the Problem

Before rolling back, confirm the issue:
1. Check the production deployment URL — is it returning 5xx errors?
2. Check Vercel deployment logs / Sentry dashboard for runtime exceptions
3. Check `/api/health` endpoint response

```bash
curl https://<your-deployment-domain>/api/health
```

If the issue is a server crash or broken endpoint, proceed with rollback. If the issue is an external AI provider outage (not a code problem), see [incident-response.md](./incident-response.md) instead.

---

## Step 2: Find the Last Known-Good Commit or Deployment

### Backend (Vercel)
1. Navigate to **Vercel Dashboard** → **Deployments**.
2. Identify the previous successful production deployment.
3. Or view Git history:
```bash
# View recent commit history
git log --oneline -20

# Find the last commit before the breaking change (e.g., abc1234)
```

---

## Step 3: Execute Rollback

### Option A: Instant Vercel Rollback (Recommended for Backend)
From the Vercel Dashboard:
1. Go to **Deployments** → Select the last known-good deployment.
2. Click **•••** → **Promote to Production** (or **Rollback**).
3. The change takes effect immediately without rebuilding.

Or via Vercel CLI:
```bash
vercel rollback <deployment-id-or-url>
```

### Option B: Git Revert (Standard Git Workflow)
```bash
# Revert the breaking commit on main
git revert HEAD --no-edit

# Push the revert commit to trigger CI & automatic deploy
git push origin main
```

### Option C: Mobile Client OTA Rollback (EAS Update)
If the regression is in a published Expo update:
```bash
eas update:rollback --channel production
```

---

## Step 4: Verification

After executing rollback:
1. Verify the `/api/health` and `/api/ai-providers` endpoints return `200 OK`.
2. Confirm Sentry error rate drops to normal baseline.
3. Run post-deploy verification steps from [deploy.md](./deploy.md#post-deploy-verification).

---

## Step 5: Root Cause Analysis

After the rollback is confirmed stable:
1. Identify what change caused the failure
2. Fix the issue in a new branch
3. Test locally with `npm run server:dev`
4. Run `npm run typecheck && npm run lint`
5. Submit a PR with the fix and a description of what went wrong

---

## Quick Reference — Critical File Locations

| File | Purpose |
|------|---------|
| `server/index.ts` | Server bootstrap — first place to check for startup errors |
| `server/routes.ts` | Route handlers — check for async errors |
| `server/ai/index.ts` | AI router — check if provider config changed |
| `server_dist/index.js` | Production bundle — check if build succeeded |
| `web-build/` | Expo static bundle — check if frontend build succeeded |
