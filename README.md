# Infinity Heroes: Bedtime Chronicles

<!-- Last verified: 2026-05-05 -->

An AI-powered interactive bedtime story app for children ages 3–9. Kids create their own superhero and embark on magical, personalized adventures with AI-generated stories, illustrations, and narration.

## Features

- **3 Story Modes:** Classic (adventure), Mad Libs (silly/funny), Sleep (calming/meditative)
- **AI Story Generation:** Multi-provider AI routing with automatic fallback (Anthropic → Gemini → OpenAI → OpenRouter)
- **AI Scene Illustrations:** Unique art for each story scene in randomized styles (watercolor, cel-shaded, collage, etc.)
- **Text-to-Speech Narration:** 9 unique narrator voices via ElevenLabs with per-mode voice matching
- **Hero Creator:** Create custom superheroes with name, title, power, and AI-generated avatar
- **Child Profiles:** Multi-child support with per-profile story history, badges, and streaks
- **Gamification:** 12 achievement badges, reading streaks, vocabulary words, and story completion rewards
- **Parent Controls:** Story length limits, bedtime scheduling, theme filtering, PIN protection
- **Voice Chat:** Talk to your hero (requires OpenAI audio API + PostgreSQL)
- **Video Generation:** Animated story scenes via OpenAI Sora (optional)
- **Background Music:** Mode-specific ambient music
- **Smart Suggestions:** AI-powered story setting recommendations based on time of day and child profile

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile Framework | Expo (React Native) | SDK 55 / RN 0.85.2 |
| Router | Expo Router (file-based) | v6 |
| Backend | Express.js (Node.js) | v5 |
| Language | TypeScript | 6.0 (strict) |
| AI Text | Anthropic Claude, Gemini, OpenAI, OpenRouter | fallback chain |
| AI Images | Gemini 2.5-flash-image, gpt-image-1 | fallback chain |
| TTS | ElevenLabs | eleven_multilingual_v2 |
| Database | PostgreSQL + Drizzle ORM | voice chat only |
| Client Storage | AsyncStorage | stories, profiles, settings, badges |
| Animations | react-native-reanimated | v4 |
| Server State | TanStack React Query | v5 |
| Testing | Vitest | v4 |
| CI/CD | GitHub Actions + EAS Build | — |

## Prerequisites

- **Node.js 20 or 22** (npm ≥ 10) — see `.nvmrc`
- At least one AI provider API key — `AI_INTEGRATIONS_GEMINI_API_KEY` recommended
- ElevenLabs API key — for TTS narration (optional, app works without it)
- PostgreSQL database — optional, required only for voice chat

## Quick Start

```bash
# 1. Install dependencies (patch-package runs automatically in postinstall)
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env — set at minimum AI_INTEGRATIONS_GEMINI_API_KEY

# 3. Start backend (Express on port 5000) and frontend in separate terminals
npm run server:dev
npx expo start          # or: npm run expo:dev (inside Replit)
```

## Environment Variables

See [`.env.example`](./.env.example) for all variables with inline descriptions.

| Variable | Required | Description |
|----------|---------|-------------|
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Yes (min 1 AI key) | Primary AI provider (Gemini 2.5-flash) |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Optional | Custom/proxy base URL override for Gemini API |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Recommended | AI fallback + voice chat |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Optional | Custom/proxy base URL override for OpenAI API |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Recommended | AI story generation (priority 1) |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Optional | Custom/proxy base URL override for Anthropic API |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | Optional | xAI / Mistral / Cohere / Meta Llama fallbacks |
| `AI_INTEGRATIONS_OPENROUTER_BASE_URL` | Optional | Custom/proxy base URL override for OpenRouter API |
| `ELEVENLABS_API_KEY` | Optional | TTS narration |
| `DATABASE_URL` | Optional | PostgreSQL — required for voice chat |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional (prod required) | Supabase server-side token verification; omit to bypass auth in dev. Server-only — never expose client-side |
| `EXPO_PUBLIC_SUPABASE_URL` | Optional (prod required) | Supabase project URL (client) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Optional (prod required) | Supabase anon/public key (client) |
| `EXPO_PUBLIC_API_URL` | Optional | Override API server base URL |
| `PORT` | Optional | Server port (default: 5000) |
| `RATE_LIMIT_MAX` | Optional | Requests per window (default: 10) |
| `RATE_LIMIT_WINDOW_MS` | Optional | Rate limit window in ms (default: 60000) |
| `STORY_MAX_TOKENS` | Optional | Per-call LLM token ceiling for story generation, cost guard (default: 8192) |
| `SUGGEST_MAX_TOKENS` | Optional | Per-call LLM token ceiling for settings suggestions, cost guard (default: 2048) |
| `OPENAI_API_KEY` | Optional | Direct key for Sora video generation |

