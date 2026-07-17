# Release Evidence Record

**Updated:** 2026-07-17  
**Release posture:** NO GO until every required item has attached evidence  
**Exact candidate SHA:** `6dc92a55c90594f9bc3602cbec6613a47875294d`  
**Squash merge of:** PR [#357](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/pull/357) following remediation PRs [#354](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/pull/354) and [#356](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/pull/356)

## Evidence ledger

| Control | Status | Evidence |
|---|---|---|
| Required repository CI gates | Passed | Run [29515515947](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29515515947) on `6dc92a55c90594f9bc3602cbec6613a47875294d`: strict install, preflight, lint, 1,287 tests, critical audit, TypeScript 5.9 typecheck, server build, Expo compatibility, and Expo web export |
| Security / CodeQL | Passed | Run [29515515832](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29515515832) on exact candidate |
| PR review gates | Passed | Run [29515515893](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29515515893); no merge blocker found; release approval explicitly withheld |
| Markdown links | Passed | Run [29515515805](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29515515805) on exact candidate |
| CI failure propagation | Passed | PR #357 added `pipefail` to diagnostic pipelines and corrected the prior false-positive lint gate |
| Expo / TypeScript migration | Passed | Expo SDK 55 + TypeScript 5.9 graph passed locked install, Expo check, typecheck, and export; unsupported Expo 57 / TypeScript 7 set not retained |
| Voice containment | Passed | Audio chat disabled; text chat mutations require authentication; CI covers the disabled voice configuration |
| User A/User B RLS isolation | Passed on disposable branch; production deployment pending | Disposable branch `release-proof-6dc92a5` (ID `108adad1-5861-4d83-8e25-7a176ef516e1`, ref `mrcdrajvhcfddwykpvvk`) off production project `aeraxfupuvwiskmfjliq`; applied exact candidate migration `0002_voice_chat_retention.sql` (blob `d9ed44820c3ac190348e57f53b5860ff47bf965f`); transactional probe `supabase/tests/rls_isolation.sql` (blob `ce806800eeb710664e4721328a4435f3f43e20ae`): A saw only A, B select/update/delete/insert blocked, chat tables denied; post-probe: 0 synthetic auth users, 0 synthetic sync rows, 0 synthetic conversations, 1 retention cron job, RLS enabled on both tables; branch deleted after capture. Production migration `0002` not yet deployed. |
| Deletion receipt contract | Passed in repository CI | PII-free receipt returned only after chat and Auth deletion complete; sync records cascade from identity deletion; ordering, failure, and receipt-shape tests passed |
| Privacy truth + consent versioning | Passed in repository; external approval pending | CI covers consent-v2 acceptance/version persistence and child-age minimization; approved public notice, provider settings/agreements, counsel review, and store declarations not yet attached |
| Exact-SHA Release Proof workflow | Blocked — environment approval still required | Workflow triggered by the merge commit but `eas-internal-android` and `alert-delivery` used `environment: release-proof`; jobs waited for approval and `report-results` never fired. `timeout-minutes` has been added to all jobs in this PR, but that timeout starts only after a job begins running and does not limit time spent waiting for environment approval. Re-run `workflow_dispatch` after environment approval + secrets are configured. |
| EAS internal Android build | Pending | Must attach EAS build URL, artifact ID/checksum, exact candidate SHA, and profile |
| Physical-device matrix | Pending | Android minimum/target device plus iOS device; consent, story, offline, sync, deletion, accessibility, and audio-disabled verification |
| Deployed smoke | Fail — external configuration required | `https://www.bedtime-chronicles.com/` returns 404; Vercel project `prj_n2VBgRdnXCZj5biQsJAB4T4On1gH` is connected to public mirror `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main` (all 20 recent deployments `ERROR`). Action required: reconnect Vercel project to `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`, then re-run smoke. `VERCEL_GIT_COMMIT_SHA` is auto-set by Vercel once the correct repo is connected. |
| Alert delivery | Pending | Sentry event ID plus notification destination receipt; requires `SENTRY_DSN` secret in the `release-proof` environment and a successful `alert-delivery` job run |
| Backup restore | Pending | Disposable preview backup/restore proof with row counts and isolation re-test |
| Rollback drill | Pending | Prior release restored, health/smoke rerun, and recovery time recorded |
| Public mirror archive | Fail — requires repository admin action | `Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main` reports `archived: false`; README/MIRROR_STATUS.md notices do not substitute for the GitHub repository-level archive setting. A repository admin must enable the archive setting in the mirror's GitHub Settings. |
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
