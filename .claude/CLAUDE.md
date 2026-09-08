# 📸 Project Snapshot — Infinity Heroes: Bedtime Chronicles v5

> Dual-format snapshot (human summary + AI YAML). Generated 2026-06-01 via `/goal`;
> partially reconciled 2026-09-08 against actual repo state (see "Live gotchas" below —
> several are new findings, not yet fully resolved). The repo root also has a longer
> hand-authored `../CLAUDE.md` — this file is the scannable index/complement. Where they
> disagree, trust `package.json` + source, then whichever file has the more recent date.

## Human Summary

A full-stack, **mobile-first AI bedtime-story app for children ages 3–9**. Kids create a
custom superhero and get personalized, AI-generated adventures with scene illustrations,
ElevenLabs narration, and gamification (badges, streaks, trophies). Three story modes:
Classic (adventure), Mad Libs (silly), and Sleep (calming).

**Shape:** the repo actually contains **two frontend stacks** with an undocumented relationship: an
**Expo / React Native client** (Expo Router, package major 55 — not 56, corrected 2026-09-08 —
file-based routing under `app/`), and a separate **Vite + React web app** under `src/` (own
`App.tsx`, `components/`, `data/`, `services/`; served by root `index.html` and `npm run dev`/`build`).
No document states whether `src/` replaces Expo's web export or is a distinct surface.
**CORRECTED 2026-09-08 (Codex review caught this): the `src/` Vite app does NOT sit on the Express
server** — its story flow calls a local, synchronous `generateCustomBedtimeStory()` in
`src/services/aiStoryGenerator.ts` rather than an API route, and nothing under `src/` fetches a
repository API endpoint. Don't assume the server's auth, rate limiting, AI routing, or story-safety
enforcement cover the `src/` web surface — only the Expo client (`app/`) is confirmed to go through
`server/`. The Expo client sits on a **production-hardened Express 5 server** (`server/`). The server
is notably mature — it ships circuit breakers, retry-with-jitter, rate limiting, load
shedding, idempotency caching, feature flags, structured pino logging, and in-process
metrics, each with its own test. AI generation goes through a **multi-provider router**
(`server/ai/`) with per-task fallback chains (story: Anthropic → Gemini → OpenAI →
Meta-Llama → xAI → Mistral → Cohere). Postgres + Drizzle ORM backs the voice-chat features
only; most kid-facing state is local (AsyncStorage). `shared/schema.ts` (Drizzle + Zod) is
shared across client and server.

**Deploy targets — Vercel is disabled, Cloudflare is not yet live (updated 2026-09-08):**
- **Replit** — primary dev/runtime (`.replit`, `replit.md`; `expo:dev` wires `REPLIT_DEV_DOMAIN`).
- **Vercel — DISABLED, not a live target.** `api/server.mjs` (the old serverless entry) has been
  removed from the repo. `vercel.json` is now a fail-closed tombstone (`git.deploymentEnabled: false`),
  kept only because the Vercel project remains linked. Do not treat the old "deploy via Vercel CLI"
  instructions as current — see `../DEPLOY.md`.
- **Cloudflare Workers + Static Assets — the intended replacement, NOT yet implemented.** Per
  `docs/superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md`, this is the canonical
  target going forward, but the repo has no `worker/` directory or Wrangler config yet.
  **CORRECTED 2026-09-08 (a Codex review caught the earlier version here conflating "blocked" with
  "not live"):** only *new* deploys are blocked on both platforms — the existing Vercel deployment
  is still what's actually live and serving `bedtime-chronicles.com`/`www.bedtime-chronicles.com`;
  `../DEPLOY.md` explicitly forbids detaching those domains until the Cloudflare gate passes. Read
  `../DEPLOY.md`'s "Current production state" and "Vercel retirement guard" before assuming either
  that nothing is deployed or that Cloudflare/Vercel can be freely touched.
