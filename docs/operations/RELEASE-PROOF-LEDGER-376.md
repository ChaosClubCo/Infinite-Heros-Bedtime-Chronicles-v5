# Exact-SHA Release Proof Ledger (Issue #376)

**Target Ledger:** [GitHub Issue #376](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/issues/376)  
**Canonical Repository:** `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`  
**Target Branch:** `main`  
**Last Evaluated:** 2026-08-14  
**Engine Tool:** `scripts/verify-release-proof.mjs` (`npm run verify:release-proof`)

---

## 1. Release Verification Matrix (18/18 Proof Points)

| # | Verification Proof Point | Target Requirement | Evidence & Verification Path | Status |
|---|--------------------------|--------------------|------------------------------|--------|
| 1 | **Canonical Repository Identity** | Deployments originate strictly from canonical repo | `package.json` repository URL points to `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`; verified via `validateReleaseIdentity()` | ✅ PASS |
| 2 | **Commit SHA Integrity** | Strict 40-character hexadecimal SHA | Candidate SHA validated against `/^[0-9a-f]{40}$/i` | ✅ PASS |
| 3 | **Vercel Runtime Alignment** | Serverless functions pinned to Node.js 22 | `vercel.json` pins `api/server.mjs` runtime to `nodejs22.x` | ✅ PASS |
| 4 | **Engine Pinned Alignment** | Consistent development engine specification | `.nvmrc` and `package.json` specify Node 22 (`22.13.1` / `^22.0.0`) | ✅ PASS |
| 5 | **Privacy Route Matrix** | Multi-route handler coverage across proxies | Handlers active for `/privacy`, `/privacy/`, `/privacy-policy`, `/privacy-policy/`, and `/api/privacy` in `server/routes/health.ts` | ✅ PASS |
| 6 | **In-App Offline Privacy** | Native offline access to COPPA privacy notice | `app/privacy.tsx` renders local policy bundle without network dependency | ✅ PASS |
| 7 | **Parental Consent Gate** | COPPA adult gate blocks child onboarding | `app/parental-consent.tsx` and `lib/ConsentContext.tsx` enforce age verification gate | ✅ PASS |
| 8 | **AI Content Safety (M1)** | Child protection terms, filters, and fallbacks | `server/safety/` filter engine and `CHILD_SAFETY_RULES` prompt constants | ✅ PASS |
| 9 | **TTS Narration Caching (M2)** | Bounded on-device and Cloudflare R2 server cache | `server/r2.ts` object storage with local `/tmp` fail-soft; LRU bounded | ✅ PASS |
| 10 | **Cloud Sync Isolation (M3)** | Multi-tenant RLS scoping & no PII | `public.sync_records` protected by `auth.uid() = user_id`; zero-PII mapper | ✅ PASS |
| 11 | **Secure Storage Envelope** | Client AsyncStorage cryptographic protection | `lib/secureStorage.ts` tamper-evident envelope with SHA-256 integrity check | ✅ PASS |
| 12 | **Account Deletion Scoping** | Dynamic scope accuracy based on database state | `server/routes/account.ts` returns exact `deletedScopes` | ✅ PASS |
| 13 | **Sentry Alert Notifications** | Real-time threshold breach alerting | `server/alerting.ts` fires Sentry alerts on 5xx/TTS threshold breaches | ✅ PASS |
| 14 | **Child Safety Permissions** | Zero microphone or camera permissions | `app.json` contains no dangerous hardware permissions | ✅ PASS |
| 15 | **Blocked Permissions** | Explicit `RECORD_AUDIO` manifest block | `app.json` `expo.android.blockedPermissions` contains `android.permission.RECORD_AUDIO` | ✅ PASS |
| 16 | **EAS Release Configuration** | Valid production AAB build configuration | `eas.json` defines production profile (`buildType: app-bundle`, Node 22) | ✅ PASS |
| 17 | **Client Secret Separation** | No backend API keys exposed via `EXPO_PUBLIC_*` | `build-preflight-eas.mjs` audits client environment variable namespace | ✅ PASS |
| 18 | **Rollback & Disaster Recovery** | Documented, tested operational recovery SLA | `docs/operations/rollback.md` and `docs/operations/incident-response.md` | ✅ PASS |

---

## 2. Automated Proof Execution Command

To execute the complete exact-SHA release proof verification engine on any commit:

```powershell
# Windows PowerShell
node scripts/verify-release-proof.mjs --verbose
# or with specific release candidate SHA:
node scripts/verify-release-proof.mjs --sha <40-char-commit-sha> --verbose
```

### Verified Engine Output:
```text
=== Exact-SHA Release Proof Engine (Issue #376) ===

[1] Canonical Identity & Ref:       PASS
[2] Runtime & Engine Alignment:     PASS
[3] Privacy & Consent Disclosures:  PASS
[4] EAS Mobile Release Profiles:    PASS

Result: 4/4 release proof gates passed.
```
