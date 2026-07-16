# Dependency Stabilization Decision

**Date:** 2026-07-16  
**Scope:** Expo 57 and TypeScript 7 automated upgrades  
**Decision:** Validation-first hold; no additional major dependency merges until the compatibility gate is green.

## Current controlled set

The repository currently uses Expo SDK 55 with several independently versioned Expo packages, including recent Expo Router/status-bar 57 and TypeScript 7 upgrades. A passing server build and TypeScript suite alone do not prove Metro, Expo export, or device compatibility.

The lockfile remains authoritative. Do not run an unreviewed `npm audit fix --force`, `npm update`, or isolated Dependabot merge while this hold is active.

## Required gate

The CI workflow now requires all of the following against one commit:

1. Strict `npm ci` from the committed lockfile.
2. Repository preflight.
3. ESLint.
4. Complete Vitest suite.
5. Critical dependency audit.
6. TypeScript typecheck.
7. Server production build.
8. `expo install --check`.
9. Production Expo web export.

A green result validates the set for repository/web integration only. It does not replace EAS native compilation or physical-device testing.

## Rollback trigger

Revert the Expo 57/TypeScript 7 upgrade set as one controlled migration when any of these occurs:

- `expo install --check` reports SDK incompatibility.
- Metro or production export fails.
- EAS preview build fails because of package compatibility.
- Android/iOS launch, routing, splash, status bar, or native-module smoke regresses.
- TypeScript 7 introduces compiler behavior that cannot be fixed without weakening strictness.

Do not partially revert one package and leave a mixed dependency graph. Restore the last green lockfile, run `npx expo install --fix` for SDK 55, then rerun every gate above in one PR.

## Promotion rule

The dependency hold can be lifted only after:

- CI and Expo export are green on the exact candidate SHA.
- EAS internal Android build succeeds.
- The physical-device matrix passes.
- The candidate SHA and build artifact URL are attached to the release evidence record.
