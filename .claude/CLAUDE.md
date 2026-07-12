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
- **ESLint 10 gotcha RESOLVED (2026-07).** The old crash (`eslint-config-expo@~55` +
  ESLint 10 → `context.getFilename is not a function`) is gone: `package.json` now pins
  `eslint@10.6.0` with `eslint-config-expo@~57.0.0` and a flat `eslint.config.js`, and
  lint was cleaned to zero warnings (PRs #264, #296). `npm run lint` is a working CI gate.
- **`package-lock.json` drifts.** `npm ci` has failed twice now (PR #169, then again) when a
  dep range was bumped without regenerating the lock. PR #172 re-synced it; consider a CI
  guard (`npm install --package-lock-only` + `git diff --exit-code package-lock.json`).
- **Vercel "Vercel" check always fails on bot/non-owner commits** — Hobby-plan commit-author
  gate ("Git author … must have access to the project"). Documented in `../DEPLOY.md`.
  Permanent fix = upgrade the FlashFusion team to Vercel Pro.
- **`typescript@~6.0.3` vs Expo's `typescript@^5`** peer conflict → `.npmrc` sets
  `legacy-peer-deps=true`. Don't remove it without resolving the TS major mismatch.
- Actual versions: **Expo ~55 / React Native 0.86 / Node ≥20.19** (root `../CLAUDE.md` was reconciled 2026-07-07).
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
  client: Expo ~55 / React Native 0.86 (New Arch) / Expo Router 56 / react-native-web
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
  test: npm run test                  # vitest run (also :watch, :coverage)
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
