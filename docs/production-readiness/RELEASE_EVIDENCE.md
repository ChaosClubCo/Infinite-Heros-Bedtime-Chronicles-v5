# Release Evidence Record

**Updated:** 2026-07-16  
**Release posture:** NO GO until every required item has attached evidence  
**Candidate branch:** `agent/resolve-release-blockers`

## Evidence ledger

| Control | Status | Evidence |
|---|---|---|
| Required repository CI gates | Passed | Run [29508270776](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29508270776) on `6ff560d73b466133639ac3b63a96b5bca19c84b4`: strict install, preflight, lint, tests, critical audit, typecheck, production install smoke, server build |
| Expo dependency compatibility/export | Passed | Same exact run: `expo install --check`, production web export, and artifact upload passed after the Expo SDK 55 graph was reconciled atomically |
| Supabase preview migrations | Passed | Healthy preview `iujaxqhdfzddvoojduau`; database, services, APIs, configurations, migrations, seeding, and Edge Functions reported healthy |
| Transcript retention probe | Passed | Expired synthetic row removed and current row retained on a rollback-only preview probe |
| User A/User B RLS isolation | Passed | Live transactional probe on 2026-07-16: A saw only A; B select/update/delete/insert blocked; chat tables denied direct authenticated access; transaction rolled back; reproducible assertions are in `supabase/tests/rls_isolation.sql` |
| Deletion receipt contract | Passed in repository CI | PII-free receipt is returned only after chat and Auth deletion complete; sync records cascade from identity deletion; ordering, failure, and receipt-shape tests passed |
| EAS internal Android build | Pending | Must attach EAS build URL, artifact ID/checksum, exact candidate SHA, and profile |
| Physical-device matrix | Pending | Android minimum/target device plus iOS device; consent, story, offline, sync, deletion, accessibility, and audio-disabled verification |
| Deployed smoke | Pending | Exact SHA from `/api/health`, HTTPS health/privacy responses, authenticated happy path, and fail-closed provider gates |
| Alert delivery | Pending | Sentry event ID plus notification destination receipt |
| Backup restore | Pending | Disposable preview backup/restore proof with row counts and isolation re-test |
| Rollback drill | Pending | Prior release restored, health/smoke rerun, and recovery time recorded |
| Privacy/legal/provider evidence | Pending external owner | Approved notice, consent version, provider agreements/settings, and store declarations |

## Physical-device matrix

| Platform | Device/OS | Install | Consent v2 | Core story | Offline/reconnect | Sync isolation | Delete + receipt | Accessibility | Result |
|---|---|---|---|---|---|---|---|---|---|
| Android | Minimum supported |  |  |  |  |  |  |  | Pending |
| Android | Current target |  |  |  |  |  |  |  | Pending |
| iOS | Current supported |  |  |  |  |  |  |  | Pending |

Voice Chat must remain disabled during the first release-proof cycle. A later adversarial Voice Chat cycle is separate and requires provider/legal approval.

## Required attachments

- GitHub Actions run URL and exact SHA.
- EAS internal build URL and artifact checksum.
- Device screenshots/logs with no child PII.
- Deletion receipt ID and database absence checks.
- Sentry event ID and received-alert screenshot.
- Backup/restore commands, timestamps, pre/post row counts, and RLS rerun result.
- Deployment rollback identifiers, start/end timestamps, and post-rollback smoke output.

## Decision rule

No blank or merely attested row becomes `Passed`. Each must contain independently reviewable evidence tied to the exact release SHA. Only the designated release owner may change the release posture.
