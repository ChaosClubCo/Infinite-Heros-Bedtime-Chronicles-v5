# Dependency Stabilization Decision

**Date:** 2026-07-16  
**Scope:** Expo 57 and TypeScript 7 automated upgrades  
**Decision:** Revert/reconcile the entire upgrade set to the Expo SDK 55-compatible graph; keep native promotion on hold until EAS and device proof pass.

## Controlled migration result

The mixed upgrade set failed the new compatibility gate: the Expo SDK 55 application contained Expo Router/status-bar 57, React Native 0.86, TypeScript 7, and other packages outside the SDK 55 supported graph.

The manifest and lockfile were then reconciled together with Expo's SDK-aware installer. No individual package was partially retained from the incompatible graph.

| Package | Controlled version |
|---|---|
| Expo | `~55.0.28` |
| Expo Router | `~55.0.17` |
| Expo Status Bar | `~55.0.6` |
| React | `19.2.0` |
| React Native | `0.83.6` |
| TypeScript | `~5.9.2` |
| jest-expo | `~55.0.20` |
| Sentry React Native | `~7.11.0` |

The lockfile remains authoritative. Do not run an unreviewed `npm audit fix --force`, `npm update`, or isolated dependency merge.

## Validation evidence

GitHub Actions run [29508270776](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29508270776) passed on commit `6ff560d73b466133639ac3b63a96b5bca19c84b4`:

1. Strict `npm ci` from the committed lockfile.
2. Repository preflight.
3. ESLint.
4. Complete Vitest suite.
5. Critical dependency audit.
6. TypeScript typecheck.
7. Server production build.
8. `expo install --check`.
9. Production Expo web export and artifact upload.

This validates the dependency set for repository and web integration. It does not prove native compilation or physical-device behavior.

## Ongoing rollback trigger

Treat future Expo/TypeScript upgrades as one controlled migration. Revert the complete candidate graph when any of these occurs:

- `expo install --check` reports SDK incompatibility.
- Metro or production export fails.
- EAS preview build fails because of package compatibility.
- Android/iOS launch, routing, splash, status bar, or native-module smoke regresses.
- A compiler upgrade requires weakening strictness.

## Promotion rule

The dependency hold can be lifted only after:

- CI is green on the exact candidate SHA.
- EAS internal Android build succeeds.
- The physical-device matrix passes.
- Candidate SHA, build URL, and evidence are attached to the release record.
