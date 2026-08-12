# 📸 Project Snapshot — Infinity Heroes: Bedtime Chronicles v5

> Dual-format snapshot (human summary + AI YAML). Generated 2026-06-01 via `/goal`.
> The repo root also has a longer hand-authored `../CLAUDE.md` — this file is the
> scannable index/complement. Where they disagree, trust `package.json` + source.

## Human Summary

A full-stack, **mobile-first AI bedtime-story app for children ages 3–9**. Kids create a
custom superhero and get personalized, AI-generated adventures with scene illustrations,
ElevenLabs narration, and gamification (badges, streaks, trophies). Three story modes:
Classic (adventure), Mad Libs (silly), and Sleep (calming).

**Shape:** a single repo with an **Expo / React Native client** (Expo Router, package major 56,
file-based routing under `app/`) and a **production-hardened Express 5 server** (`server/`). The server
is notably mature — it ships circuit breakers, retry-with-jitter, rate limiting, load
shedding, idempotency caching, feature flags, structured pino logging, and in-process
metrics, each with its own test. AI generation goes through a **multi-provider router**
(`server/ai/`) with per-task fallback chains (story: Anthropic → Gemini → OpenAI →
Meta-Llama → xAI → Mistral → Cohere). Postgres + Drizzle ORM backs the voice-chat features
only; most kid-facing state is local (AsyncStorage). `shared/schema.ts` (Drizzle + Zod) is
shared across client and server.

**Three deploy targets, same codebase:**
- **Replit** — primary dev/runtime (`.replit`, `replit.md`; `expo:dev` wires `REPLIT_DEV_DOMAIN`).
- **Vercel** — `api/server.mjs` is the single serverless entry that wraps the Express app
  (`vercel.json` runs `server:build` + `npx expo export --platform web` and bundles
  `static-build/**`). **Production deploys must go through the Vercel CLI**
  (`vercel login` → `vercel --prod`) — see `../DEPLOY.md`.
- **EAS Build → Android Play Store** (`eas.json`, `.github/workflows/eas-build.yml`).

### ⚠️ Live gotchas (operational knowledge — verify before relying on)
- **ESLint 10 gotcha MITIGATED (verify before touching lint config).** `package.json` pins
  `eslint@10.6.0` with `eslint-config-expo@~55.0.1` and a flat `eslint.config.js`. The
  `context.getFilename is not a function` crash from eslint-plugin-react is worked around by
  the explicit `react: { version: '19.0' }` setting in `eslint.config.js` — do NOT bump
  eslint-config-expo to ~57 to "fix" it (that reverts the SDK-55 alignment PR #354 restored).
  `npm run lint` is a working CI gate.
- **`package-lock.json` drifts.** `npm ci` has failed twice now (PR #169, then again) when a
  dep range was bumped without regenerating the lock. PR #172 re-synced it; consider a CI
  guard (`npm install --package-lock-only` + `git diff --exit-code package-lock.json`).
- **Vercel "Vercel" check always fails on bot/non-owner commits** — Hobby-plan commit-author
  gate ("Git author … must have access to the project"). Documented in `../DEPLOY.md`.
  Permanent fix = upgrade the FlashFusion team to Vercel Pro.
- **`.npmrc` sets `legacy-peer-deps=true`** to smooth over peer-range conflicts across the
  Expo/RN toolchain; leave it in place unless you've confirmed the tree resolves cleanly without it.
- Actual versions (authoritative source is `package.json`): **Expo ~55.0.28 / React Native 0.83.10 / expo-router ~55.0.17 / react 19.2.0 / typescript ~5.9.2 / Node ≥20.19**. PR #354 re-aligned the tree to SDK 55 (2026-07-15) — earlier prose citing RN 0.86 / Router 56 / TS 6 was pre-downgrade and has been corrected.
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

## AI Context

```yaml
project:
  name: infinite-heros-bedtime-chronicles-v5   # npm: @krosebrook/... (private, GH Packages)
  purpose: AI interactive bedtime-story app for kids 3-9 — Expo RN client + hardened Express API
  owner: Kyle Rosebrook <kylerosebrook@gmail.com>
  lane: personal                # GH owner Krosebrook; deployed via FlashFusion Vercel team
  status: active (canonical v5); separate from the dormant local "infinity-heroes" repo
stack:
  language: TypeScript (strict; tsconfig)
  client: Expo ~55 / React Native 0.83.10 (New Arch) / Expo Router ~55 / react-native-web
  state: TanStack React Query v5 + React Context; AsyncStorage for local persistence
  server: Express 5 (server/index.ts) — esbuild bundle → server_dist; tsx for dev
  db: PostgreSQL + Drizzle ORM (drizzle-kit push); voice-chat features only
  ai: multi-provider router (server/ai/) — Anthropic, Gemini, OpenAI, +fallbacks; ElevenLabs TTS
  auth: Supabase Auth (optional, gated on SUPABASE_SERVICE_ROLE_KEY + Supabase URL)
  packageManager: npm (>=10); node ">=20.19 <21 || >=22.13 <23"
structure:
  client: app/            # Expo Router screens: welcome, story, quick-create, madlibs, sleep-setup, trophies, settings, (tabs)
  server: server/         # auth, circuit-breaker, rate-limit, idempotency, load-shedding, metrics, logger, retry, feature-flags, ai/
  serverless: api/server.mjs   # Vercel entry wrapping Express
  shared: shared/schema.ts (Drizzle+Zod), shared/models/chat.ts
  other: [components/, lib/, constants/, assets/, scripts/, agents/, .agents/, docs/]
commands:
  dev_client: npm run expo:dev        # Replit-flavored expo start
  dev_server: npm run server:dev      # tsx server/index.ts
  build_server: npm run server:build  # esbuild → server_dist
  prod_server: npm run server:prod
  lint: npm run lint                  # npx expo lint (eslint 10.6 + flat config — working)
  typecheck: npm run typecheck        # tsc --noEmit
  test: npm run test                  # vitest run (server/lib units; also :watch, :coverage)
  test_components: npm run test:components  # jest (jest-expo) — RN components + Expo-native hooks
  db: npm run db:push                 # drizzle-kit
  preflight: npm run preflight
deploy:
  replit: primary (.replit, replit.md)
  vercel: CLI only (`vercel login && vercel --prod`); see DEPLOY.md — Hobby commit-author gate
  mobile: EAS Build → Android Play Store (eas.json)
ci: .github/workflows/   # ci, agent-pr-review, agent-security, markdown-link-check (Lychee), vercel-deploy, eas-build, publish, auto-merge, stale, branch-cleanup
constraints:
  - "Children's app (ages 3-9): age-appropriate content; story-reviewer agent enforces"
  - "Keep .npmrc legacy-peer-deps=true (typescript 6 vs Expo peer dep)"
  - "Regenerate package-lock.json when bumping dep ranges — npm ci is strict"
  - "Conventional Commits; branch from main; main is currently UNPROTECTED (no required checks)"
links:
  repo: https://github.com/Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5
  deploy_runbook: ./DEPLOY.md
  guidance: ../CLAUDE.md      # longer hand-authored doc (slightly stale on SDK/node versions)
  docs: [README.md, ARCHITECTURE via docs/, CONTRIBUTING.md, CONVENTIONS.md, GLOSSARY.md, replit.md]
```
