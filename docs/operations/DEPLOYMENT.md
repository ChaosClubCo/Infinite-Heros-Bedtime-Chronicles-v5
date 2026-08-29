# Deployment Manual — Infinity Heroes: Bedtime Chronicles

<!-- Last verified: 2026-08-29 -->

This manual covers the web/API migration boundary and the Expo/EAS mobile release path.

## 1. Current hosting posture

### Web/API

The approved **target architecture** is Cloudflare Workers + Workers Static Assets. The migration contract is `../superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md`.

The repository is currently in a bounded migration state:

- Vercel Git deployments are disabled by a minimal `vercel.json` tombstone.
- The Vercel production deploy-hook workflow is retired.
- Active Vercel serverless/build adapters are retired from the cleanup branch.
- Cloudflare production provenance is **not yet verified** from the canonical source tree.
- `worker/index.ts` and Wrangler configuration required by the design are not present on the verified `main` revision.
- Current `/api/health` does not expose all immutable release identity fields required to certify the deployed source SHA.

Do not describe Cloudflare as **DEPLOYED** or **CERTIFIED** until account-level deployment/version evidence and runtime SHA evidence exist.

### Mobile

Expo/EAS remains the canonical native mobile delivery path. The Cloudflare migration does not change the Android package identity or waive physical-device release gates.

---

## 2. Repository verification before deployment

Run the complete candidate gates on the exact SHA:

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

CI evidence must be bound to the same candidate SHA that is later deployed.

---

## 3. Cloudflare web/API admission

Before assigning either production domain to Cloudflare, capture and reconcile:

| Evidence | Required value |
|---|---|
| Account | Exact Cloudflare account ID/name |
| Service | Exact Worker/Pages project or service name |
| Deployment | Exact deployment/version ID |
| Source | Full deployed source SHA |
| Repository | `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5` |
| Ref | `main` |
| Apex route | `bedtime-chronicles.com` mapped to the verified service |
| WWW route | `www.bedtime-chronicles.com` mapped to the verified service |
| Rollback | Previously verified Cloudflare version + source SHA |

Required runtime equality:

```text
deployed source SHA == candidate SHA
runtime releaseSha   == candidate SHA
runtime releaseRepo  == ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5
runtime releaseRef   == main
```

The platform-neutral verifier is:

```bash
EXPECTED_RELEASE_SHA=<candidate> \
DEPLOYED_RELEASE_SHA=<runtime-sha> \
DEPLOYED_RELEASE_REPO=ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5 \
DEPLOYED_RELEASE_REF=main \
node scripts/verify-release-provenance.mjs --phase release-gate
```

A source-only guess, DNS screenshot, or successful local Node build is not deployment provenance.

---

## 4. Vercel retirement procedure

Vercel is frozen, not yet destructively removed.

The only active Vercel repository artifact permitted during the transition is the deployment-disabled tombstone:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": false
  }
}
```

Do not restore:

- `api/server.mjs`
- `.vercelignore`
- `scripts/vercel-build.sh`
- `scripts/deploy-vercel.sh`
- `scripts/verify-vercel-runtime-assets.mjs`
- `.github/workflows/vercel-deploy.yml`
- `deploy:vercel`
- `VERCEL_URL` CORS behavior
- `*.vercel.app` preview allowlists

Only after the Cloudflare admission gate passes:

1. Record the current Vercel project and domain bindings as retirement evidence.
2. Detach `bedtime-chronicles.com` and `www.bedtime-chronicles.com` from Vercel.
3. Immediately verify both domains serve the verified Cloudflare deployment/version and exact runtime SHA.
4. Retire/delete the Vercel project.
5. Verify no new Vercel deployment was produced by the retirement changes.
6. Remove the final `vercel.json` tombstone after Vercel Git/project linkage is gone.

If any domain or health check fails, stop retirement and restore the last independently verified routing state.

---

## 5. Cloudflare rollback gate

Certification requires a real provider-side rollback, not a Git revert assumption.

Before production promotion:

1. Identify the candidate Cloudflare deployment/version and SHA.
2. Identify one prior known-good Cloudflare deployment/version and SHA.
3. Promote the candidate.
4. Verify health, privacy, domains, and exact runtime identity.
5. Roll back to the known-good provider version.
6. Verify health and runtime identity after rollback.
7. Restore the candidate only if policy permits and verify identity again.
8. Preserve version IDs, SHAs, timestamps, and verification outputs.

Without a prior known-good Cloudflare version, rollback remains **BLOCKED** and the migration cannot be **CERTIFIED**.

---

## 6. Expo / EAS mobile delivery

### Prerequisites

- Expo account access.
- EAS credentials for package `com.infinityheroes.bedtime`.
- Required `EXPO_PUBLIC_*` values configured for the intended environment.
- Server secrets kept off the client bundle.

### Preview APK

```bash
eas build --platform android --profile preview
```

### Production AAB

```bash
eas build --platform android --profile production
```

### Submission

```bash
eas submit --platform android
```

A successful cloud build is not release certification. Device journeys, privacy/COPPA gates, offline/reconnect behavior, account isolation, accessibility, and rollback evidence remain independent requirements.

---

## 7. Post-deploy smoke

Against the verified production origin:

```bash
BASE_URL=https://bedtime-chronicles.com

curl --fail --silent --show-error "$BASE_URL/api/health"
curl --fail --silent --show-error "$BASE_URL/api/ai-providers"
curl --fail --silent --show-error "$BASE_URL/api/voices"
curl --fail --silent --show-error "$BASE_URL/privacy"
```

Required conclusions must come from the responses and provider metadata, not from the domain name alone.

---

## 8. Release status vocabulary

- **IMPLEMENTED**: source/config exists.
- **VERIFIED**: required static/runtime checks pass on an exact SHA.
- **DEPLOYED**: an identified provider deployment/version serves that SHA.
- **CERTIFIED**: deployment, security, device, provenance, and rollback gates all pass.
- **BLOCKED**: a named dependency prevents a required gate.
- **INCONCLUSIVE**: a validation attempt cannot produce a meaningful verdict.

Current Cloudflare hosting status must remain **BLOCKED/INCONCLUSIVE** until the exact account service, routes, deployment version, runtime SHA, and rollback version are independently established.