- **EAS Build → Android Play Store** (`eas.json`, `.github/workflows/eas-build.yml`) — configured but
  **currently can't complete in CI**: `eas-build.yml` runs `npm ci` with npm caching like every other
  workflow, and the missing `package-lock.json` (see "Live gotchas" below) breaks that step before EAS
  is invoked. Correct as of 2026-09-08 (Codex review caught the earlier "still live" claim being too
  strong).

### ⚠️ Live gotchas (operational knowledge — verify before relying on)
- **ESLint 10 gotcha still applies — CORRECTED 2026-09-08 (this file briefly said otherwise; a PR
  review bot caught the error).** `package.json` pins `eslint@10.9.1` (bumped from 10.8.1) but
  `eslint-config-expo` is **still `~55.0.1`, unchanged** — do NOT bump it to ~57 (see the original
  crash reason below). Commit `612da83` on `main`, titled
  `build(deps): bump eslint-config-expo from 55.0.1 to 57.0.2 (#464)`, is an **empty commit**
  (`git show 612da83 --stat` touches zero files) — its title/description describe a bump that never
  actually landed. Bumping eslint-config-expo to ~57 previously triggered an `eslint-plugin-react`
  `context.getFilename is not a function` crash (worked around via the `react: { version: '19.0' }`
  setting in `eslint.config.js`) — that risk is still live and unaddressed, since the pin never moved.
- **`package-lock.json` drifts.** `npm ci` has failed twice now (PR #169, then again) when a
  dep range was bumped without regenerating the lock. PR #172 re-synced it; consider a CI
  guard (`npm install --package-lock-only` + `git diff --exit-code package-lock.json`).
- **Vercel "Vercel" check always fails on bot/non-owner commits** — Hobby-plan commit-author
  gate ("Git author … must have access to the project"). Documented in `../DEPLOY.md`.
  Permanent fix = upgrade the FlashFusion team to Vercel Pro.
- **`.npmrc` sets `legacy-peer-deps=true`** to smooth over peer-range conflicts across the
  Expo/RN toolchain; leave it in place unless you've confirmed the tree resolves cleanly without it.
- Actual versions (authoritative source is `package.json`, re-verified 2026-09-08): **Expo ~55.0.30 /
  React Native 0.87.1 / expo-router ~55.0.18 / react & react-dom 19.2.8 / typescript ~5.9.2 /
  Node ≥20.19.0 <21 or ≥22.15.0 <23 / npm 11.x**. These drift routinely via Dependabot — re-check
  `package.json` rather than trusting any version cited in prose, including this line. An Expo SDK
  55→57 upgrade is spec'd (`docs/operations/EXPO-57-UPGRADE-SPEC.md`) but **not executed** — SDK is
  still 55.
- **Auth is Supabase, not Firebase** — `server/auth.ts` verifies Supabase JWTs
  (`SUPABASE_SERVICE_ROLE_KEY` + Supabase URL); client uses `EXPO_PUBLIC_SUPABASE_URL` +
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`lib/AuthContext.tsx`). Older docs mentioning
  `FIREBASE_SERVICE_ACCOUNT_KEY` are historical.
- **Doc-vs-code audit (2026-07-12)**: `server/replit_integrations/chat/routes.ts`
  (`registerChatRoutes()`) is implemented but never called from `server/routes.ts` —
  it's dead code, not a live endpoint; don't document it as one. `docs/API.md`,
  `../CLAUDE.md`, and this file were reconciled against actual `server/routes/*` and
  `package.json` in the same pass — see `docs/ROADMAP.md` for anything that came out
  of it as a backlog item.
- **Three-repo merge (2026-07-13)**: this repo was consolidated with two siblings
  (`krosebrook/bedtime_chronicles-v2`, `krosebrook/infinite-heros-bedtime-chronicles-v5-main`)
  into one super version, with this repo as the canonical base. `v2`'s offline
  sync-queue was ported in (`lib/sync-queue.ts`, `lib/useSyncOffline.ts`,
  `POST /api/sync/interactions`); `v2`'s in-progress native Android/Kotlin rewrite was
  archived rather than merged (see `../CLAUDE.md` "Merge Provenance" and
  `archive/android-kotlin-rewrite/README.md`); `v5-main` had no application code to
  contribute. Both sibling repos' branches were then fast-forwarded to this exact tree
  via a two-parent merge commit, so their own history stays intact and reachable.
