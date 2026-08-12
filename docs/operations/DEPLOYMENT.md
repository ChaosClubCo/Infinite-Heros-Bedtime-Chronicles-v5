# Deployment Manual — Infinity Heroes: Bedtime Chronicles

This manual is the single source of truth for deploying both the backend server (Vercel / Replit Cloud Run) and the native mobile client (EAS Build / Google Play Store).

---

## 1. Prerequisites & Environment Check

Before deploying to any target, verify the following:

- [ ] All environment variables are set in the destination dashboard or secrets vault.
- [ ] At least one primary AI provider API key is set (`AI_INTEGRATIONS_GEMINI_API_KEY` or `AI_INTEGRATIONS_ANTHROPIC_API_KEY`).
- [ ] `DATABASE_URL` is configured for PostgreSQL (required if voice chat is enabled).
- [ ] `npm run typecheck` passes cleanly with zero TypeScript errors.
- [ ] `npm run lint` passes cleanly with zero lint errors.
- [ ] `npm test` and `npm run test:components` both pass cleanly (green — no failing tests).

---

## 2. Server Deployment Targets

### Target A: Vercel (Serverless Backend + Static Web)

The production configuration lives in `vercel.json` and uses Vercel Serverless functions (mapped via `api/server.mjs`).

#### Production deploys are hook-only
The project currently runs on the **Vercel Hobby plan**.
> [!WARNING]
> Vercel Hobby does not allow collaborators on private repositories and enforces a *commit-author check* on every Git-triggered deployment. Commit authoring by anyone other than the project owner (e.g. bots, Dependabot, other maintainers) will result in a **`BLOCKED`** status on a direct Git-triggered build. This is exactly *why* the deploy-hook workflow below exists — it is the fix, not a fallback to reach for when the hook is unavailable.

Production deploys go **only** through: push reviewed changes to canonical `main` → the `Vercel Deploy Hook` GitHub Actions workflow (`.github/workflows/vercel-deploy.yml`) fires → it POSTs the `VERCEL_DEPLOY_HOOK_URL` secret, which instructs Vercel to build the exact Git commit from `main` (preserving repository, branch, and SHA metadata without a local CLI upload) → the workflow polls `https://www.bedtime-chronicles.com/api/health` until it reports the exact triggering commit SHA, then asserts `Cache-Control: no-store` on health/privacy and that the privacy page renders correctly, and uploads evidence artifacts.

`vercel --prod` and `npm run deploy:vercel` are **intentionally disabled** for this project — `scripts/deploy-vercel.sh` (the target of `npm run deploy:vercel`) exits 1 by design, printing an error that manual production deployment is disabled and pointing back to the controlled path above. Even if someone bypassed that script and ran the Vercel CLI directly, the build would still fail closed: `scripts/verify-release-provenance.mjs --phase vercel-build` rejects any build that lacks Vercel's Git metadata (`VERCEL_GIT_COMMIT_REF=main`, a full 40-character `VERCEL_GIT_COMMIT_SHA`, and an exact canonical owner/repo match) — metadata a CLI upload never provides.

See `../../DEPLOY.md` (repo root) for the authoritative, fuller writeup of this policy, including the emergency-containment and release-approval gates.

#### Web Bundle Compilation
`vercel.json`'s `buildCommand` runs `bash scripts/vercel-build.sh`, not a raw list of npm/expo commands. That script's first action is `node scripts/verify-release-provenance.mjs --phase vercel-build` — the provenance gate described above — before it proceeds to build the server bundle and the static web export. The static files are bundled inside the serverless functions via `functions.includeFiles` — there is no need to commit the `static-build/` folder to git.

---

### Target B: Replit Cloud Run (Self-Hosted Backend + Static Web)

Alternatively, the server can be deployed on Replit utilizing Google Cloud Run (`deploymentTarget = "cloudrun"`).

#### Option A: Deploy via Replit UI (Recommended)
1.  Open the Replit workspace.
2.  Click the **Deploy** button in the header bar.
3.  Confirm the build and run commands are:
    *   **Build:** `npm run expo:static:build && npm run server:build`
    *   **Run:** `npm run server:prod`
4.  Click **Deploy** and monitor build logs.

#### Option B: Deploy via CLI
Within the Replit workspace terminal, execute:
```bash
# 1. Compile static web assets & bundle server
npm run expo:static:build
npm run server:build

# 2. Verify build output
ls server_dist/index.js
ls web-build/

# 3. Start production server locally
npm run server:prod
```

