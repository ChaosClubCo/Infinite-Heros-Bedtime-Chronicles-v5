# Vercel Canonical-Repository Relink — Evidence Record

**Date (UTC):** 2026-07-19
**Operator:** Claude Code remote session (authorized by repository owner), Vercel token identity `krosebrook`
**Root cause reference:** `RELEASE_EVIDENCE.md` row "Deployed smoke" — Vercel project connected to the public docs-only mirror, so native `VERCEL_GIT_COMMIT_SHA` never identified a canonical commit and `https://www.bedtime-chronicles.com` returned 404.

## Canonical repository determination

| Evidence | Value |
|---|---|
| Git origin of the working tree | `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5` |
| All CI runs / PRs cited across the evidence ledger | `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5` |
| `RELEASE_EVIDENCE.md` remediation instruction | "reconnect Vercel project to `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`" |
| GitHub repoId (via Vercel integration search) | `1158264873` (private, default branch `main`) |

Conclusion: canonical repository conclusively established as **`ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`**. No conflicting evidence found.

## Pre-change state (captured 2026-07-19 before any mutation)

| Item | Value |
|---|---|
| Project | `infinite-heros-bedtime-chronicles-v5-main`, ID `prj_n2VBgRdnXCZj5biQsJAB4T4On1gH` |
| Team | FlashFusion (`team_hPVeJgH0h1nCrogiaMvD6fxu`, slug `flash-fusion`) |
| Git link | GitHub `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main`, repoId `1273957145` |
| Production branch | `main` |
| Framework preset | `vite` (mirror-era; inert — repo `vercel.json` overrides at build time) |
| Node.js version | `24.x` |
| Root directory | (default) |
| Build/install/output overrides | none / none / `.` |
| `autoExposeSystemEnvs` | `true` |
| Deployment protection | Vercel Authentication (`ssoProtection: all_except_custom_domains`); no password protection |
| Deploy hooks | **none** (the `VERCEL_DEPLOY_HOOK_URL` GitHub secret is not backed by any hook on this project) |
| Project domains | `infinite-heros-bedtime-chronicles-v-gules.vercel.app` only — `bedtime-chronicles.com` was verified on the team but attached to **no** project (cause of the public 404) |
| Environment variables (names only, values never read) | CONTEXT7_API_KEY, DEF_API_KEY, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL, FIRECRAWL_API_KEY, GEMINI_API_KEY, GROK_API_KEY, OPENAI_API_KEY, POSTGRESQL_DB_STEING, RENDER_API_KEY, STABLE_API_KEY, SUPABASE_PUSHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY (14; mirror-era set — see Limitations) |
| Latest production deployments | `dpl_7VcjgKrzfwEkGgC4qg5wWB2nHtvt` ERROR @ `41c56cad` (mirror `main`); `dpl_EFYiQcn1EmtDWoKcWLwXbEDmBuc6` ERROR @ `88caf0e9`; `dpl_2tLfDR7AoUfLuhMZ8VdHyJJ5RJBR` ERROR @ `b4a6d78e` — all built from the mirror |
| `www.bedtime-chronicles.com` | HTTP 404, `server: Vercel` (domain resolving to Vercel edge, unattached) |
| `VERCEL_GIT_COMMIT_SHA` behavior | Populated only with mirror SHAs (see deployments above); never a canonical commit |

## Relink method (supported CLI operations)

Vercel CLI 56.3.2, authenticated token (never logged), scope `flash-fusion`:

1. `vercel link --project infinite-heros-bedtime-chronicles-v5-main --yes` (bind local dir; the CLI-pulled `.env.local` was immediately deleted and never committed)
2. `vercel git disconnect --yes` → "Disconnected Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main."
3. `vercel git connect https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5 --yes` → "Connected"

The Vercel GitHub App already had access to the canonical repository (confirmed via `GET /v1/integrations/search-repo` before the change), so no GitHub-side installation step was needed.

## Post-change state

| Item | Value |
|---|---|
| Git link | GitHub `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`, repoId `1158264873` |
| Production branch | `main` (unchanged) |
| Settings drift check (API diff pre vs post) | **NONE** — name, framework, node version, root directory, build/install/output, `autoExposeSystemEnvs`, fork protection, SSO protection all identical; env var names identical (14/14) |
| Duplicate project created | No (project list count unchanged) |
| Domains attached (this change) | `www.bedtime-chronicles.com` (primary), `bedtime-chronicles.com` → 308 redirect to www; both verified |

## Verification

**Classification: FIXED AND PRODUCTION-VERIFIED** (preview-verified via native deployment metadata; production-verified via deployment metadata **and** runtime `/api/health` on the custom domain).

### Preview (native Git metadata)

Pushing branch `claude/asyncstorage-vercel-fixes-8ze1jp` (commit `07f0332e6736d31a94c5b709d68df1a6651545f5`) caused the **native Git integration** to create preview deployment `dpl_J1oc9P1T18wEUC5VjK7FP1NY7zUN` (`infinite-heros-bedtime-chronicles-v5-main-ahe6pog9d.vercel.app`) → **READY**, with meta `githubOrg=ChaosClubCo`, `githubCommitRepo=Infinite-Heros-Bedtime-Chronicles-v5`, `githubCommitSha=07f0332e6736d31a94c5b709d68df1a6651545f5`, `githubCommitRef=claude/asyncstorage-vercel-fixes-8ze1jp` — all exact matches. This deployment also proves the new `vercel-build` provenance guard passes on a canonical build. Preview URLs are SSO-protected (`all_except_custom_domains`), so runtime verification was performed on the production custom domain; preview verification uses Vercel deployment metadata, which records source repo/SHA/ref natively.