- **R2 TTS cache is live (2026-07).** Server-side TTS audio now has a persistent Cloudflare
  R2 tier (`server/r2.ts`, gated on `R2_ENABLED` = `CLOUDFLARE_ACCOUNT_ID` + three
  `CLOUDFLARE_R2_*` vars), wired into `server/routes/tts.ts` behind a `writeWithLock` mutex.
  `server/tts-cache.ts` stays `/tmp`-only by design. Second test runner exists too:
  `npm run test:components` (jest-expo) for RN components + Expo-native hooks Vitest can't load.
- **Cloud sync (M3) SyncManager** triggers on open/foreground/reconnect **and sign-in**
  (`user?.id` in deps), then `refreshProfiles()`. Still OFF by default (`cloudSyncEnabled`)
  and not yet device-verified. See the root `../CLAUDE.md` "Cloud sync (M3)" gotcha.
- **Cloudflare runtime migration is a design doc, not code (2026-08-28 design, still true 2026-09-08).**
  New Vercel deploys are disabled (`vercel.json` tombstoned, `api/server.mjs` removed); Cloudflare
  Workers is the named replacement but has no `worker/` entry or Wrangler config in the repo. See
  `../DEPLOY.md` "Current production state" and the root `../CLAUDE.md` "Known Gotchas." **Only new
  deploys are blocked** — the existing Vercel deployment is still live in production; don't say
  "neither platform is live."
- **A second frontend stack exists under `src/`** (Vite + React, own `App.tsx`/`components/`/`data/`,
  served by root `index.html`, driven by `npm run dev`/`build`/`preview`) alongside the Expo client
  under `app/`. `docs/ARCHITECTURE.md` (canonical) doesn't mention it. Relationship to the Expo client
  is undocumented — flagged, not resolved, 2026-09-08.
- **`archive/android-kotlin-rewrite/` does not exist** despite being referenced by "Merge Provenance"
  in the root `../CLAUDE.md` as where the archived native Android/Kotlin rewrite lives. Live,
  git-tracked Kotlin/Jetpack Compose source instead sits at `app/src/main/java/...`, inside the Expo
  Router `app/` tree. Contradiction found 2026-09-08, unresolved — needs a maintainer decision.

## AI Context

