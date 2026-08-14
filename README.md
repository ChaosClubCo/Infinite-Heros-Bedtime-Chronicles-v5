<!-- Last verified: 2026-08-14 -->
# Infinity Heroes: Bedtime Chronicles

![Node 22.x](https://img.shields.io/badge/node-22.x-339933)
![Expo SDK 55](https://img.shields.io/badge/expo-SDK%2055-4630EB)
![TypeScript Strict](https://img.shields.io/badge/typescript-strict-3178C6)
![CI GitHub Actions](https://img.shields.io/badge/ci-GitHub%20Actions-2088FF)

AI-powered bedtime stories for children ages 3–9, built with Expo and an Express API.
Kids choose a hero, story mode, and bedtime setting, then receive a narrated, illustrated, child-safe story with badges, streaks, and optional cloud sync.

## What this project does

- Generates bedtime stories in three kid-safe modes: Classic, Mad Libs, and Sleep.
- Produces scene artwork, narration audio, and optional video through a server-side multi-provider AI router.
- Stores stories, badges, streaks, and settings locally first, with optional Supabase-backed cloud sync for non-PII progress data.

## Architecture overview

```text
Expo app (app/, components/, lib/)
  -> HTTPS/JSON + SSE
Express API (server/)
  -> AI router (Anthropic -> Gemini -> OpenAI -> OpenRouter)
  -> ElevenLabs TTS
  -> Supabase Auth + Postgres
  -> Cloudflare KV / R2 (optional)
```

### Major boundaries

- **Client:** Expo Router screens, React Context state, AsyncStorage persistence, React Query request layer.
- **API server:** Input validation, auth gates, rate limiting, compliance checks, AI orchestration, TTS/video/image endpoints.
- **External services:** Anthropic, Gemini, OpenAI, OpenRouter, ElevenLabs, Supabase, Cloudflare, Sentry, Vercel, EAS Build.

For the full system design, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Tech stack

| Layer | Technology | Version / Notes |
|------|------------|-----------------|
| Client | Expo + React Native + React | `expo ~55.0.28`, `react-native 0.83.10`, `react 19.2.0` |
| Routing | Expo Router | `~55.0.17` |
| Backend | Express | `^5.0.1` |
| Language | TypeScript | `~5.9.2`, strict mode |
| Validation | Zod | `^4.4.3` |
| Database | PostgreSQL + Drizzle ORM | Supabase-hosted; voice chat + cloud sync |
| Client persistence | AsyncStorage | offline-first local storage |
| Server state | TanStack React Query | `^5.101.4` |
| TTS | ElevenLabs | `eleven_multilingual_v2` |
| Observability | pino + Sentry | optional DSNs |
| Build / deploy | esbuild, GitHub Actions, Vercel, EAS Build | serverless web/API + native mobile builds |

## Prerequisites

- Node.js `>=20.19 <21` or `>=22.13 <23`
- npm `11.x`
- At least one AI provider key; Gemini is the simplest starting point
- Optional: ElevenLabs key for narration, Supabase project for auth/cloud sync, PostgreSQL for voice chat
- Optional accounts: Vercel (web/API hosting), Expo/EAS (mobile builds), Sentry (error tracking)

## Quickstart

```bash
# 1. Clone and install
git clone https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5.git
cd Infinite-Heros-Bedtime-Chronicles-v5
npm install

# 2. Configure environment
cp .env.example .env
# edit .env and add at minimum AI_INTEGRATIONS_GEMINI_API_KEY

# 3. Start the API
npm run server:dev

# 4. Start the Expo app in a second terminal
npm run dev:expo
# or outside this local-web flow:
# npx expo start
```

### Replit dev flow

Use `npm run expo:dev` inside Replit. It injects the Replit-specific Expo host variables automatically.

## Environment variables

The full list lives in [`.env.example`](./.env.example). These are the most important values:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Recommended | Primary image provider and a text fallback | `AIzaSy-example` |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Recommended | Primary story-generation provider | `sk-ant-example` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Optional | Text/image fallback and voice-chat dependency | `sk-proj-example` |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | Optional | Extra text fallbacks | `sk-or-v1-example` |
| `ELEVENLABS_API_KEY` | Optional | Narration audio generation | `sk_12345example` |
| `DATABASE_URL` | Optional | PostgreSQL connection string for voice chat and migrations | `postgresql://postgres.example:<password>@host:6543/postgres` |
| `SUPABASE_URL` | Optional | Server-side Supabase project URL | `https://example.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional in dev, required in prod for auth-gated routes | Server-only Supabase service key | `service-role-example` |
| `EXPO_PUBLIC_SUPABASE_URL` | Optional | Client-visible Supabase URL | `https://example.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Optional | Client-visible Supabase anon key | `sb-public-anon-example` |
| `SENTRY_DSN` | Optional | Server error tracking | `https://public@example.ingest.sentry.io/1` |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional | Client error tracking | `https://public@example.ingest.sentry.io/2` |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Enables KV and R2 integrations | `0123456789abcdef` |
| `CLOUDFLARE_KV_NAMESPACE_ID` | Optional | Persistent rate-limit/idempotency state | `ed09afa77f9243bbb08f3dbe34df1e70` |
| `CLOUDFLARE_R2_BUCKET` | Optional | Durable TTS cache bucket | `infinity-heroes-tts` |
| `OPENAI_API_KEY` | Optional | Direct Sora/video integration key | `sk-proj-example` |
| `GITHUB_WEBHOOK_SECRET` | Optional | HMAC secret for `/api/github/webhook` | `ghs_example_secret` |

Never commit real secrets. `EXPO_PUBLIC_*` values are bundled into the client app and must never contain server-only credentials.

## Development commands

```bash
# API
npm run server:dev
npm run server:build
npm run server:prod

# Expo
npm run dev:expo
npm run expo:dev          # Replit-specific
npm run expo:static:build

# Quality gates
npm run typecheck
npm run lint
npm run lint:fix
npm test
npm run test:components
npm run test:coverage
npm run preflight
```

## Testing

- **Vitest:** server, shared, and pure `lib/` units (`npm test`)
- **Jest Expo:** React Native component coverage (`npm run test:components`)
- **Coverage target:** `>=80%` branch coverage for the Vitest coverage set (`vitest.config.ts`)
- **Current documented snapshot:** 1,453 passing tests (1,401 Vitest + 52 Jest) last measured on 2026-07-27; re-run the suites before updating that count

See [docs/best-practices/TESTING.md](./docs/best-practices/TESTING.md).

## Deployment

- **Web/API:** Vercel serverless via [`vercel.json`](./vercel.json) and the workflows in [`.github/workflows/`](./.github/workflows/)
- **Native mobile:** Expo Application Services (EAS) using [`eas.json`](./eas.json)
- **CI/CD:** GitHub Actions handles lint, typecheck, tests, web build, release proof, link checking, and deployment workflows

Deployment references:
- [DEPLOY.md](./DEPLOY.md) — production deployment policy
- [docs/operations/DEPLOYMENT.md](./docs/operations/DEPLOYMENT.md) — detailed deployment manual
- [docs/runbooks/deploy.md](./docs/runbooks/deploy.md) — operational deploy runbook
- [docs/runbooks/rollback.md](./docs/runbooks/rollback.md) — rollback steps

## Project structure

```text
app/                    Expo Router screens and route groups
components/             Reusable React Native UI components
constants/              Shared constants, hero catalog, color/timing tokens, app types
lib/                    Client utilities, contexts, storage helpers, sync engine, hooks
server/                 Express server, AI router, middleware, route modules, compliance gates
shared/                 Types and database schema shared across client/server
api/                    Vercel serverless entrypoint
scripts/                Build, verification, and release-support scripts
docs/                   Architecture, API, security, operations, ADRs, runbooks, agent docs
supabase/               Supabase migrations and related assets
__tests__/              Integration and component tests
```

## Key features and constraints

- Three story modes: `classic`, `madlibs`, `sleep`
- Child-safety rules are mandatory for every story prompt and output-safety review
- All AI calls must go through `server/ai/`
- Voice chat is conditional and fail-closed behind compliance + dependency checks
- Cloud sync is opt-in and excludes child-profile PII

## Documentation map

| Document | Purpose |
|----------|---------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Canonical system design, data flow, and infrastructure topology |
| [docs/API.md](./docs/API.md) | REST endpoint reference |
| [docs/SECURITY.md](./docs/SECURITY.md) | Security policy, controls, and reporting |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution workflow |
| [CONVENTIONS.md](./CONVENTIONS.md) | Code standards and repo conventions |
| [AGENTS.md](./AGENTS.md) | Cross-agent coordination rules |
| [CLAUDE.md](./CLAUDE.md) / [GEMINI.md](./GEMINI.md) / [.github/copilot-instructions.md](./.github/copilot-instructions.md) | AI agent operating context |
| [MEMORY.md](./MEMORY.md) | Dense project context for future sessions |
| [TODO.md](./TODO.md) | WSJF-prioritized backlog |
| [docs/adr/README.md](./docs/adr/README.md) | ADR process and index |
| [docs/runbooks/README.md](./docs/runbooks/README.md) | Operational runbooks |
| [docs/operations/README.md](./docs/operations/README.md) | Operational reference set |

## License

All rights reserved. See [LICENSE](./LICENSE).