### Production

Production deployment `dpl_6i2w8vTTKV5fcDSAspA6NZWqo6BU` (created via `POST /v13/deployments` with `gitSource: {type: github, repoId: 1158264873, ref: main}`) → **READY**, target `production`, aliased to `www.bedtime-chronicles.com` + `bedtime-chronicles.com` + the project `.vercel.app` domains. Meta: `githubOrg=ChaosClubCo`, `githubCommitRepo=Infinite-Heros-Bedtime-Chronicles-v5`, `githubCommitSha=6d39ab930f67cdab4b5d3dc991b76ca162da9b9a` (canonical `main` HEAD at deploy time), `githubCommitRef=main`.

Runtime smoke (2026-07-19 UTC):

- `GET https://www.bedtime-chronicles.com/api/health` → HTTP 200, `status: "ok"`, **`releaseSha: "6d39ab930f67cdab4b5d3dc991b76ca162da9b9a"`** — exact match with canonical `main`. `APP_RELEASE_SHA` is not set on the project, so this value comes from **native `VERCEL_GIT_COMMIT_SHA`**: the original root cause is demonstrably fixed at runtime, not just in metadata.
- `GET https://bedtime-chronicles.com/` → 308 → `https://www.bedtime-chronicles.com/` (apex redirect working).
- `GET https://www.bedtime-chronicles.com/` → HTTP 200 (public 404 resolved).
- `aiProvidersAvailable: true` — genuine: the project's `OPENAI_API_KEY` env var is read directly by the OpenAI provider (`server/ai/providers/openai.ts`). `ttsAvailable: false` — no `ELEVENLABS_API_KEY` configured (known limitation below).
- `releaseRepo`/`releaseRef` are absent from the production health response because `main` predates this PR; they will appear once this PR merges and `main` redeploys.
- **New finding (pre-existing, out of scope):** `GET https://www.bedtime-chronicles.com/privacy` → HTTP 404 `{"error":"Privacy policy not found"}`. The request reaches Express (our handler), but `server/templates/privacy-policy.html` is not found at `process.cwd()/server/templates/...` inside the Vercel function runtime despite `includeFiles` listing `server/templates/**`. This defect exists on `main` and was previously masked by the domain-level 404; it needs its own fix (resolve the template path relative to the bundle, not `process.cwd()`).

### Exact-SHA comparison

| Signal | Value | Match |
|---|---|---|
| Canonical GitHub `main` HEAD at deploy time | `6d39ab930f67cdab4b5d3dc991b76ca162da9b9a` | baseline |
| Production deployment meta (`ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`, ref `main`) | `6d39ab930f67cdab4b5d3dc991b76ca162da9b9a` | ✅ exact |
| `https://www.bedtime-chronicles.com/api/health` → `releaseSha` (native `VERCEL_GIT_COMMIT_SHA`) | `6d39ab930f67cdab4b5d3dc991b76ca162da9b9a` | ✅ exact |
| Canonical branch commit (this PR) | `07f0332e6736d31a94c5b709d68df1a6651545f5` | baseline |
| Preview deployment meta (`ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`, ref `claude/asyncstorage-vercel-fixes-8ze1jp`) | `07f0332e6736d31a94c5b709d68df1a6651545f5` | ✅ exact |

## Regression protection added (this PR)

- `scripts/verify-release-provenance.mjs` — single authoritative provenance rule module (mirror repos can never build; release gates require exact-SHA match) + CLI. Tests: `__tests__/release-provenance.test.ts`.
- `vercel.json` `buildCommand` now runs the `vercel-build` provenance phase before building.
- `/api/health` now exposes `releaseRepo` + `releaseRef` (from `VERCEL_GIT_REPO_OWNER/SLUG`, `VERCEL_GIT_COMMIT_REF`).
- `vercel-deploy.yml` and `release-proof.yml` production gates fail on a non-canonical `releaseRepo`.
- `scripts/deploy-vercel.sh` explicit-SHA workaround retained intentionally as defense in depth.

## Limitations / remaining items

- **Environment variables are mirror-era**: the 14 configured vars do not include the server's `AI_INTEGRATIONS_*` / `ELEVENLABS_API_KEY` set, so `/api/health` will report AI/TTS availability `false` until real provider keys are configured. Out of scope for the relink.
- **Node version**: project pins `24.x`; repo engines state `>=20.19 <21 || >=22.13 <23`. Not changed (preserve settings); revisit if builds misbehave.
- **`VERCEL_DEPLOY_HOOK_URL` GitHub secret** is not backed by any deploy hook (none existed pre-change). `vercel-deploy.yml` skips gracefully when unset; native Git integration now handles production deploys on push to `main`. Optionally create a fresh hook in the dashboard and update the secret if hook-based redundancy is wanted.
- **Public mirror still unarchived** — separate ledger row; requires GitHub admin action on `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main`.
- **`/privacy` 404 in production** — pre-existing serverless template-path defect on `main`, newly observable now that the domain serves the app (see Verification). Needs a separate fix.
- This record does **not** flip the overall release posture (`NO GO` stands; other ledger rows remain open).

## Rollback procedure

```bash
vercel git disconnect --yes --scope flash-fusion
vercel git connect https://github.com/Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main --yes --scope flash-fusion
# detach domains (restores pre-change 404-by-unattachment state):
# DELETE /v9/projects/prj_n2VBgRdnXCZj5biQsJAB4T4On1gH/domains/{www.,}bedtime-chronicles.com
```

Repo-side changes revert with `git revert` of this PR's commits.
