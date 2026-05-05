<!-- Last verified: 2026-05-05 -->
<!-- Update this file when significant architectural changes occur or new major work begins -->

# MEMORY.md — Persistent AI Agent Context

Read this file at session start to rapidly build project context. Keep it dense and factual.

**Last Updated:** 2026-05-05

---

## Project Identity

- **Name:** Infinity Heroes: Bedtime Chronicles
- **Type:** Children's bedtime story app (ages 3–9)
- **Platform:** Expo SDK 55 (React Native 0.85.2) + Express.js v5 backend
- **Language:** TypeScript 6.0 (strict throughout)
- **Status:** Active development; Android Play Store deployment in progress

---

## Current State (as of 2026-05-05)

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
- Voice chat backend (PostgreSQL + Express routes wired up)
- Onboarding flow (welcome → quick-create → home)
- Unified settings system (SettingsContext + SettingsModal both using single AsyncStorage key)
- Security headers, CORS restrictions, rate limiting, input sanitization, load shedding, idempotency cache
- Firebase anonymous authentication (client + server)
- Vitest test suite (919 tests across 15 files, all passing — includes integration suite via supertest)
- `sanitizeErrorMessage()` utility for safe error responses
- CI pipeline: 9 GitHub Actions workflows (ci, eas-build, vercel-deploy, publish, markdown-link-check, agent-pr-review, agent-security, auto-merge, branch-cleanup, stale)
- Lychee markdown link checker (`.github/workflows/markdown-link-check.yml`, `.lycheeignore`)
- `npm run audit` and `npm run audit:fix` scripts
- pino structured logging, in-process metrics, feature flags, circuit breakers, retry-with-jitter

### Mobile Deployment
- **eas.json** configured — 3 profiles: development (APK+DevClient), preview (APK), production (AAB)
- **scripts/build-android.sh** — EAS build helper
- **docs/operations/PLAY_STORE_DEPLOYMENT.md** — full EAS runbook
- Android package: `com.infinityheroes.bedtime`
- iOS bundle: `com.infinityheroes.bedtime` (no App Store submission yet)
- EAS projectId `6aea7a34-65d8-4036-a1b8-9caed0b850fb` set in app.json

### In Progress / Partially Done
- Voice chat mobile UI (backend is ready; Expo screen not built yet)

### Blocked / Not Started
- EAS secrets (API keys must be set via `eas secret:create` before production builds work)
- Remaining npm vulnerabilities (14 remaining — 8 low, 4 moderate, 2 high — highs are in firebase-admin/expo-asset deep deps, blocked on upstream)

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
server/replit_integrations/audio/  Voice chat routes (wired, UI pending)
shared/           Drizzle schema + Zod types (used by client AND server)
scripts/          Build helpers: build-android.sh, build.js
docs/             Architecture, API, security, roadmap, CHANGELOG, ADRs, runbooks, agents
docs/operations/  PLAY_STORE_DEPLOYMENT.md
__tests__/        Integration tests (api-routes.test.ts uses supertest)
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
| Database | PostgreSQL + Drizzle ORM | drizzle-orm 0.45 |
| Client storage | AsyncStorage | — |
| Animation | react-native-reanimated | v4 |
| Build (Android) | EAS Build | eas-cli latest |
| Testing | Vitest | v4 (919 tests, 15 files) |

---

## Android Package: com.infinityheroes.bedtime

Set in `app.json` → `expo.android.package`. This is the permanent Play Store identifier.
Cannot be changed after first Play Store submission.

## EAS Deployment Order

1. `npm install -g eas-cli`
2. `eas login`
3. `eas credentials --platform android` (set up managed keystore)
4. Set all API keys as EAS secrets: `eas secret:create --scope project --name KEY --value val`
5. `bash scripts/build-android.sh preview` (test APK)
6. `bash scripts/build-android.sh production` (Play Store AAB)
7. Upload .aab to Play Console or `bash scripts/build-android.sh submit`

---

## Environment Variables Required

See `.env.example` for full list. For EAS builds, ALL vars must be set as EAS secrets.
Key vars:
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` (primary story provider)
- `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL` (primary image/suggestion provider)
- `ELEVENLABS_API_KEY` (required for narration)
- `EXPO_PUBLIC_API_URL` (required — points to Express server)
- `DATABASE_URL` (required for voice chat only)
- `FIREBASE_SERVICE_ACCOUNT_KEY` (required for production auth; omit for dev mode bypass)
- `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID` (required for client Firebase Auth)
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

---

## Recent Significant Changes

| Date | Change |
|------|--------|
| 2026-04-24 | Thorough 3-way audit + remediation: protobufjs CVE fixed, AUTH_DISABLED removed, AsyncStorage violations fixed, stale-closure fix in create.tsx, supertest added, 895 → 919 tests |
| 2026-04-24 | Expo SDK 54 → 55 (expo 55.0.17; expo-image, expo-crypto, expo-symbols bumped to SDK-55 line) |
| 2026-03-27 | Firebase auth production guard added; parent PIN hashing (SHA-256 + salt); dual-layer rate limiting |
| 2026-03-25 | Input validation hardened; conversation pagination; story feedback/rating UI |
| 2026-03-13 | Voice chat routes registered; security headers; comprehensive documentation created |

---

## Known Tech Debt

| Item | Notes |
|------|-------|
| `app/story.tsx` monolith | ~1627 lines; top refactor candidate but no regression since last audit |
| `server/routes.ts` size | ~550 lines; validation, prompts, rate-limit extracted but still large |
| AI router greedy-JSON regex | `router.ts` uses `\{[\s\S]*\}` which can grab across multiple JSON objects; see docs/TEST-COVERAGE-ANALYSIS.md |
| Streaming model field | `router.ts` reports `provider.name` as `model` in streaming chunks (should be model ID) |
| 14 npm audit vulns | 8 low, 4 moderate, 2 high — highs are in firebase-admin/expo-asset deep deps; blocked on upstream |
| Voice chat UI | Backend complete; mobile screen not yet built |
