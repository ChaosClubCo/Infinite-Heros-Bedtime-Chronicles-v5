# Agent coordination — read this before editing

Two AI agent systems work on this repo: **Claude Code** and the **Antigravity agents**.
They share one working tree, so edits can collide. To avoid stepping on each other, each
agent edits ONLY the paths it owns and claims anything new here before starting.

## Ownership (as of 2026-07-14)

### Claude Code owns
- `lib/sync/**` (sync engine — runSync, report, engine, reconcile, mappers, adapters + their tests)
- `components/SyncManager.tsx`
- `app/_layout.tsx` (the sync-error-reporter wiring only)
- `__tests__/components/SyncManager.test.tsx`

### Antigravity agents own
- `server/**` (AI providers, routes/health, replit_integrations, integration tests)
- `docs/**`
- `scripts/**` (incl. `scripts/verify-sync.ts` — read-only *imports* from `lib/sync`, does not edit it)

### Shared — coordinate before touching (do NOT edit unilaterally)
- `tsconfig.json`, `vitest.config.ts`, `jest.config.js`, `package.json`, `package-lock.json`
- `CLAUDE.md`, this file
- `lib/storage.ts` (both sync systems touch it)

## Active claims (append before you start; clear when done)
- _(none)_ <!-- [claude] 2026-08-14 clean-code refactor pass completed: app/**, components/**,
  constants/**, lib/{useScreenInsets,useRequireHero,format-date,customHeroStorage,query-client,
  useSyncOffline,SyncOfflineContext,replay-params}; changes verified (tsc/jest/lint) but not
  yet committed -->


## Rules
1. Edit only files in your ownership block. If you need a file you don't own, add a claim
   line above and wait, or hand the change to the owning agent.
2. Commit your slice in a **separate, labeled commit** (`[claude]` / `[antigravity]` prefix)
   so history stays attributable and either slice can be reverted independently.
3. Never run `git add -A` / `git commit -a` — stage explicit paths so you don't sweep up the
   other agent's in-progress work.
4. Shared config/schema changes are a stop-and-coordinate event, not a solo edit.
