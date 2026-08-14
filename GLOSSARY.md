<!-- Last verified: 2026-08-14 -->
# GLOSSARY.md — Domain Vocabulary

Alphabetical reference for project-specific terms used across the app, docs, and agent context files.

**ADR** — Architecture Decision Record. Short immutable design record stored in [`docs/adr/`](./docs/adr/README.md).

**AI Router** — The server-side abstraction in `server/ai/` that routes text and image requests through task-specific fallback chains with retry and circuit breakers.

**AsyncStorage** — Client-side persistent key-value storage used for settings, stories, badges, streaks, consent, and other offline-first data through `lib/storage.ts`.

**Badge** — Achievement granted for reading or story behavior milestones. Badge evaluation is centralized in `lib/badges.ts`.

**Classic Mode** — Story mode with branching choices and adventure-style progression.

**Cloud Sync** — Optional parent-enabled sync of non-PII progress data to Supabase using `lib/sync/` and `shared/sync-types.ts`.

**COPPA Gate** — The parental-consent flow that runs before protected app use. Implemented through `app/parental-consent.tsx`, `lib/consent-record.ts`, and `lib/ConsentContext.tsx`.

**Custom Hero** — A user-created hero stored locally with the helpers in `lib/customHeroStorage.ts`.

**Fallback Story** — Prewritten safe content served when AI output moderation rejects generated content even after one retry.

**Feature Flag** — Runtime capability switch read from `server/feature-flags.ts`, such as voice chat or stricter content safety.

**Hero** — A built-in or custom character used as the protagonist for story generation. Built-in heroes are defined in `constants/heroes.ts`.

**Idempotency Cache** — Server-side dedup layer in `server/idempotency.ts` that prevents duplicate expensive POST work within a short TTL.

**Mad Libs Mode** — Story mode that weaves child-provided words into a playful story.

**Memory Jar** — UI element for saving or recalling story moments, implemented in `components/MemoryJar.tsx`.

**Offline Queue** — Best-effort local queue in `lib/sync-queue.ts` that stores interaction events until connectivity returns.

**Profile Stub** — Minimal sync-safe profile anchor containing no child name or age, used so badges/streaks can reconcile across devices.

**Prompt Sanitization** — Truncation and normalization of user-supplied strings before they are used in prompts, handled in `server/validation.ts`.

**Replit Integrations** — Prebuilt backend modules under `server/replit_integrations/` for optional features such as audio/image workflows.

**RLS** — Row Level Security in Supabase/Postgres. Used to keep cloud-sync records scoped to the authenticated user.

**Scene** — AI-generated illustration for a story part. Scene assets are requested separately from the main story payload.

**Sleep Mode** — Story mode that removes conflict and choices in favor of a calm, guided bedtime flow.

**Story Guard** — The moderation pipeline in `server/safety/story-guard.ts` that approves, retries, or replaces generated stories.

**Story Seed** — Curated starter prompt/configuration defined in `constants/story-seeds.ts` and surfaced by `app/story-seeds.tsx`.

**Supabase Auth** — The bearer-token authentication model used by the client and server for protected features.

**Sync Record** — Envelope stored in cloud sync with `id`, `updatedAt`, `deleted`, and payload data.

**TTS** — Text-to-speech narration generated through ElevenLabs and cached on-device and optionally in Cloudflare R2.

**Voice Chat** — Conditional feature set for audio conversations backed by OpenAI audio APIs and PostgreSQL transcript storage.

**WSJF** — Weighted Shortest Job First. Backlog scoring method used in [`TODO.md`](./TODO.md).

**Zod** — Runtime validation library used for request schema parsing and defensive API input handling.
