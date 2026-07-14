# Evidence Index and Verification Matrix

**Baseline commit:** `eb00e2dd2ab82e885fa98b4db50b118964f19deb`  
**Assessment date:** 2026-07-14

## Purpose

Record the evidence used for this assessment, distinguish verified code from documentation claims, and list unknowns requiring manual validation.

## Evidence Standards

| Label | Definition |
|---|---|
| Verified | Directly inspected in current repository file/configuration or GitHub metadata |
| Reported | Stated in repository documentation, commit or PR; not independently executed |
| Inferred | Engineering conclusion from verified evidence |
| Unable to Verify | Required source or environment unavailable |
| Not Found | Not present in the inspected sources/search results |

## Primary Evidence

| Area | Evidence | Key conclusion | Confidence |
|---|---|---|---|
| Repository | GitHub repo metadata | Public org repository, default `main` | High |
| Baseline | Commit `eb00e2d` | Current assessed main at audit start | High |
| Dependencies/scripts | `package.json` | Expo/Express/Supabase/AI stack and dev `start` command | High |
| Client metadata | `app.json` | App IDs, origin, new architecture, typed routes | High |
| Mobile deployment | `eas.json` | Production API domain and Android AAB profile | High |
| Web/API deployment | `vercel.json` | Static export + serverless function, 60s duration | High |
| Server runtime | `server/index.ts` | Middleware, Sentry, CORS, static delivery, error handling | High |
| Route composition | `server/routes.ts` | Auth gate and feature-dependent routes | High |
| Auth | `server/auth.ts`, `lib/AuthContext.tsx` | Supabase sessions and server token verification | High |
| Story generation | `server/routes/story.ts` | Zod, idempotency, timeout, token cap, cost signal | High |
| Validation | `server/validation.ts` | Length caps and prompt sanitization helpers | High |
| Prompt safety | `server/prompts.ts` | Story child-safety rules and sanitized interpolation | High |
| AI routing | `server/ai/router.ts` | Fallback, retry, circuit breaker, JSON extraction | High |
| Rate limit | `server/rate-limit.ts` | Memory/KV non-atomic fail-open behavior | High |
| Database | `shared/schema.ts`, `shared/models/chat.ts`, `server/db.ts` | Tables, missing indexes and TLS setting | High |
| Voice Chat | `server/replit_integrations/audio/routes.ts` | Transcripts persisted; no safety system prompt in handler | High |
| Chat storage | `server/replit_integrations/chat/storage.ts` | Ownership filtering and persistence behavior | High |
| Consent | `app/parental-consent.tsx` | Parent gate and inaccurate “no accounts/no storage” copy | High |
| Privacy | `app/privacy.tsx` | Inaccurate no-account/no-retention/no-tracking statements | High |
| Local deletion | `lib/storage.ts`, `app/settings.tsx` | Clears local keys and signs out only | High |
| Health/metrics | `server/routes/health.ts`, `server/metrics.ts` | Public, in-memory and shallow readiness | High |
| Feature flags | `server/feature-flags.ts` | Voice/streaming default on; video default off | High |
| CI definition | `.github/workflows/ci.yml` | Quality checks are defined | High |
| CI execution | GitHub workflow/status metadata | No Actions run returned; only Vercel statuses | Medium |
| Cloud Run | PR #314 | Repeated startup failures; production-entrypoint fix merged after baseline | High for code/PR state; runtime revision requires manual validation |
| Existing architecture docs | `docs/ARCHITECTURE.md` | Good baseline with some stale statements | High |
| Security docs | `docs/SECURITY.md` | Materially stale Firebase and control claims | High |
| COPPA docs | `docs/COPPA-COMPLIANCE.md` | Recognizes legal gaps but contains stale persistence/Sentry claims | High |
| Observability docs | `docs/operations/OBSERVABILITY.md` | Stale server-Sentry/Firebase statements | High |
| Historical audit | `docs/COMPREHENSIVE-AUDIT-2026-03-27.md` | Historical issues/remediation context | Medium |
| Preflight | `scripts/preflight.js` | Does not run typecheck/lint/test despite README wording | High |
| License | README and package metadata | No project license; repository is public | High |

## Major Documentation Contradictions