```yaml
project:
  name: infinite-heros-bedtime-chronicles-v5   # npm: @krosebrook/... (private, GH Packages)
  purpose: AI interactive bedtime-story app for kids 3-9 — Expo RN client + hardened Express API
  owner: Kyle Rosebrook <kylerosebrook@gmail.com>
  lane: personal  # GH owner/org now ChaosClubCo per package.json (was Krosebrook, see links.repo below); Vercel deploy via the FlashFusion team is DISABLED as of 2026-08-27, not current
  status: active (canonical v5); separate from the dormant local "infinity-heroes" repo
stack:
  language: TypeScript (strict; tsconfig)
  client: Expo ~55.0.30 / React Native 0.87.1 (New Arch) / Expo Router ~55.0.18 / react-native-web
  web: separate Vite + React app under src/ (own App.tsx/components/data/services); relationship to
    the Expo client above is undocumented — see "Live gotchas"
  state: TanStack React Query v5 + React Context; AsyncStorage for local persistence
  server: Express 5 (server/index.ts) — esbuild bundle → server_dist; tsx for dev
  db: PostgreSQL + Drizzle ORM (drizzle-kit push); voice-chat features only
  ai: multi-provider router (server/ai/) — Anthropic, Gemini, OpenAI, +fallbacks; ElevenLabs TTS
  auth: Supabase Auth (optional, gated on SUPABASE_SERVICE_ROLE_KEY + Supabase URL)
  packageManager: npm (>=10); node ">=20.19 <21 || >=22.13 <23"
structure:
  client: app/            # Expo Router screens: welcome, story, quick-create, madlibs, sleep-setup, trophies, settings, (tabs)
  server: server/         # auth, circuit-breaker, rate-limit, idempotency, load-shedding, metrics, logger, retry, feature-flags, ai/
  serverless: "none currently live"  # api/server.mjs (old Vercel entry) was removed; the Cloudflare Worker replacement (worker/index.ts) does not exist yet either — see deploy below
  shared: shared/schema.ts (Drizzle+Zod), shared/models/chat.ts
  other: [components/, lib/, constants/, assets/, scripts/, agents/, .agents/, docs/, src/]  # src/ is the separate Vite web app — see web above
commands:
  dev_client: npm run expo:dev        # Replit-flavored expo start
  dev_server: npm run server:dev      # tsx server/index.ts
  # ⚠️ `npm run dev` is NOT "dev_client + dev_server" — it's `vite --host 0.0.0.0 --port 3000`,
  #    the separate src/ web app. Run dev_client and dev_server above in separate terminals instead.
  build_server: npm run server:build  # esbuild → server_dist
  build_web: npm run build            # vite build (src/ → static bundle) — separate from expo:static:build
  prod_server: npm run server:prod
  lint: npm run lint                  # eslint . (eslint 10.9.1; eslint-config-expo still ~55.0.1, NOT bumped — see "Live gotchas")
  typecheck: npm run typecheck        # tsc --noEmit
  test: npm run test                  # vitest run (server/lib units; also :watch, :coverage)
  test_components: npm run test:components  # jest (jest-expo) — RN components + Expo-native hooks
  db: npm run db:push                 # drizzle-kit
  preflight: npm run preflight
  verify_release_scripts: npm run verify:sync | verify:milestones | verify:release-proof |
    generate:beta-readiness | verify:beta-readiness | preflight:eas | verify:mirror |
    verify:expo57-readiness   # added since mid-2026-07; see root CLAUDE.md Common Commands for details
deploy:
  replit: primary dev/runtime (.replit, replit.md)
  vercel: "new deploys DISABLED (tombstoned vercel.json, api/server.mjs removed) but the EXISTING deployment is still what serves production — see DEPLOY.md, don't detach domains"
  cloudflare: "intended replacement (Workers + Static Assets), NOT yet implemented, no worker/ dir or Wrangler config — see docs/superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md and DEPLOY.md Current production state"
  mobile: "EAS Build to Android Play Store (eas.json) is configured but currently cannot complete in CI — eas-build.yml's npm ci step fails on the missing package-lock.json, same as other workflows"
ci: .github/workflows/   # 15 workflows as of 2026-09-08: ci, agent-pr-review, agent-security,
  # markdown-link-check (Lychee), eas-build, publish, stale, branch-cleanup, deployment-drift,
  # archive-recovery-gate, exact-head-pr-proof, main-governance-guard, prod-story-e2e-once,
  # public-v1-eslint-autofix, release-proof. vercel-deploy and auto-merge are GONE — don't reference them.
constraints:
  - "Children's app (ages 3-9): age-appropriate content; story-reviewer agent enforces"
  - "Keep .npmrc legacy-peer-deps=true (typescript 6 vs Expo peer dep)"
  - "Regenerate package-lock.json when bumping dep ranges — npm ci is strict"
  - "Conventional Commits; branch from main; main-branch protection status is UNVERIFIED as of
     2026-09-08 — commit history shows governance-hardening work since this was last confirmed
     (main-governance-guard.yml workflow, PRs #453 'harden main merge discipline' and #457
     'prepare live main ruleset activation'). Do not assume main is still unprotected; check current
     branch protection rules before relying on this line either way."
links:
  repo: https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5  # corrected 2026-09-08 to match package.json's repository field; this file previously said Krosebrook/... (may be a fork/rename, not independently re-investigated beyond the package.json field)
  deploy_runbook: ./DEPLOY.md
  guidance: ../CLAUDE.md      # longer hand-authored doc (slightly stale on SDK/node versions)
  docs: [README.md, ARCHITECTURE via docs/, CONTRIBUTING.md, CONVENTIONS.md, GLOSSARY.md, replit.md]
```