**Never** put real secret values in `.env.example` or commit `.env`. For EAS builds, set all vars as EAS secrets.

## Running Tests

```bash
npm test                  # Single run (919 tests across 15 files)
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report (≥80% branch target for server utilities)
```

## Code Quality

```bash
npm run typecheck         # Zero TypeScript errors required
npm run lint              # ESLint (expo config)
npm run lint:fix          # Auto-fix lint issues
npm run preflight         # typecheck + lint + test in one command
```

## Deployment

- **Replit (primary):** Click **Deploy** in the Replit workspace. See [`docs/runbooks/deploy.md`](docs/runbooks/deploy.md) for the full procedure.
- **Vercel:** `api/server.mjs` is the serverless entry point. Config in `vercel.json`. **Production deploys must currently be triggered via the Vercel CLI** — see [`DEPLOY.md`](DEPLOY.md) for the reason (Hobby plan + private repo commit-author check) and the exact commands.
- **Android (Play Store):** Use EAS Build — see [`docs/operations/PLAY_STORE_DEPLOYMENT.md`](docs/operations/PLAY_STORE_DEPLOYMENT.md).

Build commands:
```bash
npm run server:build         # Bundle server → server_dist/index.js (esbuild)
npm run expo:static:build    # Build Expo web bundle → web-build/
npm run server:prod          # Run production server bundle
```

## Project Structure

```
app/                    # Expo Router screens (file path = route)
  (tabs)/               # Tab navigation: index, create, library, saved, profile
  story.tsx             # Story reading/playback screen (~1600 lines)
  completion.tsx        # Story completion + badge awarding
  story-details.tsx     # Story customization wizard (Classic mode)
  madlibs.tsx           # Mad Libs mode wizard
  sleep-setup.tsx       # Sleep mode setup
  quick-create.tsx      # Onboarding hero creation
  settings.tsx          # App settings screen
  trophies.tsx          # Badge collection view
  welcome.tsx           # Onboarding splash
components/             # Reusable React Native components (PascalCase.tsx)
constants/              # Static data and configuration
  types.ts              # TypeScript interfaces (canonical type definitions)
  heroes.ts             # 8 pre-defined hero templates
  colors.ts             # Cosmic theme color palette
  timing.ts             # Animation/transition duration constants
lib/                    # Client utilities and state management
  SettingsContext.tsx   # App settings (React Context — canonical settings source)
  ProfileContext.tsx    # Child profile context
  AuthContext.tsx       # Supabase authentication context
  storage.ts            # AsyncStorage helpers (stories, profiles, badges, streaks)
  query-client.ts       # TanStack React Query config
server/                 # Express backend
  index.ts              # Server bootstrap, security middleware, CORS, shutdown
  routes.ts             # All API route registrations
  prompts.ts            # Story system/user prompt builders + CHILD_SAFETY_RULES
  validation.ts         # Zod schemas + sanitizeString()
  auth.ts               # Supabase bearer-token (JWT) middleware
  rate-limit.ts         # Per-IP sliding-window rate limiter
  ai/                   # Multi-provider AI abstraction layer
    router.ts           # AIRouter: fallback chains, circuit breakers, retry
    index.ts            # Provider registration + status
    providers/          # gemini.ts, openai.ts, anthropic.ts, openrouter.ts
  elevenlabs.ts         # TTS voice definitions + audio generation
  suno.ts               # Background music file serving
  video.ts              # OpenAI Sora video generation
  db.ts                 # Drizzle ORM + PostgreSQL client
  replit_integrations/  # Replit-provided voice chat modules (do not modify)
shared/                 # Shared between client and server
  schema.ts             # Drizzle ORM table definitions
  models/chat.ts        # conversations + messages tables
docs/                   # All project documentation
  ARCHITECTURE.md       # System design and data flow
  API.md                # API endpoint reference (40+ endpoints)
  SECURITY.md           # Security policy and OWASP assessment
  ROADMAP.md            # Prioritized development roadmap
  CHANGELOG.md          # Version history
  adr/                  # Architecture Decision Records (ADR-0001 – ADR-0005)
  agents/               # 12 specialized AI agent instruction files
  best-practices/       # Accessibility, performance, security, testing guides
  operations/           # PLAY_STORE_DEPLOYMENT.md
  runbooks/             # deploy, rollback, incident-response, provider-outage
api/                    # Vercel serverless entry point
  server.mjs            # Wraps server_dist/index.js for Vercel
scripts/                # Build helpers
patches/                # patch-package patches (do not modify without approval)
```