| Document claim | Current code/state | Required action |
|---|---|---|
| No accounts | Supabase sign-in/sign-up methods exist | Define account product behavior and disclose it |
| No tracking | Sentry client/server is supported | Define telemetry, scrub PII and disclose accurately |
| No server-side user data | Voice transcripts persist in PostgreSQL | Disable persistence/feature or disclose/consent/retain/delete correctly |
| Delete everything locally satisfies rights | Remote conversations/account remain | Implement complete deletion |
| Voice safety prompt is active | Current audio route does not add one | Fix and test |
| Firebase auth/rate-limit keys | Auth migrated to Supabase | Reconcile all docs |
| Server Sentry not wired | Server initializes Sentry | Update observability docs |
| Security headers list | Runtime header set differs from docs | Generate docs/tests from code |
| Primary Replit/Cloud Run/Vercel | Multiple conflicting targets | Select one primary topology |
| Preflight runs full gate | Script runs environment/lock/patch checks only | Correct docs or change script |

## Unknowns Requiring Manual Validation

### Cloud and deployment

- Actual production platform and traffic routing.
- Cloud Run health, traffic allocation, and logs after merged PR #314.
- Vercel functional smoke results.
- Replit production state.
- Environment variables in each environment.
- Canonical DNS, redirects and TLS.
- Vercel deployment protection/firewall.
- Cloudflare KV active credentials and namespace behavior.
- EAS secrets, signing keys and build history.
- Play Store/App Store listing and child-policy status.

### Supabase and database

- RLS policies and whether they are enabled on all relevant tables.
- Database migrations applied.
- Backup/PITR configuration.
- Restore-test evidence.
- Connection pool behavior in production.
- Existing child/transcript data.
- Auth email verification/password policy/reset flow.
- Supabase account deletion behavior.

### Providers and compliance

- DPAs and child-directed terms.
- Data retention and model-training opt-outs.
- Sentry PII scrubbing/retention.
- OpenAI/Google/Anthropic/OpenRouter/ElevenLabs data settings.
- Legal approval of consent method and privacy policy.
- Privacy mailbox ownership and response SLA.
- App-store Families/Designed for Families compliance.

### Quality and operations

- Actual current test results.
- Code coverage.
- Branch protection.
- GitHub Actions enablement.
- Secret scanning and code scanning.
- Load-test results.
- Real-device E2E/accessibility results.
- Alerts, dashboards, paging and SLOs.
- Incident and rollback drill evidence.
- Asset and transitive dependency license inventory.
- Complete dead-code/unused-asset/duplicate-code analysis.

## Manual Validation Commands and Checks

```bash
# Local repository
npm ci
npm run preflight
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm audit --audit-level=high
npm run server:build
npx expo export --platform web --output-dir static-build

# Long-running production boot
PORT=8080 NODE_ENV=production node server_dist/index.js

# Smoke
curl -fsS http://localhost:8080/api/health
curl -fsS http://localhost:8080/api/ai-providers

# Database
npx drizzle-kit generate
# Inspect generated migration before applying.
```

Additional manual checks:

1. Clean Android install and first-launch consent.
2. Network capture confirming which personal fields leave the device.
3. Supabase dashboard review for auth/RLS/backups.
4. Provider dashboard review for retention/training settings.
5. Sentry event inspection with synthetic child-like inputs to ensure redaction.
6. Concurrent rate-limit test across multiple instances.
7. Complete delete-all verification across device, database and auth.
8. Voice-chat adversarial safety evaluation only in an isolated adult test environment.
9. DNS/deep-link/OAuth callback matrix.
10. Rollback and database restore drill.

## Confidence Summary

| Domain | Confidence |
|---|---|
| Code architecture | High |
| API/auth/data paths | High |
| Privacy contradictions | High |
| Deployment configuration | High |
| Live production state | Low-to-medium |
| Test pass state | Medium/Reported |
| Compliance status | Requires legal validation |
| Performance at scale | Medium/Inferred |
| Complete repository inventory | Medium |

## Findings

The evidence is sufficient for a `NO GO` decision even though some operational details remain unknown. The unknowns could reveal additional blockers but are unlikely to invalidate the verified critical findings.

## Recommendations

Re-run and update this index at every release candidate. Evidence should include links to CI runs, deployments, dashboards, migration IDs, legal approvals and test artifacts.

## Next Actions

Attach issue/PR links to each blocker as remediation begins.

## Claims Check

Line numbers can drift after edits. Paths, functions and baseline SHA should be treated as the stable evidence anchors.

## Version History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07-14 | Initial evidence and verification matrix. |
