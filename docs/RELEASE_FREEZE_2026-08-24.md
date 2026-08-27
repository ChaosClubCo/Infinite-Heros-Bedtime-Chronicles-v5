# Bedtime Chronicles Public-v1 Release Freeze

**Effective:** 2026-08-24  
**Status:** ACTIVE  
**Release PR:** #443  
**Target:** `main`

Until a SHA-bound `PublicReleaseReceipt/v1` passes every mandatory gate, changes to the release branch are limited to:

- build, dependency, test, security, privacy, accessibility, observability, and rollback repairs;
- evidence generation or verification;
- release documentation that corrects current behavior;
- removal or disabling of functionality outside the approved public-v1 scope.

New user-facing features, provider integrations, experiments, schema expansion, and unrelated refactors are frozen. Any exception requires an explicit release-owner decision, a documented risk assessment, and a fresh execution of every gate against the resulting commit SHA.

The freeze is administrative until `main` branch protection can require the exact-head checks. It must not be represented as technically enforced while GitHub Actions cannot create jobs or the repository plan rejects branch-protection configuration.