## API Endpoints

See [docs/API.md](docs/API.md) for full reference.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/ai-providers` | Provider availability status |
| POST | `/api/generate-story` | Generate a complete story (JSON) |
| POST | `/api/generate-story-stream` | Generate story via SSE stream |
| POST | `/api/generate-avatar` | Generate hero avatar image |
| POST | `/api/generate-scene` | Generate story scene illustration |
| POST | `/api/tts` | Text-to-speech (returns audio URL) |
| GET | `/api/tts-audio/:file` | Serve cached TTS audio |
| POST | `/api/tts-preview` | Voice preview audio |
| GET | `/api/voices` | List available narrator voices |
| GET | `/api/music/:mode` | Serve background music |
| POST | `/api/suggest-settings` | AI-powered story setting suggestions |
| POST | `/api/generate-video` | Start video generation job |
| GET | `/api/video-status/:id` | Check video generation progress |
| GET | `/api/conversations` | List voice chat conversations |
| POST | `/api/conversations` | Create new conversation |
| POST | `/api/conversations/:id/messages` | Send voice message (SSE response) |

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [API.md](docs/API.md) | All endpoints with request/response schemas |
| [SECURITY.md](docs/SECURITY.md) | Security policy, OWASP assessment, and vulnerability reporting |
| [ROADMAP.md](docs/ROADMAP.md) | Prioritized development roadmap |
| [CHANGELOG.md](docs/CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branch conventions, PR process, testing requirements |
| [CONVENTIONS.md](CONVENTIONS.md) | Code standards: naming, styling, error handling, APIs |
| [GLOSSARY.md](GLOSSARY.md) | Domain vocabulary reference |
| [AGENTS.md](AGENTS.md) | AI agent configuration index |
| [TODO.md](TODO.md) | WSJF-prioritized backlog |
| [docs/agents/README.md](docs/agents/README.md) | Specialized AI agent catalog |
| [docs/best-practices/](docs/best-practices/) | Accessibility, performance, security, testing guides |
| [docs/runbooks/](docs/runbooks/) | Operational runbooks (deploy, rollback, incident response) |
| [docs/adr/](docs/adr/) | Architecture Decision Records |
| [docs/operations/PLAY_STORE_DEPLOYMENT.md](docs/operations/PLAY_STORE_DEPLOYMENT.md) | EAS Build + Play Store deployment guide |

## License

<!-- HUMAN INPUT REQUIRED: No LICENSE file exists. Select and add a license (e.g., MIT, Apache 2.0, or a proprietary license) before publishing to any app store or making the repository public. -->
Private project — no license file has been added yet. All rights reserved until a license is selected and committed.
