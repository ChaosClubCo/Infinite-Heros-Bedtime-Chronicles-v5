# Evidence Index and Verification Matrix

**Baseline commit:** `0e31e776b4c4817e3d67b174fd9177791a2c5238`  
**Assessment date:** 2026-07-15

## Purpose

Record the evidence supporting the production-readiness decision, identify contradictory documents, and enumerate items that require external/manual validation.

## Evidence Standards

| Label | Definition |
|---|---|
| Verified | Directly observed in code/config/commit/PR metadata |
| Inferred | Engineering conclusion supported by verified evidence |
| Unable to Verify | Insufficient repository/connector evidence |
| Requires Manual Validation | Must be checked in a deployed system/provider/device/legal process |

## Primary Evidence

| Domain | Evidence | Verified conclusion | Confidence |
|---|---|---|---|
| Baseline | commit `0e31e776` | Current assessed `main`; sync manager mounted and reconnect sync added | High |
| Dependencies/scripts | `package.json` | Expo/Express/Supabase/AI stack; production start and gcp-build present | High |
| Cloud Run fix | merged commit `52fc2dd` / PR #314 | Dev-server entrypoint defect fixed in code; local boot/test reported | High for code; Medium for reported test |
| Story safety | `server/safety/*`, story route commits | Server moderation, regenerate-once, safe fallback, client fail-safe | High |
| Text chat | `server/replit_integrations/chat/routes.ts` | Child-safe system prompt, sanitization, last-20 history, persistence | High |
| Audio chat | `server/replit_integrations/audio/routes.ts` | 50 MB JSON parser; STT; transcript persistence; no system guard/history cap | High |
| Auth | `lib/AuthContext.tsx`, `server/auth.ts` | Supabase sessions; production bearer verification fails closed | High |
| Consent copy | `app/parental-consent.tsx` | Claims no accounts/no stored voice data | High |
| Privacy copy | `app/privacy.tsx` | Claims no accounts/no retained server data | High |
| Delete flow | `app/settings.tsx`, `lib/storage.ts`, `lib/sync/runSync.ts` | Purges sync records, clears local, signs out; no chat/auth delete | High |
| Cloud sync | `lib/sync/*`, `SyncManager`, migration | Parent opt-in state sync, tombstones, no profile name/age, RLS design | High for code |
| Sync migration | `supabase/migrations/0001_sync_tables.sql` | Owner-only policies, pull index, auth cascade | High for definition |
| API/auth gate | `server/routes.ts` | All writes + conversation reads protected; webhook HMAC exception | High |
| Health | `server/routes/health.ts` | Live cached probes/breakers exist; route still always 200/`ok` | High |
| Alerts | `server/alerting.ts` | Sentry threshold messages based on process-lifetime counters | High |
| Rate limiting | `server/rate-limit.ts`, `server/kv.ts` | Persistent optional state but non-atomic/fail-open | High |
| Database | `shared/models/chat.ts`, `server/db.ts` | Durable transcripts; constraints/index/TLS findings | High |
| CI definition | `.github/workflows/ci.yml` | Lock/install/lint/test/audit/typecheck/build jobs defined | High |
| CI execution | current-main status/workflow lookup | No statuses/runs returned | Medium; connector limitations possible |
| EAS/Vercel | `eas.json`, `vercel.json` | Targets configured | High for config; Low for deployed state |
| Vercel git linkage | `VERCEL_RELINK_2026-07-19.md` | Project relinked from public mirror to canonical `ChaosClubCo` repo via Vercel CLI; domains attached; provenance guards added (`scripts/verify-release-provenance.mjs`) | High — live API pre/post snapshots |

## Major Documentation Contradictions

| Claim | Conflicting implementation | Release significance |
|---|---|---|
| “No accounts” | Supabase sign-in/sign-up/session and cloud backup requiring user | Critical consent/privacy defect |
| “No server-side user data retained” | PostgreSQL transcripts and optional `sync_records` | Critical privacy defect |
| Voice recording “not stored by us” | Raw audio not stored, but derived child transcript is stored | Critical misleading omission |
| Delete by clearing/uninstalling | Remote transcript/account data remain | Critical parental-rights defect |
| Security docs describe legacy Firebase or missing Sentry | Current code uses Supabase and server Sentry | High operational drift |
| Architecture may describe server Sentry as unwired | Current `server/index.ts` initializes it | Documentation drift |
| Historical audit says output moderation absent | Current story guard implements it | Closed obsolete finding |
| Historical audit says Cloud Run process broken | Production start fix merged | Closed code defect; deployment proof still needed |

## Unknowns Requiring Manual Validation

### Cloud and Deployment

