# Authorization Matrix

This app has **no role/RBAC system** — that's a finding, not an omission on this audit's part.
Confirmed by reading `server/auth.ts`, `server/routes.ts`, and every route handler: there is
exactly one authenticated identity shape (`req.user = { uid, isAnonymous }`), and authorization
is uniformly **ownership-based** (a resource belongs to `req.user.uid`), never role-based. The
matrix below reflects that reality rather than inventing roles the codebase doesn't have.

## Actors found in evidence

| Actor | How it arises | Evidence |
|---|---|---|
| **Anonymous, unconsented** | Cold start before the COPPA parent-gate is passed | `lib/launch-gate.ts`, `lib/ConsentContext.tsx` |
| **Anonymous, consented, no explicit sign-in (lazy Supabase anonymous identity)** | `getIdToken()` calls `supabase.auth.signInAnonymously()` the first time any protected API call needs a token — no identity is created merely by opening the app | `lib/auth-session.ts` |
| **Signed-in parent (real Supabase email/password identity, `isAnonymous:false`)** | Explicit sign-up/sign-in via `lib/AuthContext.tsx` | `server/auth.ts` |
| **Server / GitHub webhook** | HMAC-authenticated, not a `req.user` at all | `server/routes/github-webhook.ts` |
| **Dev-mode IP-anonymous** | Only when Supabase env vars are unset AND `NODE_ENV !== 'production'` | `server/auth.ts` |

There is no "admin," "editor," "member," or "suspended" actor anywhere in source — do not assume
one exists for this app.

## Resource × action matrix

| Resource | Read | Create | Update | Delete | Enforcement point |
|---|---|---|---|---|---|
| **Own stories/badges/streaks/favorites (cloud sync)** | Any authenticated `uid` (own rows only, via Supabase RLS on `sync_records`) | same | same | same | Supabase RLS + `lib/sync/supabase-sync.ts` pull/push scoped to the caller's session |
| **Own account (Supabase Auth identity)** | n/a | signup | n/a | `DELETE /api/account` — **hard-scoped to `req.user.uid`; a client cannot name another account.** Confirmed no IDOR: the handler never reads a client-supplied id. | `server/routes/account.ts` |
| **Own voice-chat conversations** | `GET /api/conversations`, `GET /api/conversations/:id` | `POST /api/conversations` | `POST /api/conversations/:id/messages` | `DELETE /api/conversations/:id` | `userId = req.user.uid` on every `chatStorage` call — never a client-supplied id (`server/integrations/audio/routes.ts`) |
| **Own realtime-media sessions** | `GET /api/v1/realtime-media-sessions/:id` | `POST .../sessions` | n/a | `POST .../sessions/:id/cancel` | `ownerId === req.user?.uid` checks in `server/routes/realtime-media.ts` |
| **Local device data (AsyncStorage: stories, profiles, badges, streaks, favorites, settings, PIN)** | device-local only | device-local only | device-local only | device-local only; "Delete all data" also cascades to server | No server involvement at all — enforcement is "which device you're holding," not a server check |
| **Parent-controls settings (in-app)** | PIN-gated locally | n/a | PIN-gated locally | n/a | `components/ParentControlsModal.tsx` + `lib/storage.ts` PIN hash/lockout — entirely client-side, no server component |
| **AI generation endpoints (story/avatar/scene/tts/suggest/video)** | n/a | any authenticated `uid` (anonymous-Supabase qualifies) | n/a | n/a | `requireAuth` (identity only) + `requiresAiProviderCompliance` (env-attestation gate) + per-endpoint rate limiting — **no per-resource ownership concept, because there's no shared resource to own** |
| **GitHub webhook** | n/a | n/a | n/a | n/a | HMAC `X-Hub-Signature-256`, not `req.user` |

## UI-layer vs. server-layer enforcement

Checked every case where a screen visually implies a restriction, to confirm the server enforces
the same rule (hiding a button is not authorization):

| UI implies | Server actually enforces | Verdict |
|---|---|---|
| "You must be signed in (not anonymous) to delete your account" (`app/settings.tsx` gates the flow behind a signed-in check) | `server/routes/account.ts` independently re-checks `!user \|\| user.isAnonymous → 400` | **Matches** — server-enforced, not client-only |
| "Parent controls require the PIN" | Nothing server-side — this is a device-level gate with no server-side data at stake | **By design, not a gap** — there is no server resource behind this gate to protect |
| "COPPA consent required before using the app" | `Stack.Protected` (client-only) gates the RN client's UI, but is **inconsistent server-side, not uniformly absent as an earlier draft of this row claimed**: `server/routes/realtime-media.ts` (session creation) genuinely validates a scoped, versioned `consentArtifact` (`consentArtifact.scope !== "realtime-media"` → 403; a stale `consentRecordVersion` → 403) — real server-side consent enforcement exists for that one route. Story generation, media generation, and every other endpoint have **no equivalent check** — `requireAuth`/`requiresAiProviderCompliance` verify identity and AI-provider attestations, never consent state. | **Inconsistent, not absent.** An attacker calling `/api/generate-story` directly (bypassing the RN client) is not blocked by lack of consent, while the same attack against realtime-media session creation is. This inconsistency is itself worth a maintainer decision (extend the realtime-media pattern everywhere, or accept consent as UX-only outside that one route) — and it means the previous version of this document's claim that "the server has no COPPA-consent enforcement of its own" was simply wrong. See also FLOW-BREAK-008: the premise that pre-consent API calls carry no meaningful PII doesn't hold either — a child's name, once supplied, reaches third-party AI providers regardless of consent state. |

## SECURITY_CONCERN (informational — none rise to a confirmed vulnerability)

1. **Anonymous Supabase identities satisfy `requireAuth` everywhere except account deletion.**
   `getIdToken()` lazily mints a real, cryptographically valid anonymous JWT for any API call
   that needs one. This is by design (lets per-user rate limiting work without forcing sign-in),
   and the one place a "real" identity matters (`DELETE /api/account`) already guards against it.
   But no other current or future endpoint should assume `req.user.uid` implies a real,
   registered parent unless it adds the same `isAnonymous` check.
2. **No client-side 401 recovery UX.** A 401 from any query/mutation surfaces as a generic
   thrown `Error` (`lib/query-client.ts`); nothing routes the user to re-authenticate. Low blast
   radius today (most flows work anonymously), but worth designing for before any feature adds a
   real per-account resource beyond account deletion.
3. **Dev-mode auth bypass blast radius depends on `NODE_ENV` being set correctly at every deploy
   target.** The `NODE_ENV=production` guard (503, no opt-out) is the only thing preventing the
   IP-anonymous dev fallback from reaching real traffic. This audit did not verify deploy-time env
   injection on Vercel/Cloudflare — flagged as `UNKNOWN`, not confirmed broken.

No IDOR, missing ownership check, or client-only server guard was found in this pass.

**Correction to an earlier draft of this document**: this document previously stated flatly that
"child name/age never leave the device" (citing `CONSENT_DISCLOSURES` item 1 at face value) and
that "the server has no COPPA-consent enforcement of its own." Both claims were wrong — verified
against source, not just the disclosure text or a surface reading of the route list. See
`FLOW-BREAKS.md` FLOW-BREAK-008 (the child's name is sent to third-party AI providers in story/
suggestion prompts, contradicting the disclosure) and the corrected "COPPA consent required"
row above (realtime-media does enforce a real server-side consent artifact). This is exactly the
kind of gap a static-analysis audit should catch by reading the actual code paths rather than
trusting a document's stated intent — flagged here as a reminder to treat every claim in this
audit itself with the same scrutiny it applies to the app's own docs.
