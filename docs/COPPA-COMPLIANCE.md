# COPPA Compliance Audit — Infinity Heroes: Bedtime Chronicles

**Audit date:** 2026-04-08  
**Auditor:** Claude Code (automated codebase analysis)  
**Regulation:** Children's Online Privacy Protection Act (COPPA), 15 U.S.C. § 6501 et seq., and FTC Rule 16 C.F.R. Part 312  
**Audience:** Legal counsel, product owner, app-store reviewers

---

## 1. Overview

Infinity Heroes: Bedtime Chronicles is a children's bedtime story app for ages 3–9. COPPA applies to operators of commercial websites and online services directed to children under 13, and to general-audience services with actual knowledge that they are collecting personal information from children under 13.

Because this app is explicitly targeted at children ages 3–9, **COPPA applies to all data collection and processing performed by the app and its backend server**, regardless of whether it is a parent or child who holds the device.

---

## 2. Data Collected and Where It Is Stored

### 2.1 On-Device Storage (AsyncStorage — mobile only)

All data in this section is stored exclusively on the user's device using React Native AsyncStorage. It never leaves the device except as described in Section 3 below.

| AsyncStorage Key | Data Stored | Contains Personal Info? | Notes |
|---|---|---|---|
| `@infinity_heroes_profiles` | `ChildProfile` objects: `name` (string), `age` (number), `favoriteHeroId`, `avatarEmoji`, `createdAt` | **Yes — child name and age** | Both fields are optional. No validation enforces real names; any string is accepted. |
| `@infinity_heroes_active_profile` | Profile ID (opaque string) | No | References a profile by generated ID only. |
| `@infinity_heroes_stories` | Full generated story objects, hero ID, mode, optional profile ID, optional feedback (rating + free-text) | Indirectly — story text may reference child name if provided | Story feedback free-text field has no length cap in the type definition. |
| `@infinity_heroes_favorites` | Array of story ID strings | No | Opaque IDs only. |
| `@infinity_heroes_read` | Array of story ID strings | No | Opaque IDs only. |
| `@infinity_heroes_badges` | Badge records linked to profile ID | No | Contains earned timestamps; no personal info beyond the profile ID. |
| `@infinity_heroes_streaks` | Streak counters and last-story date (ISO date string) per profile ID | No | ISO date is behavioral, not personal. |
| `@infinity_heroes_preferences` | `UserPreferences`: narrator voice, story length, theme, font size, mute/motion flags | No | App settings only. |
| `@infinity_heroes_parent_controls` | `ParentControls`: max story length, bedtime hour/minute, allowed themes, PIN code, video flag | **Yes — PIN code is a secret** | PIN is SHA-256 hashed with a per-user salt via expo-crypto. See `lib/storage.ts` `hashPin()`. |

**Source files:** `lib/storage.ts`, `constants/types.ts`

### 2.2 Server-Side — In-Memory Only

The Express backend maintains:

- **Rate-limit map** (`server/rate-limit.ts`): keyed by Firebase UID (when auth is enabled) or client IP address. Stores hit count and reset timestamp. Cleared on server restart. Never persisted to disk.
- **Idempotency cache** (`server/idempotency.ts`): keyed by a hash of the story request body. TTL of 5 minutes. Never persisted to disk.
- **TTS audio cache** (`/tmp/tts-cache/`): story narration MP3 files. File names are MD5 hashes of `voiceKey:mode:text`. Contains rendered audio of story text (which may include a child name if the parent provided one). Automatically cleaned up after 24 hours.

**No database rows containing personal information are written by this app.** The PostgreSQL schema in `shared/schema.ts` is wired for future use but story content and profiles are not persisted to it by current code paths.

### 2.3 Server Request Logs (pino)

The pino logger (`server/logger.ts`, `server/index.ts`) records:

- HTTP method, path, status code, and duration for each `/api/*` request
- Firebase UID used as the rate-limit key (included in log context indirectly)
- Error details (sanitized — stack traces are stripped before logging)
- Provider and model name for successful AI and TTS calls

**The logs do not record:** request bodies, hero names, child names, child ages, story content, or IP addresses in the structured log fields. The rate-limit key (UID or IP) is passed to the rate limiter but is not explicitly emitted to the pino log stream.

---

## 3. Data Sent to Third Parties

### 3.1 Firebase (Google) — Anonymous Authentication

- **What is sent:** The Firebase SDK (`lib/AuthContext.tsx`) calls `signInAnonymously()` on app launch. This contacts Firebase Auth servers and returns an opaque anonymous UID.
- **What is NOT sent:** No name, email, phone, or any user-provided personal information. Anonymous sign-in by design provides only a rotating UID with no PII linkage.
- **Persistence:** The Firebase UID is ephemeral; it is used server-side only as a rate-limit key and is not stored in any database.
- **Firebase's COPPA posture:** Google Firebase anonymous auth does not collect personal information. However, operators are responsible for their own COPPA compliance and must ensure Firebase's data processing terms are reviewed.

