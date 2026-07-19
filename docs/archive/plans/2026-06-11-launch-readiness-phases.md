# Launch-Readiness Phase Plan (2026-06-11)

> Committed to the repo so the plan survives AI-session context loss. Update statuses
> as phases land. Supersedes the outline in `2026-04-08-launch-readiness.md` for
> sequencing purposes.

**Goal:** Take the app from "feature-complete" to Google Play launch-ready.

| Phase | Scope | Status |
|-------|-------|--------|
| 1 — Ground Truth | Reconcile docs with code + fix real bugs: `all_heroes` badge excluded custom heroes, AI-router streaming reported `provider.name` as `model`, suggest-settings greedy-regex JSON re-parse | ✅ Done — commit `5d39558`, PR #222 |
| 2 — COPPA consent & privacy | First-launch parental-consent gate (`app/parental-consent.tsx`), native privacy policy screen (`app/privacy.tsx`), consent-aware routing in `app/_layout.tsx`, corrected served privacy policy | ✅ Done — commit `fdc9681` (stacked on PR #222) |
| 3 — CI / infrastructure debt | The 4 red CI checks deferred during Phase 1: npm audit vulnerabilities (Security Agent gate), ESLint 10 / `eslint-plugin-react` toolchain crash (Lint and Test), lychee broken external links, Vercel deployment config error | Deferred (user decision) |
| 4 — Code quality & tech debt | Refactor `app/story.tsx` monolith into hooks + components, split `server/routes.ts` into domain route modules, close test-coverage gaps (`server/ai/providers/*`, `server/suno.ts`), refresh stale docs | 🔄 In progress (executed ahead of Phase 3 by user decision) |
| 5 — EAS build & Play Store submission | EAS secrets, preview/production Android builds, store listing + data-safety form, submission (per `docs/operations/PLAY_STORE_DEPLOYMENT.md`) | Not started |

## Notes

- Phases 1–2 live on branch `claude/blissful-hawking-vbb1vv` (PR #222, draft). Phase 4
  is developed on `claude/zen-darwin-u78ngs`, which stacks on that branch; rebase after
  PR #222 merges.
- Phase 3's failures are infrastructure-only: they pre-date Phase 1 and do not exercise
  app code changed in Phases 1–2–4 (CodeQL, production-install smoke test, and the full
  vitest suite are green).
- Phase 4 is strictly behavior-preserving: no functional changes, full test suite and
  `npm run typecheck` green after every commit.
