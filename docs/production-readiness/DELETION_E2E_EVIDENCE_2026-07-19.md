# End-to-End Deletion Evidence — 2026-07-19

**Release track:** PR #377 / issue #376  
**Supabase production project:** `aeraxfupuvwiskmfjliq`  
**Disposable PR branch:** `agent/release-salvage-stabilization` / project ref `vstkmrprhdmpfbxoaraf`  
**Production data touched:** No  
**Overall status:** **DATABASE CASCADE PASS; AUTHENTICATED APP/DEVICE FLOW PENDING**

## Endpoint design under test

`DELETE /api/account` is authenticated and performs destructive work in this order:

1. resolve exact release SHA before deletion;
2. delete PostgreSQL conversations owned by the authenticated parent;
3. cascade deletion of conversation messages;
4. delete the Supabase Auth identity;
5. cascade deletion of `sync_records` through the `auth.users` foreign key;
6. return a PII-free server deletion receipt;
7. let the client clear local device data only after validating the receipt.

The endpoint does not claim local cleanup in its server response. It returns `localDeviceData: pending_client_cleanup` until the app clears device storage.

## Repository test evidence

Automated tests verify:

- chat deletion happens before identity deletion;
- the receipt contains an exact release SHA and no user ID/email;
- no receipt is returned if release identity is unavailable;
- identity deletion does not occur if transcript deletion fails;
- cloud purge rejects malformed/unverifiable receipts; and
- the client calls the server endpoint only for a signed-in parent.

These tests are necessary but are not live end-to-end proof.

## Disposable database proof

A rollback-only transaction was executed against the Supabase PR #377 branch on 2026-07-19. It created one synthetic parent identity and associated records, mirrored the server endpoint's ordered deletion, counted all scopes, and rolled the transaction back so no test identity or data remained.

### Synthetic scopes

- `auth.users`: one synthetic parent identity.
- `public.sync_records`: one synthetic story record referencing the parent with `ON DELETE CASCADE`.
- `public.conversations`: one synthetic conversation using the parent UUID as `user_id` text.
- `public.messages`: one synthetic message referencing the conversation with `ON DELETE CASCADE`.

### Ordered deletion executed

1. `DELETE public.conversations WHERE user_id = synthetic_parent_id`
2. `DELETE auth.users WHERE id = synthetic_parent_id`

### Result before rollback

| Scope | Rows remaining |
|---|---:|
| Supabase Auth identity | 0 |
| Cloud sync records | 0 |
| PostgreSQL conversations | 0 |
| PostgreSQL messages | 0 |

**Database result:** PASS.

## What this proves

- The database schema supports the server endpoint's deletion order.
- Conversation deletion cascades to messages.
- Auth identity deletion cascades to cloud-sync records.
- The proof can be performed without touching production data.

## What this does not prove

- A real Supabase access token successfully reaches the deployed endpoint.
- The deployed endpoint is connected to the same database branch being inspected.
- The Supabase Admin API removes the real account and sessions as expected.
- The client validates and stores/displays the receipt correctly.
- AsyncStorage, local files, caches, query state, narration cache, and any secure storage are cleared on a real device.
- Existing access tokens are revoked immediately enough for the release's security requirements.
- The flow works on both iOS and Android under network interruption/retry conditions.

## Required authenticated physical-device proof

Run on one iOS and one Android physical device using an exact-candidate internal build and a disposable test parent account.

### Seed

1. Create the disposable parent account through the app.
2. Create at least one child profile, story, favorite, read record, badge, streak, and preference.
3. Enable cloud backup and confirm rows in `sync_records`.
4. Seed a synthetic conversation/message through an approved test route or controlled database fixture if Voice Chat remains unavailable.
5. Record the account UUID privately; do not attach the email or access token to public evidence.

### Delete

1. Open parent settings and choose Delete All Data.
2. Capture the confirmation UI and network request.
3. Record the returned receipt ID, version, completion timestamp, and exact release SHA.
4. Confirm the app completes local cleanup and returns to an unconsented/new-install state.

### Verify server-side

Using an authorized admin query, confirm zero rows for the disposable UUID in:

- `auth.users`;
- `auth.identities` and active sessions where applicable;
- `sync_records`;
- `conversations`; and
- `messages` through conversation ownership/history.

Verify the prior access token cannot perform authenticated operations.

### Verify device-side

Inspect the exact app storage/container and confirm removal of:

- child profiles and active-profile pointer;
- generated stories;
- favorites/read/badges/streaks;
- preferences and parent controls/PIN material;
- consent record;
- Supabase session/auth token;
- sync queue/cursor/tombstones;
- React Query or other persisted caches;
- generated/downloaded images;
- narration/audio cache and temporary files; and
- deletion receipt if product policy does not intentionally retain it locally.

### Failure cases

Repeat with:

- network loss before server receipt;
- server 5xx after request begins;
- app termination after server receipt but before local cleanup;
- token expiration;
- retry after uncertain completion; and
- duplicate deletion request.

Expected behavior: never claim completion without a valid receipt; preserve enough state to retry; after server completion, safely resume local cleanup without recreating cloud data.

## Required evidence artifacts

- exact commit SHA and internal build IDs;
- device models and OS versions;
- redacted request/receipt capture;
- before/after database query output;
- before/after device storage inventory;
- token-revocation result;
- screen recording;
- tester and independent reviewer;
- defect links and rerun evidence.

## Decision

The database portion is verified. The release ledger must keep **Account deletion and receipt** as **PENDING** until the authenticated deployed endpoint and physical-device cleanup both pass on the exact candidate.