### 3.2 AI Providers — Story Generation, Avatar, Scene, and Suggestion Endpoints

The following fields from user input are transmitted to whichever AI provider is active in the fallback chain (Gemini → OpenAI → Anthropic → OpenRouter). The exact data sent depends on which endpoint is called:

**`/api/generate-story` and `/api/generate-story-stream`** (source: `server/routes.ts`, `server/prompts.ts`):

| Field Sent to AI | Source | Max Length | Contains Personal Info? |
|---|---|---|---|
| `heroName` | Parent-entered | 500 chars | Potentially — if parent uses child's name |
| `heroTitle` | Parent-selected | 500 chars | No — fictional role |
| `heroPower` | Parent-selected | 500 chars | No — fictional power |
| `heroDescription` | Parent-entered | 500 chars | Potentially — free text |
| `childName` | Parent-entered (optional) | 50 chars | **Yes — explicitly a child name** |
| `madlibWords` | Parent/child-entered (optional) | 20 words × 100 chars | Potentially |
| `setting`, `tone`, `sidekick`, `problem` | Parent-selected | 30–100 chars | No — constrained vocabulary |

**`/api/suggest-settings`** (source: `server/routes.ts`):

| Field Sent to AI | Contains Personal Info? |
|---|---|
| `heroName`, `heroPower`, `heroDescription` | Potentially |
| `childAge` | **Yes — child age** |
| `childName` | **Yes — child name (optional)** |

**`/api/generate-avatar`**: Sends `heroName`, `heroTitle`, `heroPower`, `heroDescription`. No child name or age.

**`/api/generate-scene`**: Sends `heroName`, `heroDescription`, and a snippet of AI-generated story text. No child name or age.

**Key mitigating facts:**

1. All string inputs pass through `sanitizeString()` with length caps before inclusion in prompts (`server/validation.ts`).
2. The AI providers receive the data as part of a generation prompt. They are not instructed to store or index it.
3. The server does not log or persist the prompt contents or the child name/age.
4. Child name and age are **both optional**. The app functions fully without them; they are convenience personalization features.

**Operator responsibility:** The operator must review and accept data processing agreements (DPAs) with each AI provider that reflect COPPA-compliant data handling. Gemini (Google), OpenAI, Anthropic, and OpenRouter each have enterprise data processing terms — these must be signed or verified before production launch targeting children.

### 3.3 ElevenLabs — Text-to-Speech

- **What is sent:** The rendered story text (AI-generated) is sent to ElevenLabs for audio synthesis (`server/elevenlabs.ts`).
- **Personal info risk:** If a child name was included in story generation, that name will appear in the story text and will be transmitted to ElevenLabs as part of the TTS text.
- **What is NOT sent:** Hero customization fields, child age, profile data, or any identifying metadata.
- **Caching:** TTS responses are cached server-side for up to 24 hours keyed by content hash, reducing repeat transmissions.

### 3.4 What Is NOT Collected or Transmitted

- No email addresses
- No phone numbers
- No physical addresses
- No photos or biometric data
- No device advertising identifiers (IDFA/GAID)
- No persistent cross-app or cross-device identifiers tied to personal information
- No analytics or behavioral tracking SDKs (no Mixpanel, Amplitude, Segment, Firebase Analytics, or equivalent)
- No advertising networks or ad SDKs
- No social login or social sharing
- No crash reporting service that transmits PII (no Sentry, Bugsnag, or equivalent installed)
- No geolocation data

---

## 4. COPPA Compliance Status by Data Type