- Successful Cloud Run revision from current release SHA.
- Vercel project settings vs `vercel.json` and current deployment.
- Canonical production host, redirects, CORS, deep links, Expo origin.
- EAS build credentials and internal-track artifact.
- Store privacy/data-safety/Families declarations.
- Environment variables and feature flags in each target.

### Supabase and Database

- Migration applied to the intended production project.
- Live RLS policies and cross-account isolation.
- Service-role key scope/rotation.
- Chat schema migration history.
- Backups, PITR, restore, retention, region.
- Current DB TLS certificate validation.
- Actual transcript rows and deletion behavior.

### Providers and Compliance

- DPAs and child-directed use eligibility for OpenAI, Anthropic, Google, OpenRouter, ElevenLabs, Supabase, Sentry.
- Zero-retention/training settings and data regions.
- Counsel-approved COPPA consent/direct notice.
- Privacy mailbox process and deletion SLA.
- AI safety model configuration and provider moderation.

### Quality and Operations

- Why current-main statuses/workflow runs were not returned.
- Branch-protection required checks.
- Current lockfile audit, SBOM, licenses, secrets, SAST.
- Sentry DSNs, PII filters, alerts, notification routing, release tags.
- Uptime/synthetic monitors and SLO dashboard.
- On-call roster, incident drills, rollback proof.
- Physical-device accessibility/performance/offline/sync results.

## Manual Validation Commands and Checks

### Local/CI Gate

```bash
npm ci
npm run preflight
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm audit --audit-level=high
npm run server:build
npx expo export --platform web --output-dir static-build
npm run gcp-build
```

### Long-Running Production Boot

```bash
PORT=8080 NODE_ENV=production npm run server:prod
curl -fsS http://localhost:8080/api/health
curl -fsS http://localhost:8080/
```

### Required Deployed Smoke

```text
1. Verify exact deployed commit SHA/release ID.
2. GET public liveness and internal readiness.
3. Sign up/sign in/sign out/reset password.
4. Generate safe story; force provider fallback; force safety fallback.
5. Narration and image generation under approved flags.
6. Confirm Voice Chat and Video are absent when disabled.
7. Opt into sync, create/update/delete, reconnect second device, purge.
8. Delete account and verify chat/sync/auth rows are gone.
9. Trigger test error/cost/5xx alert and confirm receipt.
10. Roll back and repeat smoke.
```

### Supabase Isolation Probes

```text
- User A cannot select/update/delete User B sync_records.
- User A cannot list/read/post/delete User B conversations.
- Deleting auth user cascades sync_records.
- Application delete flow removes every chat row and auth identity.
- Restore test recovers expected state without cross-user leakage.
```

### Audio Safety Probes

```text
- Prompt injection in transcript cannot alter system safety.
- Earlier malicious turn falls outside bounded history.
- Unsafe output is blocked/repaired before audio reaches child.
- Empty/oversized/malformed audio fails before expensive allocation/provider call.
- Disconnect aborts provider/transcoding work.
- Retention/delete behavior matches notice.
```

## Confidence Summary

| Area | Confidence | Reason |
|---|---|---|
| Architecture/dependencies/routes | High | Direct code/config inspection |
| Privacy/consent contradictions | High | Direct UI copy vs code/storage comparison |
| Audio safety/deletion gaps | High | Direct handler and settings inspection |
| Story output safety | High | Current code/commit evidence |
| Cloud Run code fix | High | Merged diff and scripts |
| Cloud Run actual deployment | Low | No cloud-console/health evidence |
| CI execution | Medium-low | No runs returned; connector may not expose all checks |
| Supabase live RLS/backups | Low | Migration definition only |
| Test pass count | Medium | Reported in merged commit; not rerun here |
| Legal/provider compliance | Low | External evidence unavailable |
| Device/store readiness | Low | No device/store evidence |

## Findings

The evidence supports a `NO GO` decision even after significant remediation. The remaining critical findings are directly observable and cannot be resolved by assuming favorable cloud or provider settings.

## Recommendations

- Attach screenshots/logs/artifacts for every manual validation item to the release milestone.
- Treat parent-facing copy as executable release configuration: changes must trigger privacy review and consent-version evaluation.
- Generate inventories/API docs from code where possible to reduce drift.

## Next Actions

1. Complete publication/review of PR #352.
2. Create owner-assigned blocker issues from the risk register.
3. Run the current-main CI and deployed/device evidence plan.
4. Re-score only after critical blockers have verified closure evidence.

## Claims Check

No finding relies on assumed functionality. Where recent commits superseded the original audit, the obsolete finding is explicitly closed or downgraded rather than repeated.

## Version History

| Version | Date | Change |
|---|---|---|
| 1.1 | 2026-07-15 | Re-baselined evidence to `0e31e776`; recorded remediations and current unknowns. |
| 1.0 | 2026-07-11 | Superseded initial matrix. |
