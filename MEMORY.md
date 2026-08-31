<!-- Last verified: 2026-08-30 -->
<!-- Update this file when significant changes occur. -->
# MEMORY.md — Persistent AI Agent Context

**Last updated:** 2026-08-30

## Project identity

- Name: Infinity Heroes: Bedtime Chronicles
- Type: single full-stack Expo + Express app
- Audience: children ages 3–9, with strict child-safety constraints
- Canonical repo: `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`

## Current state

- Expo SDK 55 / React Native 0.83.10 / React 19.2.0 / TypeScript strict.
- Stories, badges, streaks, favorites, read-state, consent, and settings are local-first via AsyncStorage.
- Optional Supabase-backed cloud sync is implemented for non-PII progress records only.
- Voice chat exists as a conditional backend capability and remains tightly gated by compliance and deployment settings.
- Web/API deployment is centered on Vercel serverless; mobile builds use EAS.
- Child-safety rules are enforced both in prompts and in server-side output moderation.

## Important architectural decisions

- One repo contains both the Expo app and Express API.
- AI requests always flow through `server/ai/` with fallback chains.
- AsyncStorage remains the canonical client data store.
- Supabase provides auth, Postgres, and RLS-backed sync storage.
- Deployment and release verification are guarded by documentation and workflow-based provenance checks.

## Active constraints

- Never sync child-profile PII such as names or ages.
- Never expose server secrets through `EXPO_PUBLIC_*` variables.
- Preserve `CHILD_SAFETY_RULES` in story-generation paths.
- Treat `shared/schema.ts`, auth, rate limiting, CORS, and compliance gates as high-review areas.

## Recent significant changes

| Date | Change |
|------|--------|
| 2026-08-30 | Added Good Morning Sunrise overlay with harmonic dawn synthesizer, top-of-screen segmented scene progress bar, persistent bottom playback controls, 10s narration rewind, and independent ambient audio volume slider |
| 2026-08-22 | Added interactive story audio previews, dedicated preview volume controls, 'More Like This' story recommendations, and personalized Child Dream Avatar system |
| 2026-08-14 | Documentation audit and refresh for README, architecture, security, agent instructions, conventions, glossary, and compatibility wrappers |
| 2026-08-14 | Added release-proof, mirror-verification, and EAS preflight verification tooling; expanded operations docs |
| 2026-08-14 | Added privacy route variants, release-proof ledger docs, and webhook surface audit |
| 2026-07-27 | Reconciled automated test-suite documentation to 1,453 measured tests |
| 2026-07-14 | Landed cloud-sync foundation, offline interaction queue support, and additional health probes |
| 2026-06-13 | Completed route-module composition refactor and provisioned Supabase/Sentry/Cloudflare production-facing infrastructure |

## Known tech debt

- Some operational docs still preserve historical Replit deployment context alongside the newer Vercel-first model.
- Release proof and platform verification are documentation-heavy and require manual evidence collection.
- Voice chat remains high-scrutiny because it touches child-directed audio, compliance, and database state.

## Ownership hints

- `server/`, `shared/`, `.env.example`, and security docs deserve human review for sensitive changes.
- `docs/agents/` and root agent context files are the coordination layer for AI-assisted work.
- `docs/operations/` and `docs/runbooks/` are the canonical operational references.
