<!-- Last verified: 2026-08-14 -->
# CONVENTIONS.md — Code Standards and Repository Patterns

This file is the canonical source for repository conventions. When lint, type, framework, or platform tooling disagrees with this document, follow the tooling.

## Naming conventions

| Thing | Convention | Examples |
|------|------------|----------|
| Expo Router screens | `kebab-case.tsx` | `story-details.tsx`, `sleep-setup.tsx` |
| React components | `PascalCase.tsx` | `HeroCard.tsx`, `StoryTopBar.tsx` |
| Hooks / utilities | `camelCase.ts` or `useXxx.ts` | `storage.ts`, `useStoryAudio.ts` |
| Constants files | `camelCase.ts` | `colors.ts`, `story-theme.ts` |
| Docs | root docs use stable names; ADRs use `NNNN-kebab-title.md` | `README.md`, `0007-hook-only-vercel-deployment.md` |
| Branches | lowercase kebab-case with prefixes | `feat/cloud-sync`, `fix/tts-cache-lock` |
| Commits | Conventional Commits | `fix(server): sanitize webhook errors` |
| Env vars | upper snake case | `DATABASE_URL`, `EXPO_PUBLIC_API_URL` |

## File organization

- `app/` is for route files only.
- `components/` is for reusable presentational or composite UI.
- `lib/` is for client-side state, persistence, sync, and app helpers.
- `server/` is for Express middleware, routes, AI integration, and server-only utilities.
- `shared/` is for schema or transport code used by both client and server.
- `docs/` is the canonical documentation tree.
- Do not add new planning markdown files unless the task explicitly asks for them.

## Import rules

Preferred order:
1. React / React Native
2. Expo packages
3. Third-party packages
4. Internal absolute imports (`@/`, `@shared/`)
5. Relative imports

Use blank lines between groups.

## TypeScript rules

- TypeScript runs in strict mode.
- Avoid `any`; when unavoidable, annotate it with `// intentional: <reason>`.
- Prefer named exports for components and reusable functions.
- Use `useLocalSearchParams<T>()` for typed route params.
- Shared contracts should live in `shared/` or `constants/types.ts`.

## React Native and Expo patterns

- Use `StyleSheet.create()` for static styles.
- Use `StyleSheet.absoluteFill` instead of `absoluteFillObject`.
- Use colors and tokens from `constants/colors.ts` and `constants/timing.ts`.
- Use `expo-haptics` for intentional press feedback.
- Use `useSafeAreaInsets()` when layout depends on device safe areas.
- Use `expo-linear-gradient` and `@expo/vector-icons` for gradients and icons.

## Error handling

### Server

- Validate and sanitize request data before business logic runs.
- Use route helpers and sanitized error responses; never leak stacks to clients.
- Prefer structured logging through `server/logger.ts`, not ad hoc `console.log` in production paths.
- Return `{ error: string }` for error bodies.

### Client

- Show user-friendly fallback states.
- Keep raw errors out of child-facing UI.
- Use existing error boundary patterns where available.

## API design conventions

- Routes are lowercase and hyphenated under `/api/`.
- Request/response JSON uses camelCase keys.
- POST endpoints that trigger costly work should stay behind rate limiting and idempotency.
- Story and settings requests must use the existing validation schemas in `server/validation.ts`.
- AI provider calls go through `server/ai/` only.

## Database and sync conventions

- Use Drizzle via `server/db.ts`; avoid direct SQL unless the existing code already requires it.
- Keep cloud sync non-PII.
- Schema-sensitive changes in `shared/schema.ts` or `shared/models/` require human review.
- Prefer additive, well-documented schema changes and update related runbooks/ADRs when architecture changes.

## Testing conventions

- Vitest files live alongside source as `*.test.ts`.
- React Native component tests live under `__tests__/components/` and run with Jest Expo.
- Mock external providers and network boundaries.
- For documentation-only changes, tests are usually unnecessary unless a docs-specific check is directly affected.

## Git and PR conventions

- Branch prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `security/`, `test/`.
- Commit messages follow Conventional Commits.
- Keep PRs scoped; update docs when behavior, architecture, env vars, or workflows change.
- Do not push directly to `main`.

## Comment conventions

- Add comments only when they explain intent, invariants, or non-obvious constraints.
- Use JSDoc on exported utilities when it helps callers understand behavior.
- TODOs should include a durable reference when possible: `TODO(#123): short description`.

## Security-specific conventions

- Never place secrets in code, tests, fixtures, screenshots, or docs.
- Treat `EXPO_PUBLIC_*` as public.
- Keep `CHILD_SAFETY_RULES` wired into story-generation paths.
- Preserve filename and identifier validation around TTS and video endpoints.
