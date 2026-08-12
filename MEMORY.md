<!-- Last verified: 2026-07-19 -->
<!-- Update this file when significant architectural changes occur or new major work begins -->

# MEMORY.md — Persistent AI Agent Context

Read this file at session start to rapidly build project context. Keep it dense and factual.

**Last Updated:** 2026-07-19

---

## Project Identity

- **Name:** Infinity Heroes: Bedtime Chronicles
- **Type:** Children's bedtime story app (ages 3–9)
- **Platform:** Expo SDK 55 (React Native 0.83.10) + Express.js v5 backend
- **Language:** TypeScript 5.9.2 (strict throughout)
- **Status:** Release remediation in review; **NO GO** until exact-candidate external proof and release-owner approval

---

## Current State (as of 2026-07-19)

The canonical repository is `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`.
GitHub issue #376 is the active evidence ledger. Merges deliver remediation only;
they are not release approval. Evidence from any earlier SHA is stale for a later
candidate.

### What Works
- Story generation via multi-provider AI fallback chain: Anthropic (primary) → Gemini → OpenAI → OpenRouter (xAI, Mistral, Cohere, Meta Llama)
- Three story modes: Classic (adventure), Mad Libs (fill-in-the-blank), Sleep (calming)
- Scene illustration generation (Gemini primary, OpenAI fallback using `gpt-image-1`)
- ElevenLabs TTS narration with 9 voices
- Background music (mode-specific MP3 assets)
- Hero creation with AI-generated avatar
- Child profiles with badges (12), streaks, and story history
- Parent controls with PIN protection (SHA-256 + salt hashed via expo-crypto; 5-attempt lockout)
- Story library with favorites and read tracking (storage + UI both wired)
- Smart story setting suggestions (AI-powered, time-of-day aware)
- Voice/audio client paths are contained for release: the navigation entry is removed, microphone permissions are excluded, and the static unavailable screen performs no recording or audio-network work
- Onboarding flow (welcome → quick-create → home)
- Unified settings system (SettingsContext + SettingsModal both using single AsyncStorage key)
- Security headers, CORS restrictions, rate limiting (in-memory + optional Cloudflare KV), input sanitization, load shedding, idempotency cache
- Supabase authentication (client session + server bearer-token verification); production fails closed when server auth configuration is absent
- COPPA parental-consent gate (`app/parental-consent.tsx`) + native Privacy Policy screen (`app/privacy.tsx`)
- Vitest and jest-expo component suites; exact-head counts belong in CI evidence rather than this mutable context file
- CI, publish, and release-proof workflows use locked installs, strict zero-warning lint, tests, typecheck, high-severity dependency audit, and build gates
- pino structured logging, in-process metrics, feature flags, circuit breakers, retry-with-jitter
- Sentry error tracking (`@sentry/node` server + `@sentry/react-native` client; active when SENTRY_DSN / EXPO_PUBLIC_SENTRY_DSN are set)

### Mobile Deployment
- **eas.json** configured — 3 profiles: development (APK+DevClient), preview (APK), production (AAB)
- **scripts/build-android.sh** — EAS build helper
- **docs/operations/DEPLOYMENT.md** — full EAS + Play Store runbook (§3)
- **docs/operations/EAS-SECRETS-CHECKLIST.md** — all required EAS secrets
- Android package: `com.infinityheroes.bedtime`
- iOS bundle: `com.infinityheroes.bedtime` (no App Store submission yet)
- EAS projectId `6aea7a34-65d8-4036-a1b8-9caed0b850fb` set in app.json

### Infrastructure (MCP-provisioned)
- **Supabase project:** `aeraxfupuvwiskmfjliq` (us-east-1, ACTIVE_HEALTHY)
  - Tables: `users`, `conversations`, `messages`, `sync_records`; RLS protects client cloud-sync records
  - URL: `https://aeraxfupuvwiskmfjliq.supabase.co`
  - DATABASE_URL format: `postgresql://postgres.aeraxfupuvwiskmfjliq:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
- **Cloudflare KV namespace:** `infinity-heroes-rate-limit` (id: `ed09afa77f9243bbb08f3dbe34df1e70`)
  - Enable by setting: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_KV_NAMESPACE_ID`, `CLOUDFLARE_API_TOKEN`
  - Falls back to in-memory Map when env vars are unset (existing behavior preserved)

### In Progress / Blocked
- Active release proof is tracked in issue #376; repository remediation is not release approval
- Supabase protected-branch migration history requires exact filename reconciliation and disposable-branch proof before production application
- Vercel is linked to the canonical repository, but the project Node setting is `24.x` while repository engines allow Node 20.19 or 22.13 ranges; provider configuration must be aligned after review
- EAS credential and exact-candidate artifact state require authoritative provider verification
- Dependency audit measured 4 moderate, 0 high, and 0 critical findings on 2026-07-19; do not use `npm audit fix --force`
- Received Sentry alert-notification evidence is still required; event emission alone is not proof

---

## Repository Structure

