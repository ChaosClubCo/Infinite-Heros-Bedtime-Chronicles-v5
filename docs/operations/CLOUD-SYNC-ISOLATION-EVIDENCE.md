# Cloud Sync Isolation & Verification Evidence (Milestone M3)

**Last Updated:** 2026-08-14  
**Feature:** Supabase Cloud Sync & Backup (`lib/sync/`)  
**Security Status:** Isolated, No-PII, Fail-Closed  
**Default State:** `cloudSyncEnabled: false` (Explicit opt-in required)

---

## 1. Architecture & Privacy Invariants

The Infinity Heroes cloud sync engine is designed under strict COPPA compliance and zero-child-PII constraints:

1. **Explicit Opt-In Only**:
   - Cloud sync defaults to disabled (`cloudSyncEnabled: false` in `lib/SettingsContext.tsx`).
   - Sync only executes when a user has actively authenticated and enabled the cloud backup toggle in **Settings → Cloud Backup**.

2. **Zero-PII Payload Mapping (`lib/sync/mappers.ts`)**:
   - Child profile names and ages **never leave the local device**.
   - Profile records are mapped to an anonymized `profileStub` containing only randomly generated UUIDs, creation timestamps, and avatar emoji choices.
   - When a profile is restored on a secondary device, it is initialized as a generic "New Profile" placeholder for the parent to assign locally.

3. **Binary Image Stripping**:
   - Heavy base64 avatars and scene illustration data are stripped from `CachedStory` objects before network transmission (`storyToRecord`).
   - Sync payloads contain only metadata, titles, and text tokens to minimize bandwidth and eliminate unneeded blob storage.

4. **Multi-Tenant Row-Level Security (RLS)**:
   - All synchronization records in PostgreSQL table `public.sync_records` are strictly protected by RLS:
     ```sql
     CREATE POLICY "Users can only manage their own sync records"
     ON public.sync_records
     FOR ALL
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
     ```

---

## 2. Automated Gate & Test Matrix

The cloud sync subsystem is validated by multiple comprehensive test suites:

| Test Suite / Script | Target Component | Verified Invariants | Status |
|---------------------|------------------|---------------------|--------|
| `scripts/verify-sync.ts` | `lib/sync/mappers.ts`, `lib/sync/reconcile.ts` | Entity round-trip, PII stripping, image stripping, conflict resolution | ✅ PASS |
| `server/verify-sync.test.ts` | Sync Engine Verification API | Automated CI test runner for verify-sync script | ✅ PASS |
| `lib/sync/reconcile.comprehensive.test.ts` | `reconcile()` | Multi-entity reconciliation, timestamp resolution, deletion tombstones, duplicate suppression | ✅ PASS |
| `scripts/verify-milestones.mjs` | M1–M3 Verification Engine | Milestone 3 cloud sync & secure storage envelope integration | ✅ PASS |
| `server/verify-milestones.test.ts` | Milestone Verification API | Automated CI test runner for verify-milestones script | ✅ PASS |

---

## 3. End-to-End Reconciliation Scenarios

### Scenario A: Clean Round-Trip & PII Stripping
- **Input**: `ChildProfile` with name `"Sam"`, age `6`, emoji `"🦊"`.
- **Output Record**: `profileStubToRecord` produces JSON payload with NO occurrence of `"Sam"` or `"6"`.
- **Assertion**: `profileStubPiiFree === true`.

### Scenario B: Binary Asset Stripping
- **Input**: `CachedStory` containing `avatar: 'base64...'` and `scenes: { 1: 'base64...' }`.
- **Output Record**: Payload excludes `'avatar'` and `'scenes'` properties.
- **Assertion**: `storyStrippedImages === true`.

### Scenario C: Last-Write-Wins Conflict Resolution
- **Conflict**: Local story modified at $T_1$, Remote story modified at $T_2$ ($T_2 > T_1$).
- **Result**: Remote record takes precedence and is applied to local storage.
- **Assertion**: `reconciliationValid === true`.

### Scenario D: Deletion Tombstone Propagation
- **Action**: Story deleted locally (`deleted: true` tombstone).
- **Result**: Remote database receives tombstone record; subsequent sync on secondary device removes local copy.

### Scenario E: Complete Account Purge
- **Action**: User triggers **Settings → Delete All Data** or `DELETE /api/account`.
- **Result**: Local AsyncStorage wiped via `clearAllData()`; all database rows for the authenticated `user_id` in `public.sync_records`, `conversations`, and `messages` are deleted via foreign key cascade (`auth.users.id`).

---

## 4. Disposable Branch Isolation Test Runbook

When deploying Supabase schema updates or validating migration scripts:

```bash
# 1. Create a disposable test branch in Supabase
supabase branches create test-sync-isolation-proof

# 2. Apply migrations to disposable database
supabase db push --db-url "$DISPOSABLE_DATABASE_URL"

# 3. Execute sync verification suite against test instance
npm run verify:sync

# 4. Verify RLS cross-user isolation:
# Attempt querying User A's sync records using User B's JWT token
# Assert: HTTP 200 with 0 returned rows (RLS filtered)

# 5. Clean up test branch
supabase branches delete test-sync-isolation-proof
```
