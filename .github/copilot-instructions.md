<!-- Last verified: 2026-08-14 -->
# GitHub Copilot Instructions — Infinity Heroes: Bedtime Chronicles

## Project facts

- Single full-stack repository: Expo client + Express API.
- Target audience is children ages 3–9; generated content must stay child-safe.
- Client stack: Expo SDK 55, React Native 0.83.10, React 19.2.0.
- Server stack: Express 5, TypeScript strict, Zod validation, Drizzle + PostgreSQL for voice chat and cloud sync.

## Always do

- Use `@/` imports for repo-root modules.
- Put route files in `app/`, reusable UI in `components/`, client helpers in `lib/`, server-only logic in `server/`.
- Use `StyleSheet.create()` and theme tokens from `constants/colors.ts`.
- Use `StyleSheet.absoluteFill`, not `absoluteFillObject`.
- Use `useLocalSearchParams<T>()` for typed route params.
- Route AI requests through `server/ai/` only.
- Sanitize user-controlled prompt inputs with the existing validation helpers in `server/validation.ts`.
- Keep `CHILD_SAFETY_RULES` in every story-generation path.
- Use `lib/storage.ts` helpers instead of direct AsyncStorage calls.
- Prefer existing docs in `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `CONVENTIONS.md` over inventing new patterns.

## Testing expectations

- Run `npm run typecheck` and `npm run lint` for code changes.
- Use `npm test` for server/shared/pure lib changes.
- Use `npm run test:components` for React Native component work.
- Documentation-only changes usually do not need app test runs unless they modify test-facing assets or config.

## Security rules

- Never commit secrets, tokens, or connection strings.
- Treat `EXPO_PUBLIC_*` variables as public.
- Keep protected route auth, TTS filename validation, and output safety behavior intact.
- Preserve rate limiting and compliance gates around expensive or child-data features.

## Anti-patterns to avoid

- Do not call AI providers directly from route handlers.
- Do not hardcode API base URLs.
- Do not add production `console.log` calls.
- Do not introduce `any` or `@ts-ignore` without necessity and justification.
- Do not create parallel settings or storage systems when `SettingsContext` or `lib/storage.ts` already owns the state.

## Useful references

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `CONVENTIONS.md`
- `AGENTS.md`
