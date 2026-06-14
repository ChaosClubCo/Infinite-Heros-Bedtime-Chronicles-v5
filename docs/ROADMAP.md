# Development Roadmap

**Last Updated:** 2026-06-13

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

## Backlog (Prioritized)

### High Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 1 | EAS build & Play Store submission | 8 | 8 | 5 | 5 | 4.2 | eas.json configured; needs EAS secrets + AAB build; see docs/operations/PLAY_STORE_DEPLOYMENT.md |
| 2 | Resolve remaining npm audit vulnerabilities | 5 | 5 | 5 | 3 | 5.0 | 14 remaining vulns (2 high in firebase-admin transitive chain); blocked on upstream |

### Low Priority

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 3 | Add authentication (anonymous sessions) | 5 | 1 | 3 | 8 | 1.1 | Only needed if API cost abuse becomes a concern |
| 4 | Encrypt client-side AsyncStorage | 2 | 1 | 2 | 5 | 1.0 | Stored data is non-sensitive (story text, badges) |

## Dependencies

- Item 1 (EAS) requires all API keys to be set as EAS secrets (see docs/operations/EAS-SECRETS-CHECKLIST.md)
- Item 2 (audit) is blocked on firebase-admin upstream releasing fixes for transitive `@tootallnate/once` chain
- Item 3 (auth) would require significant architecture changes

## Known Audit Issues

2 high-severity advisories remain in the firebase-admin transitive dependency tree:
- `@tootallnate/once` via `firebase-admin` → `http-proxy-agent` → `teeny-request` → `@google-cloud/storage`
- Requires firebase-admin to update its deps; tracked in Dependabot

CI uses `--audit-level=critical`. Tighten to `--audit-level=high` after firebase-admin upstream resolves.

## Tracked TODOs in Code

No open `// TODO` comments found in source files as of last scan (2026-06-13).
