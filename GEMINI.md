<!-- Last verified: 2026-08-14 -->
# GEMINI.md — Gemini CLI Agent Context

## Project context

- Repository: `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`
- Type: single full-stack Expo + Express application
- Product: child-safe bedtime story app for ages 3–9
- Primary runtime: Expo SDK 55 client + Express 5 API + TypeScript strict mode

## Tech stack

| Concern | Technology |
|---------|------------|
| Client | Expo `~55.0.28`, React Native `0.83.10`, React `19.2.0` |
| Routing | Expo Router `~55.0.17` |
| API | Express `^5.0.1` |
| Validation | Zod `^4.4.3` |
| Database | PostgreSQL + Drizzle ORM (Supabase-hosted) |
| State | React Context + TanStack React Query v5 |
| Local storage | AsyncStorage helpers in `lib/storage.ts` |
| AI text | Anthropic primary, then Gemini, OpenAI, OpenRouter |
| AI image | Gemini primary, OpenAI fallback |
| TTS | ElevenLabs |
| Builds | esbuild, GitHub Actions, Vercel, EAS Build |

## Repository boundaries

- `app/` = Expo Router screens
- `components/` = reusable React Native UI
- `lib/` = client helpers, contexts, sync engine, storage
- `server/` = Express routes, middleware, AI router, compliance gates
- `shared/` = types and schema shared by client and server
- `docs/` = canonical architecture, security, ADRs, and runbooks

## Conventions to follow

- Use TypeScript strict types; avoid `any` unless annotated with `// intentional: <reason>`.
- Use `@/` imports for repository-root aliases.
- Put screens in `app/`, reusable UI in `components/`, and shared pure utilities in `lib/` or `server/`.
- Use `StyleSheet.create()` for styles and theme tokens from `constants/colors.ts`.
- Use `StyleSheet.absoluteFill`, not `absoluteFillObject`.
- Use `useLocalSearchParams<T>()` for typed Expo Router params.
- Route all AI work through `server/ai/`; never call providers directly from a route.
- Sanitize user-controlled prompt input with `sanitizeString()` or the existing request schemas in `server/validation.ts`.

## Security constraints

- Never commit API keys, DSNs, tokens, or connection strings.
- `EXPO_PUBLIC_*` variables are public client config only.
- `CHILD_SAFETY_RULES` must stay in every story-generation prompt path.
- Protected routes rely on Supabase bearer-token verification in production.
- TTS files must remain constrained to `/^[a-f0-9]+\.mp3$/`.
- Voice chat and other child-data processing features fail closed behind compliance gates.

## Build, test, and verification commands

```bash
npm install
npm run server:dev
npm run dev:expo
npm run typecheck
npm run lint
npm test
npm run test:components
npm run test:coverage
npm run server:build
npm run expo:static:build
npm run preflight
```

## Common workflows

### Add an API endpoint
1. Create or update the relevant module under `server/routes/`.
2. Validate request data with `server/validation.ts` patterns or route-local Zod.
3. Apply existing rate-limit and error-handling helpers.
4. Document the endpoint in `docs/API.md`.

### Add a client screen
1. Create the route file in `app/`.
2. Use safe area handling, haptics, and existing color/font tokens.
3. Keep storage access in `lib/storage.ts` helpers or React Context, not inline AsyncStorage calls.

### Update auth, storage, or sync behavior
1. Check `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `MEMORY.md` first.
2. Preserve the offline-first model.
3. Avoid syncing child-profile PII.

## Known gotchas

- `npm run dev` exists but is POSIX-only; use `npm run server:dev` and `npm run dev:expo` directly when in doubt.
- `npm run expo:dev` is Replit-specific.
- Voice chat is conditionally registered and not always available in production builds.
- `server/routes.ts` is a thin composer; domain logic belongs in `server/routes/*`.
- `.github/agents/` should not be edited unless the task is explicitly about GitHub custom agents.
- `.agents/` contains vendored skill docs and is excluded from normal app lint/type flows.

## References

- [README.md](./README.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/SECURITY.md](./docs/SECURITY.md)
- [CONVENTIONS.md](./CONVENTIONS.md)
- [AGENTS.md](./AGENTS.md)