```
app/              Expo Router screens (file = route)
app/(tabs)/       Tab screens: index, create, library, saved, profile
components/       Reusable React Native components
constants/        types.ts, heroes.ts, colors.ts, timing.ts
lib/              Client utilities: storage.ts, ProfileContext, SettingsContext, AuthContext, query-client
server/           Express backend
server/ai/        Multi-provider AI router (router.ts, index.ts, providers/)
server/prompts.ts Story prompt builders + CHILD_SAFETY_RULES constant
server/routes/    Domain route modules, including account, health, privacy, story, images, TTS, music, suggestions, and video
server/routes.ts  Route composer and global API auth boundary
server/replit_integrations/audio/  Voice chat routes (wired, conditionally registered)
shared/           Drizzle schema + Zod types (used by client AND server)
scripts/          Build helpers: build-android.sh, build.js
docs/             Architecture, API, security, roadmap, CHANGELOG, ADRs, runbooks, agents
docs/operations/  DEPLOYMENT.md, EAS-SECRETS-CHECKLIST.md, OBSERVABILITY.md, SECRETS-ROTATION.md, BRANCH-PROTECTION-SETUP.md, README.md
__tests__/        Integration, unit, release-integrity, and jest-expo component tests
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile framework | Expo + React Native | SDK 55 / RN 0.83.10 |
| Router | Expo Router | v6 |
| Backend | Express.js | v5 |
| Language | TypeScript | 5.9.2 (strict) |
| AI (story primary) | Anthropic Claude | `claude-sonnet-4-6` |
| AI (image primary) | Gemini | `gemini-2.5-flash-image` |
| AI (fallbacks) | Gemini, OpenAI, OpenRouter | `gemini-2.5-flash` / `gpt-4o-mini` |
| TTS | ElevenLabs | eleven_multilingual_v2 |
| Database | PostgreSQL + Drizzle ORM | drizzle-orm 0.45 (Supabase hosted) |
| Client storage | AsyncStorage | — |
| Animation | react-native-reanimated | v4 |
| Build (Android) | EAS Build | eas-cli latest |
| Testing | Vitest + jest-expo | v4 / Jest 29 |
| Error tracking | Sentry | @sentry/node + @sentry/react-native |

---

## Android Package: com.infinityheroes.bedtime

Set in `app.json` → `expo.android.package`. This is the permanent Play Store identifier.
Cannot be changed after first Play Store submission.

## EAS Deployment Order

1. `npm install -g eas-cli`
2. `eas login`
3. `eas credentials --platform android` (set up managed keystore)
4. Set all API keys as EAS secrets: `eas secret:create --scope project --name KEY --value val`
5. See `docs/operations/EAS-SECRETS-CHECKLIST.md` for the full list
6. `bash scripts/build-android.sh preview` (test APK)
7. `bash scripts/build-android.sh production` (Play Store AAB)
8. Upload .aab to Play Console or `bash scripts/build-android.sh submit`

---

## Environment Variables Required

See `.env.example` for full list. For EAS builds, ALL vars must be set as EAS secrets.
Key vars:
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` (primary story provider)
- `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL` (primary image/suggestion provider)
- `ELEVENLABS_API_KEY` (required for narration)
- `EXPO_PUBLIC_API_URL` (required — points to Express server)
- `DATABASE_URL` (required for voice chat; use Supabase pooler URL above)
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (required for server-side production auth and account deletion)
- `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (client-visible identifiers required for Supabase Auth; never expose the service-role key)
- `SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN` (optional — enables Sentry error tracking)
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_KV_NAMESPACE_ID`, `CLOUDFLARE_API_TOKEN` (optional — enables persistent rate limiting)
- OpenAI, OpenRouter keys (optional, for AI fallback chain)

---

## Key Conventions

- All screens in `app/` use Expo Router file-based routing
- AI generation goes through `server/ai/router.ts` (not direct provider calls)
- Client-side data via AsyncStorage helpers in `lib/storage.ts` — never call AsyncStorage directly
- `EXPO_PUBLIC_*` vars are bundled into client APK — never put secrets there
- Protected `/api` routes require a verified Supabase bearer token in production; missing server auth configuration fails closed
- `CHILD_SAFETY_RULES` constant is in `server/prompts.ts` — must be in every story generation prompt
- Circuit breakers in `server/circuit-breaker.ts` wrap each AI provider (5 failures → 60s open)
- `server/rate-limit.ts` keys on the verified user ID when auth is active and falls back to IP
- `server/idempotency.ts` caches expensive POSTs by request hash for 5 minutes to prevent duplicate AI calls
- `server/routes.ts` is the ~43-line pure composer; all route logic lives in `server/routes/<domain>.ts` modules

---

## Recent Significant Changes

| Date | Change |
|------|--------|
| 2026-07-19 | PR #375 merged canonical Vercel provenance guards; active release ledger moved to issue #376; release posture remains NO GO |
| 2026-06-13 | Complete server/routes.ts migration: removed all inline handlers, added register*Routes() calls; routes.ts is now ~43 lines |
| 2026-06-13 | Provisioned Supabase project (aeraxfupuvwiskmfjliq, us-east-1); applied conversations+messages schema migration |
| 2026-06-13 | Added @sentry/node + @sentry/react-native; no-ops when SENTRY_DSN unset |
| 2026-06-13 | Added Cloudflare KV persistent rate limiting (namespace: ed09afa77f9243bbb08f3dbe34df1e70); falls back to in-memory Map |
| 2026-06-11 | Phase 2: COPPA parental-consent gate (`app/parental-consent.tsx`) + in-app Privacy Policy (`app/privacy.tsx`); 929 tests |
| 2026-06-11 | Phase 1: doc/code reconciliation + bug fixes (all_heroes badge, streaming model id, suggest-settings parsedJson) |
| 2026-04-24 | Thorough 3-way audit + remediation; Expo SDK 54 → 55; 919 → 1010 tests |
| 2026-03-27 | Firebase auth production guard; parent PIN hashing (SHA-256 + salt); dual-layer rate limiting |

---

## Known Tech Debt

| Item | Notes |
|------|-------|
| Dependency advisories | High and critical advisories block CI/publish/release proof; current exact-head output must be attached to the PR |
| Sentry DSN not yet configured | User must authenticate Sentry MCP and create project to get DSN |
| EAS secrets not set | Required before production build; see docs/operations/EAS-SECRETS-CHECKLIST.md |
