# Development Roadmap

**Last Updated:** 2026-06-19

Items are scored using Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

## Completed

| Item | Category | Date |
|------|----------|------|
| Unify dual settings systems | Bug Fix | 2026-03-13 |
| Add security headers | Security | 2026-03-13 |
| Wire up voice chat routes | Feature | 2026-03-13 |
| Resolve dead code triage | Maintenance | 2026-03-13 |
| Restore saveStoryScene persistence | Bug Fix | 2026-03-13 |
| Fix storyId mismatch in completion | Bug Fix | 2026-03-13 |
| Create comprehensive documentation | Docs | 2026-03-13 |
| Update .env.example | Docs | 2026-03-13 |
| Add testing framework (Vitest) | Tech Debt | 2026-04-07 |
| Add KeyboardAwareScrollView to forms | Feature | 2026-04-07 |
| Wire read/unread story indicators | Feature | 2026-04-07 |
| Wire story feedback/rating UI | Feature | 2026-04-07 |
| Reuse HeroCard.tsx in hero selection | Feature | 2026-04-07 |
| Add npm audit to CI | Security | 2026-04-07 |
| Fix audio pipeline (model name + ffmpeg) | Bug Fix | 2026-03-25 |
| Model audit (rolling aliases, dead refs) | Maintenance | 2026-03-25 |
| Wire Gemini image integration route | Feature | 2026-03-25 |
| Harden input validation (parseInt, content, audio, voice) | Security | 2026-03-25 |
| Add conversation pagination | Feature | 2026-03-25 |
| Add Permissions-Policy & X-Permitted-Cross-Domain-Policies headers | Security | 2026-03-25 |
| Safe JSON parsing for AI responses | Bug Fix | 2026-03-25 |
| Replace unsafe `catch (error: any)` patterns | Code Quality | 2026-03-25 |
| Upgrade to Expo SDK 55 | Tech Debt | 2026-04-24 |
| Thorough 3-way audit + remediation | Security/Quality | 2026-04-24 |
| COPPA parental-consent gate + in-app privacy policy | Compliance | 2026-06-11 |
| Fix CI lint toolchain (ESLint 10 → 9) | CI | 2026-06-11 |
| Patch shell-quote critical CVE | Security | 2026-06-11 |
| Fix all_heroes badge (now counts custom heroes) | Bug Fix | 2026-06-11 |
| Fix AI router streaming model field | Bug Fix | 2026-06-11 |
| Fix suggest-settings JSON re-parse | Bug Fix | 2026-06-11 |
| Build voice chat mobile UI screen | Feature | 2026-06-11 |
| Refactor app/story.tsx into hooks + components | Code Quality | 2026-06-11 |
| Add AI provider test coverage | Testing | 2026-06-11 |
| Complete server/routes.ts → domain module migration | Code Quality | 2026-06-13 |
| Provision Supabase production database (conversations + messages) | Infrastructure | 2026-06-13 |
| Add Sentry error tracking (server + client) | Observability | 2026-06-13 |
| Add Cloudflare KV persistent rate limiting | Infrastructure | 2026-06-13 |
| Production-readiness re-audit + HIGH remediations (retry 4xx gate, crash handlers, cost guards) | Security/Reliability | 2026-06-18 |
| Pre-baked hero portraits + illustrated onboarding flow + 50 story seeds (#245) | Feature | 2026-06-19 |
| Story playback cleanup + stale-closure fix in app/story.tsx (#245) | Code Quality | 2026-06-19 |
| Refactor badge system into lib/badges.ts; fix vocab_5 & all_heroes bugs (#247) | Bug Fix | 2026-06-19 |
| Custom hero storage + Trophies screen progress UI (#247) | Feature | 2026-06-19 |

## Backlog (Prioritized)

### High Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 1 | M1 — KV-backed idempotency + TTS cache | 8 | 8 | 6 | 3 | 7.3 | Serverless gate: in-memory dedup + /tmp TTS cache are per-invocation → duplicate generations / re-synth cost. Move to Cloudflare KV / object storage. See docs/PRODUCTION-READINESS-AUDIT-2026-06-19.md |
| 2 | M3 — Wire alerting + server-side Sentry | 8 | 7 | 4 | 2 | 9.5 | Serverless gate: alarm thresholds documented but not wired; no server-side Sentry. Add cost/latency/failure-rate alarms |
| 3 | M2 — Live health checks (liveness/readiness) | 5 | 5 | 3 | 1 | 13.0 | /api/health checks env-var presence, not live reachability. Add cached, non-blocking dependency pings |
| 4 | EAS build & Play Store submission | 8 | 8 | 5 | 5 | 4.2 | eas.json configured; needs EAS secrets + AAB build; see docs/operations/PLAY_STORE_DEPLOYMENT.md |
| 5 | Resolve remaining npm audit vulnerabilities | 5 | 5 | 5 | 3 | 5.0 | 42 advisories (2 high: `tmp`, `undici`; 40 moderate, mostly `@expo/config*`); 0 critical. Blocked on upstream Expo/transitive fixes |

### Low Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 6 | Add authentication (anonymous sessions) | 5 | 1 | 3 | 8 | 1.1 | Only needed if API cost abuse becomes a concern |
| 7 | Encrypt client-side AsyncStorage | 2 | 1 | 2 | 5 | 1.0 | Stored data is non-sensitive (story text, badges) |

## Dependencies

- Items 1–3 (M1/M3/M2) are the audit's "before scaling past beta" gates — see docs/PRODUCTION-READINESS-AUDIT-2026-06-19.md §Go/No-Go. M1 requires the `CLOUDFLARE_*` KV vars to be set in the live Vercel env (verify; falls back to in-memory silently otherwise).
- Item 4 (EAS) requires all API keys to be set as EAS secrets (see docs/operations/EAS-SECRETS-CHECKLIST.md)
- Item 5 (audit) is blocked on upstream releasing fixes for the `tmp`/`undici` and `@expo/config*` transitive chains
- Item 6 (auth) would require significant architecture changes

## Known Audit Issues

`npm audit` as of 2026-06-19 reports **42 advisories: 2 high, 40 moderate, 0 critical**:
- **High:** `tmp` (arbitrary file/dir write via symlink) and `undici` — both pulled in transitively.
- **Moderate:** mostly `@expo/config*` and related Expo tooling chains; tracked against Expo SDK updates.
- All are transitive; no direct-dependency fixes available yet. Tracked in Dependabot.

CI uses `--audit-level=critical`. Tighten to `--audit-level=high` once the `tmp`/`undici` chains resolve upstream.

## Tracked TODOs in Code

No open `// TODO` comments found in source files as of last scan (2026-06-19).
