# ADR-0006 — Migrate Authentication from Firebase to Supabase

**Status:** accepted
**Date:** 2026-07-06

---

*Note: this ADR was written retroactively (2026-08-12) as part of a documentation audit. The audit found roughly 14 other files across the repo still describing Firebase Auth as current, months after this migration actually completed — this ADR exists so that class of doc drift doesn't recur undocumented.*

---

## Context

The app's original architecture decisions (ADR-0001 through ADR-0005, all dated 2026-03-11) used Firebase Auth for identity: anonymous sign-in on the client, verified server-side via the Firebase Admin SDK's `verifyIdToken`.

Milestone 3 (cloud sync/backup for stories, badges, streaks, and favorites) required a Postgres backend with Row Level Security to scope each user's synced data. Supabase was provisioned for this database layer (project id `aeraxfupuvwiskmfjliq`). Running Firebase for identity and Supabase for data meant maintaining two separate identity systems side by side, with no native binding between Firebase UIDs and Postgres RLS policies, and no straightforward cascade-delete path for COPPA-compliant account/data deletion.

---

## Decision

Migrate authentication entirely to **Supabase Auth**.

Server-side, `server/auth.ts` implements bearer-token (JWT) middleware: a lazy-init service-role client validates the incoming token via `supabase.auth.getUser(token)`. Client-side, `lib/AuthContext.tsx` implements Supabase email/password sign-in, gated on `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

A production guard was added: when `NODE_ENV=production` and Supabase is not configured (`SUPABASE_SERVICE_ROLE_KEY` + Supabase URL unset), every auth-gated route returns 503 — there is no opt-out flag. In development, auth is skipped and an anonymous `req.user` is derived from the client IP.

The `firebase` and `firebase-admin` dependencies and all `FIREBASE_*` environment variables were removed.

---

## Consequences

### Positive
- Single identity system instead of two
- `auth.uid()` binds directly to Postgres Row Level Security policies on `sync_records` and related tables (see `supabase/migrations/20260713000817_0001_sync_tables.sql`)
- `DELETE /api/account` (`server/routes/account.ts`) can delete the `auth.users` row and rely on `ON DELETE CASCADE` to remove all synced child data in one operation — this is the app's COPPA-compliant account/data-deletion mechanism
- Two client dependencies removed from the bundle

### Negative
- `SUPABASE_SERVICE_ROLE_KEY` is a full-bypass credential (bypasses RLS entirely) and must never be exposed client-side or placed in an `EXPO_PUBLIC_*` var
- The `EXPO_PUBLIC_SUPABASE_ANON_KEY` is intentionally public/bundled and is safe only because RLS policies correctly scope access — if a future migration ever weakens RLS, that assumption breaks silently
- The rate limiter's per-user key space changed (was keyed on Firebase UID, now keyed on Supabase user UID), which invalidated any pre-migration Cloudflare KV rate-limit state — a one-time, low-impact effect

### Neutral
- Supabase auth remains optional: if unset, dev treats all POSTs as anonymous with IP-based rate-limit identity, and production 503s on auth-gated routes
- Any documentation still describing `FIREBASE_SERVICE_ACCOUNT_KEY` or Firebase Admin SDK usage as current is stale and should be corrected to reference Supabase

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|---------------|
| Keep Firebase Auth, bridge Firebase UIDs into Supabase RLS via a custom claim | Adds an ongoing sync/verification burden between two identity providers for no lasting benefit |
| Roll a custom JWT/session system | Reinvents auth infrastructure Supabase already provides; more surface area to secure |
| Auth0 / Clerk | Adds a third vendor and cost when the data layer (Supabase) already offers auth that binds natively to its own RLS |