#### Post-Deploy Verification
Verify that the following health endpoints respond correctly on the deployed instance:
```bash
BASE_URL=https://<your-deployment-url>.app

# 1. Health check (Expected: {"status":"ok", ...})
curl $BASE_URL/api/health

# 2. AI provider reachability
curl $BASE_URL/api/ai-providers

# 3. Voices list (Expected: {"voices": [...], "defaults": {...}})
curl $BASE_URL/api/voices
```

---

## 3. Native Mobile Client (EAS Build / Play Store)

The mobile client is a native React Native application. Distribution is handled via **EAS Build** to generate signed Android App Bundles (.aab) directly.

### EAS Prerequisites

| Requirement | Description |
| :--- | :--- |
| **EAS CLI** | Install globally: `npm install -g eas-cli` |
| **Expo Account** | Active account on [expo.dev](https://expo.dev) |
| **Google Play Developer Account** | Developer console access — $25 one-time fee |
| **Android Package Name** | Set in `app.json` as `com.infinityheroes.bedtime` (Permanent) |

### Setup & Credentials Registration

```bash
# 1. Authenticate with Expo
eas login

# 2. Register EAS Project ID (adds extra.eas.projectId to app.json)
eas init

# 3. Configure Android keystore signing credentials
eas credentials --platform android
```
*Choose **EAS managed credentials**. EAS will generate and store the keystore securely on Expo servers. You can back it up by selecting "Download existing keystore" from the CLI.*

### Configure EAS Environment Secrets

EAS builds run in the cloud, so you must register server-side and client-side variables in the EAS dashboard so they can be injected at build time:

```bash
eas secret:create --scope project --name AI_INTEGRATIONS_GEMINI_API_KEY --value "your-key"
eas secret:create --scope project --name AI_INTEGRATIONS_GEMINI_BASE_URL --value "your-url"
eas secret:create --scope project --name AI_INTEGRATIONS_OPENAI_API_KEY --value "your-key"
eas secret:create --scope project --name AI_INTEGRATIONS_OPENAI_BASE_URL --value "your-url"
eas secret:create --scope project --name AI_INTEGRATIONS_ANTHROPIC_API_KEY --value "your-key"
eas secret:create --scope project --name AI_INTEGRATIONS_ANTHROPIC_BASE_URL --value "your-url"
eas secret:create --scope project --name AI_INTEGRATIONS_OPENROUTER_API_KEY --value "your-key"
eas secret:create --scope project --name AI_INTEGRATIONS_OPENROUTER_BASE_URL --value "your-url"
eas secret:create --scope project --name ELEVENLABS_API_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://your-server-domain.com"
```
*See `docs/operations/EAS-SECRETS-CHECKLIST.md` for a full list of required secrets.*

### Build and Submit Procedures

#### 1. Compile & Side-Load internal Testing APK (Preview)
```bash
# Builds APK on Expo cloud agents
eas build --platform android --profile preview

# Install the output package on a local device via adb:
adb install infinity-heroes-preview.apk
```

#### 2. Compile Play Store Release Bundle (AAB)
The `autoIncrement: true` config in `eas.json` handles build version increments.
```bash
eas build --platform android --profile production
```

#### 3. Submit Release Package to Play Console
*   **Automated Submit:** Run `eas submit --platform android` (requires `google-services-key.json` service account configuration).
*   **Manual Submit:** Download the `.aab` release bundle from `expo.dev` and upload it under Play Console → Testing → Internal testing.

---

## 4. Troubleshooting & Verification Checks

### Common Deployment Issues

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| **Vercel deploy gets BLOCKED** | Non-owner Git commit author on a direct Git-triggered build | Verify the `VERCEL_DEPLOY_HOOK_URL` secret is configured, then re-run the "Vercel Deploy Hook" GitHub Actions workflow; check the workflow run logs for the specific provenance-gate failure reason (`scripts/verify-release-provenance.mjs`). Do not fall back to `vercel --prod` — it is intentionally disabled. |
| **App crashes on startup** | Missing EAS secrets | Run `eas secret:list` and confirm client URL and keys are populated |
| **Google Play rejects icon** | Alpha/transparency channel in PNG | Flatten `assets/images/icon.png` (remove transparent channels) |
| **ElevenLabs narration plays silence**| `ELEVENLABS_API_KEY` missing | Set API key as server secret or EAS secret |
