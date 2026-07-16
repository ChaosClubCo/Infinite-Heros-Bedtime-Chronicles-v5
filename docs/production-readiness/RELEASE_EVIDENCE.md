# Release Evidence Record

**Updated:** 2026-07-16  
**Release posture:** NO GO until every required item has attached evidence  
**Candidate branch:** `agent/resolve-release-blockers`

## Evidence ledger

| Control | Status | Evidence |
|---|---|---|
| Existing CI gates at PR #354 head `8a65b4b9` | Passed | GitHub PR verification comment: install, lint, tests, critical audit, typecheck, server build, security agent, link check |
| Supabase preview migrations | Passed | Healthy preview `iujaxqhdfzddvoojduau`; migrations and services reported healthy |
| Transcript retention probe | Passed | Expired synthetic row removed and current row retained on rollback-only preview probe |
| User A/User B RLS isolation | Passed | Live transactional probe on 2026-07-16: A saw only A; B select/update/delete/insert blocked; chat tables denied direct authenticated access; transaction rolled back |
| Deletion receipt contract | Implemented, CI pending | PII-free receipt returned only after chat, sync cascade, and Auth deletion complete |
| Expo dependency compatibility/export | CI pending | Required by `Expo Compatibility and Web Build` job |
| EAS internal Android build | Pending | Must attach EAS build URL, artifact ID, candidate SHA, and profile |
| Physical-device matrix | Pending | Android minimum/target device plus iOS device; consent, story, offline, sync, deletion, accessibility, audio-disabled verification |
| Deployed smoke | Pending | Exact SHA from `/api/health`, HTTPS health/privacy responses, authenticated happy path, fail-closed provider gates |
| Alert delivery | Pending | Sentry event ID plus notification destination receipt |
| Backup restore | Pending | Disposable preview backup/restore proof with row counts and isolation re-test |
| Rollback drill | Pending | Prior release restored, health/smoke rerun, recovery time recorded |
| Privacy/legal/provider evidence | Pending external owner | Approved notice, consent version, provider agreements/settings, store declarations |

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
