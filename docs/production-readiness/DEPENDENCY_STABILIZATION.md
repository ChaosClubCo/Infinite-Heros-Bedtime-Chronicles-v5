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

## Validation evidence correction

The earlier validation claim for run [29508270776](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29508270776) is retained as history but is **not accepted as release evidence**. Its lint, test, and typecheck commands were piped through `tee` without `pipefail`, so command failures could be recorded in logs while the steps returned success.

Exact-candidate Release Proof run [29513791768](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29513791768) checked out and verified merged SHA `f2f6a82b32a4ba646cbe7689b58b6aa1df1915ae`, then correctly failed on an Expo 55 lockfile/config mismatch: React Hooks v6-only lint rules were configured while the controlled lockfile installed `eslint-plugin-react-hooks@5.2.0`.

After restoring exit-code propagation and completing the Expo 55 / TypeScript 5.9 rollback, PR validation run [29515177031](https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5/actions/runs/29515177031) passed on head `0d5b5865e5486b71909a941e62dbac0f6cd7acaf`:

1. Strict `npm ci` from the committed lockfile.
2. Repository preflight.
3. ESLint.
4. Complete Vitest suite (1,287 tests).
5. Critical dependency audit.
6. TypeScript 5.9 typecheck.
7. Server production build.
8. `expo install --check`.
9. Production Expo web export and artifact upload.

This is PR evidence, not release approval. The exact merged SHA must still pass Release Proof, including EAS and external evidence gates.

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
