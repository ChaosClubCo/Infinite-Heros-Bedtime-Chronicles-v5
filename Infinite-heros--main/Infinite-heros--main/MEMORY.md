<!-- Last verified: 2026-06-13 -->
<!-- Update this file when significant architectural changes occur or new major work begins -->

# MEMORY.md — Persistent AI Agent Context

Read this file at session start to rapidly build project context. Keep it dense and factual.

**Last Updated:** 2026-06-13

---

## Project Identity

- **Name:** Infinity Heroes: Bedtime Chronicles
- **Type:** Children's bedtime story app (ages 3–9)
- **Platform:** Expo SDK 55 (React Native 0.85.2) + Express.js v5 backend
- **Language:** TypeScript 6.0 (strict throughout)
- **Status:** Launch-ready; Phase 5 (EAS build + Play Store) is next

---

## Current State (as of 2026-06-13)

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
- Voice chat backend (PostgreSQL + Express routes wired up) + full mobile UI (`app/voice-chat.tsx`, 672 lines)
- Onboarding flow (welcome → quick-create → home)
- Unified settings system (SettingsContext + SettingsModal both using single AsyncStorage key)
- Security headers, CORS restrictions, rate limiting (in-memory + optional Cloudflare KV), input sanitization, load shedding, idempotency cache
- Firebase anonymous authentication (client + server)
- COPPA parental-consent gate (`app/parental-consent.tsx`) + native Privacy Policy screen (`app/privacy.tsx`)
- Vitest test suite (1010 tests across 41 files, all passing)
- CI pipeline: 9 GitHub Actions workflows (ci, eas-build, vercel-deploy, publish, markdown-link-check, agent-pr-review, agent-security, auto-merge, branch-cleanup, stale)
- pino structured logging, in-process metrics, feature flags, circuit breakers, retry-with-jitter
- Sentry error tracking (`@sentry/node` server + `@sentry/react-native` client; active when SENTRY_DSN / EXPO_PUBLIC_SENTRY_DSN are set)

### Mobile Deployment
- **eas.json** configured — 3 profiles: development (APK+DevClient), preview (APK), production (AAB)
- **scripts/build-android.sh** — EAS build helper
- **docs/operations/PLAY_STORE_DEPLOYMENT.md** — full EAS runbook
- **docs/operations/EAS-SECRETS-CHECKLIST.md** — all required EAS secrets
- Android package: `com.infinityheroes.bedtime`
- iOS bundle: `com.infinityheroes.bedtime` (no App Store submission yet)
- EAS projectId `6aea7a34-65d8-4036-a1b8-9caed0b850fb` set in app.json

### Infrastructure (MCP-provisioned)
- **Supabase project:** `aeraxfupuvwiskmfjliq` (us-east-1, ACTIVE_HEALTHY)
  - Tables: `users`, `conversations`, `messages` (voice chat schema)
  - URL: `https://aeraxfupuvwiskmfjliq.supabase.co`
  - DATABASE_URL format: `postgresql://postgres.aeraxfupuvwiskmfjliq:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
- **Cloudflare KV namespace:** `infinity-heroes-rate-limit` (id: `ed09afa77f9243bbb08f3dbe34df1e70`)
  - Enable by setting: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_KV_NAMESPACE_ID`, `CLOUDFLARE_API_TOKEN`
  - Falls back to in-memory Map when env vars are unset (existing behavior preserved)

### In Progress / Blocked
- EAS secrets setup (API keys must be set via `eas secret:create` before production builds work)
- Remaining npm vulnerabilities (2 high in firebase-admin transitive deps, blocked on upstream)
- Sentry DSN (user must authenticate Sentry MCP and create a project to get the DSN)

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
server/routes/    Domain modules: health.ts, story.ts, images.ts, tts.ts, music.ts, suggest.ts, video.ts, context.ts, helpers.ts
server/routes.ts  ~43-line pure composer (imports + calls register*Routes)
server/replit_integrations/audio/  Voice chat routes (wired, conditionally registered)
shared/           Drizzle schema + Zod types (used by client AND server)
scripts/          Build helpers: build-android.sh, build.js
docs/             Architecture, API, security, roadmap, CHANGELOG, ADRs, runbooks, agents
docs/operations/  PLAY_STORE_DEPLOYMENT.md, EAS-SECRETS-CHECKLIST.md
__tests__/        Integration + unit tests (1010 total)
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile framework | Expo + React Native | SDK 55 / RN 0.85.2 |
| Router | Expo Router | v6 |
| Backend | Express.js | v5 |
| Language | TypeScript | 6.0 (strict) |
| AI (story primary) | Anthropic Claude | `claude-sonnet-4-6` |
| AI (image primary) | Gemini | `gemini-2.5-flash-image` |
| AI (fallbacks) | Gemini, OpenAI, OpenRouter | `gemini-2.5-flash` / `gpt-4o-mini` |
| TTS | ElevenLabs | eleven_multilingual_v2 |
| Database | PostgreSQL + Drizzle ORM | drizzle-orm 0.45 (Supabase hosted) |
| Client storage | AsyncStorage | — |
| Animation | react-native-reanimated | v4 |
| Build (Android) | EAS Build | eas-cli latest |
| Testing | Vitest | v4 (1010 tests, 41 files) |
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
- `FIREBASE_SERVICE_ACCOUNT_KEY` (required for production auth; omit for dev mode bypass)
- `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID` (required for client Firebase Auth)
- `SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN` (optional — enables Sentry error tracking)
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_KV_NAMESPACE_ID`, `CLOUDFLARE_API_TOKEN` (optional — enables persistent rate limiting)
- OpenAI, OpenRouter keys (optional, for AI fallback chain)

---

## Key Conventions

- All screens in `app/` use Expo Router file-based routing
- AI generation goes through `server/ai/router.ts` (not direct provider calls)
- Client-side data via AsyncStorage helpers in `lib/storage.ts` — never call AsyncStorage directly
- `EXPO_PUBLIC_*` vars are bundled into client APK — never put secrets there
- All POST API endpoints require Firebase Auth token in production (dev mode bypasses auth)
- `CHILD_SAFETY_RULES` constant is in `server/prompts.ts` — must be in every story generation prompt
- Circuit breakers in `server/circuit-breaker.ts` wrap each AI provider (5 failures → 60s open)
- `server/rate-limit.ts` keys on `req.user.uid` (Firebase UID) when auth is active, falls back to IP
- `server/idempotency.ts` caches expensive POSTs by request hash for 5 minutes to prevent duplicate AI calls
- `server/routes.ts` is the ~43-line pure composer; all route logic lives in `server/routes/<domain>.ts` modules

---

## Recent Significant Changes

| Date | Change |
|------|--------|
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
| 14 npm audit vulns | 2 high in firebase-admin transitive chain; blocked on upstream; CI at --audit-level=critical |
| Sentry DSN not yet configured | User must authenticate Sentry MCP and create project to get DSN |
| EAS secrets not set | Required before production build; see docs/operations/EAS-SECRETS-CHECKLIST.md |