| Data Type | Collected? | Where | Sent to Third Party? | COPPA Status | Notes |
|---|---|---|---|---|---|
| Child first name | Optional | AsyncStorage (device only) + AI prompt | Yes — to AI providers and ElevenLabs (via story text) | **Needs DPA review** | Optional; not required. Must be covered by AI provider DPAs. |
| Child age | Optional | AsyncStorage (device only) + AI prompt | Yes — to AI providers via `/api/suggest-settings` | **Needs DPA review** | Optional. Sent only if user triggers settings suggestion. |
| Parent PIN code | Yes | AsyncStorage plaintext | No | **Gap: plaintext storage** | See Section 6. |
| Story feedback text | Optional | AsyncStorage (device only) | No | Compliant | Free text; no server upload path exists. |
| Hero customization | Yes | AsyncStorage + AI providers | Yes — to AI providers | **Needs DPA review** | Not inherently PII; fictional content. |
| Story content | Yes | AsyncStorage + ElevenLabs | Partial — TTS text to ElevenLabs | **Needs DPA review** | May contain child name. |
| Firebase anonymous UID | Yes | In-memory rate limiter | Yes — to Firebase Auth | Compliant | No PII; anonymous only. No email/password. |
| Behavioral data (streaks, badges) | Yes | AsyncStorage (device only) | No | Compliant | Stored locally; never uploaded. |
| IP address | Yes | Server rate-limit map (in-memory) | No | Compliant | Ephemeral; not logged; not stored. |
| Request metadata (method, path, status) | Yes | Server logs | No | Compliant | No PII in structured log fields. |
| Email / account credentials | No | — | — | Compliant — not collected | |
| Advertising identifiers | No | — | — | Compliant — not collected | |
| Analytics behavioral profiles | No | — | — | Compliant — not collected | |

---

## 5. Parental Consent Mechanism

**Current status: Parental consent gate implemented (2026-06-11).**

The app now blocks all data-collecting / AI features behind a one-time parental
consent gate:

- `app/parental-consent.tsx` — shown at first launch before onboarding and before
  any story creation. It uses a **parent gate** (an arithmetic challenge a young
  child is unlikely to pass) followed by an explicit consent affirmation.
- The screen discloses, in plain language, what is collected and where it goes
  (device-only profile, story inputs sent to AI partners, optional Voice Chat
  audio) and links to the full Privacy Policy (`app/privacy.tsx`).
- Consent is persisted in `@infinity_heroes_parent_consent` with a timestamp and
  a `CONSENT_VERSION` (`lib/storage.ts` `setParentConsent` / `getConsentGiven`).
  Bumping `CONSENT_VERSION` (in `constants/types.ts`) re-prompts existing installs
  when privacy practices materially change.
- Routing enforcement lives in `app/_layout.tsx`: `getConsentGiven()` is checked
  before `getOnboardingComplete()`, so an un-consented install is always sent to
  the consent screen first.

**Note on consent strength:** the parent gate is a reasonable in-app barrier but
is not, on its own, one of the FTC's enumerated "verifiable parental consent"
methods (e.g. credit-card transaction, signed form). It is appropriate when the
app does not transmit children's personal information to third parties; the
strongest posture is to combine it with the client-side personalization approach
in GAP 1/GAP 2 so that name/age never leave the device. See Section 6.

---

## 6. Gaps and Recommendations

### GAP 1 — Verifiable Parental Consent ⚠️ Partially Addressed

**Risk:** High. COPPA requires verifiable parental consent before collecting personal information from children under 13. Child name and child age are personal information under 16 C.F.R. § 312.2.

**Implemented (2026-06-11):** A first-launch parental consent gate
(`app/parental-consent.tsx`) with a parent gate + explicit consent affirmation,
persisted via `CONSENT_VERSION` (see Section 5). This blocks story creation and
Voice Chat until a parent consents and is the primary in-app notice.

**Still recommended (to reach full "verifiable" consent):**
1. The parent gate is a barrier, not one of the FTC's enumerated verifiable
   methods (credit-card transaction, signed form, knowledge-based authentication).
   Add one of those if children's personal information continues to be sent to
   third parties.
2. Preferred: rely on COPPA's "internal operations" path by stripping `childName`
   and `childAge` from all server API calls and personalizing client-side only
   (see GAP 2). With no children's PI leaving the device, the implemented
   consent gate plus notice is a defensible posture.

### GAP 2 — Child Name and Age Sent to AI Providers Without DPA Coverage (High)

**Risk:** High. Sending child name (even a first name) and age to Gemini, OpenAI, Anthropic, or OpenRouter without a COPPA-compliant DPA is a regulatory violation.

**Recommendation:**
1. Sign Data Processing Agreements with each active AI provider and verify they extend COPPA protections (no training on minors' data, prompt data not retained).
2. Alternatively, remove `childName` from the server-side story prompt (see GAP 1 option 3). Personalization ("Hi Emma!") could be applied client-side by simple string replacement in the returned story text.
3. Remove `childAge` from the `/api/suggest-settings` prompt or derive a non-personal age bucket (e.g., "young child" vs. "older child") before transmission.

### GAP 3 — Child Name Transmitted to ElevenLabs in TTS Text (High)

**Risk:** High. If a child name was woven into the story by the AI, the same text reaches ElevenLabs.

**Recommendation:**
1. Review and execute a DPA with ElevenLabs that covers COPPA.
2. Or implement the client-side personalization approach from GAP 2 so that the child name never appears in server-side text.

### GAP 4 — Privacy Policy & Parental Notice ✅ Addressed

**Risk:** High. COPPA requires a clear and prominent privacy notice on the service and a separate, more detailed notice sent directly to parents.

**Implemented (2026-06-11):**
1. A Privacy Policy is served at `GET /privacy` (`server/templates/privacy-policy.html`)
   and is also available in-app, offline, at `app/privacy.tsx` covering what is
   collected, how it is used, third-party sharing, retention, and parental rights.
   The prior self-contradiction ("we don't collect personal information" vs. name/age
   being sent to AI) has been corrected, and Voice Chat audio is now disclosed.
2. The policy is linked at first launch (the consent screen), and from
   **Settings → Legal → Privacy Policy**.

**Remaining:** add the Privacy Policy URL to the Play Store / App Store listing
during submission (Phase 3/5), and confirm the contact email
(`privacy@bedtime-chronicles.com`) is monitored before launch.

### GAP 5 — Parent PIN Code Hashing ✅ Resolved

**Previous risk:** The parental controls PIN was stored in `@infinity_heroes_parent_controls` as a plain string.

**Resolution (implemented):** The PIN is now SHA-256 hashed with a random 16-byte per-user salt generated by `expo-crypto`. See `lib/storage.ts` `hashPin()` and `generatePinSalt()`, and `constants/types.ts` `ParentControls.pinCode` (comment: "Now stores SHA-256 hash, not plaintext"). The `pinSalt` field stores the salt alongside the hash so verification can re-derive the digest.

**Remaining recommendation:** For strongest protection, migrate the PIN storage to `expo-secure-store` (iOS Keychain / Android Keystore) so the hashed value is also stored in hardware-backed secure storage rather than plain AsyncStorage. This is a future hardening step, not a COPPA blocker.

### GAP 6 — No Data Deletion Mechanism (Medium)

**Risk:** Medium. COPPA grants parents the right to request deletion of their child's personal information.

**Recommendation:**
1. Expose a "Delete All Data" option in the app that calls `AsyncStorage.clear()` and signs out the Firebase anonymous user.
2. Document the deletion procedure in the Privacy Policy.
3. Because no child data is currently stored server-side (GAP 2 remediation pending), server-side deletion is only needed for: (a) TTS cache files (auto-expire after 24 hours; manual purge can be added), and (b) Firebase anonymous UIDs (these can be deleted via Firebase Admin SDK).

### GAP 7 — Story Feedback Free-Text Has No Length Limit (Low)

**Risk:** Low. The `feedback.text` field in `CachedStory` has no character cap in the TypeScript type. A child could theoretically enter PII into the feedback field.

**Recommendation:** Enforce a reasonable character limit (e.g., 500 characters) on the feedback input UI and in the storage helper.

### GAP 8 — Firebase DPA and COPPA Verification (Low–Medium)

**Risk:** Low to medium. Firebase anonymous auth does not transmit PII, but the operator must verify that the Firebase project is enrolled in Google's applicable data processing terms.

**Recommendation:** In the Firebase console, confirm that "Data Processing and Security Terms" (which include the COPPA certification addendum) are accepted for the project.

---

## 7. Summary Assessment

| Category | Status |
|---|---|
| Analytics/tracking SDKs | Not present — Compliant |
| Advertising | Not present — Compliant |
| Email/account collection | Not present — Compliant |
| Anonymous auth (Firebase) | Compliant with caveats (DPA needed) |
| Child name collection | Optional; **requires parental consent or removal from server calls** |
| Child age collection | Optional; **requires parental consent or removal from server calls** |
| AI provider data processing | **Requires DPAs with each active provider** |
| ElevenLabs data processing | **Requires DPA** |
| Parental consent mechanism | **Not implemented — critical gap** |
| Privacy policy / parental notice | **Not present — critical gap** |
| PIN code security | ✅ SHA-256 hashed with per-user salt via expo-crypto (implemented) |
| Data deletion rights | **No deletion mechanism** |

---

## 8. References

- FTC COPPA Rule: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- FTC COPPA Guidance for App Developers: https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions
- 16 C.F.R. Part 312 (full rule text): https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312
- Google Firebase Data Processing Terms: https://firebase.google.com/terms/data-processing-terms
- OpenAI Business Terms (including DPA): https://openai.com/policies/business-terms/
- Anthropic Usage Policies and DPA: https://www.anthropic.com/legal/commercial-terms
- ElevenLabs Terms of Service: https://elevenlabs.io/terms-of-use

---

*This document reflects the state of the codebase as audited on 2026-04-08. It is informational only and does not constitute legal advice. Consult qualified legal counsel before submitting the app to app stores or making it publicly available.*
