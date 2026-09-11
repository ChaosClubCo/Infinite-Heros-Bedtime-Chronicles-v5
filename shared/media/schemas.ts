/**
 * Canonical, provider-neutral media-domain schemas — the shared vocabulary for the
 * generative media platform (realtime sessions, character voices, safety
 * inspections, consent, and provenance). Deliberately dependency-free of anything
 * but `zod` (and the sibling, equally dependency-free `shared/safety-terms.ts`) so
 * Metro can bundle it into the mobile client exactly like `shared/safety-terms.ts`.
 *
 * Rules these schemas must follow (see the increment plan):
 *  - Every schema carries a literal `schemaVersion` so a future shape change can be
 *    detected and migrated deliberately instead of silently misread.
 *  - Provider-proprietary IDs (ElevenLabs voice IDs, model IDs, request shapes)
 *    never appear here — they live in `server/media/provider-bindings.ts`, which is
 *    server-only and never imported by `app/`/`lib/`.
 *  - This module cannot import from `server/` (wrong dependency direction) or from
 *    `lib/` (React Native only) — constants that must stay in sync across those
 *    boundaries (e.g. voice categories, the consent-record version) are duplicated
 *    here with a comment pointing at the source of truth, mirroring how
 *    `shared/safety-terms.ts` (HARD terms) and `server/safety/terms.ts` (SOFT terms)
 *    already split by trust boundary rather than by import.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

/** Mirrors `VALID_MODES` in `server/validation.ts`. */
export const MediaSessionModeSchema = z.enum(['classic', 'madlibs', 'sleep']);
export type MediaSessionMode = z.infer<typeof MediaSessionModeSchema>;

/** Mirrors `VoiceCategory` in `server/elevenlabs.ts`. */
export const CharacterProfileCategorySchema = z.enum(['sleep', 'classic', 'fun']);
export type CharacterProfileCategory = z.infer<typeof CharacterProfileCategorySchema>;

/**
 * Expected value of `CONSENT_VERSION` (`lib/consent-record.ts`) that a
 * `realtime-media`-scoped `ConsentArtifact` must carry to be accepted. This is a
 * client-storage version number, not a schema version — it changes only when the
 * parent-facing disclosure copy changes, and must be bumped here in lockstep with
 * `lib/consent-record.ts` (the two files cannot share code across the
 * server/client boundary, so this is a deliberately duplicated constant, not a
 * derived one).
 */
export const EXPECTED_CONSENT_RECORD_VERSION = 3 as const;

// ---------------------------------------------------------------------------
// MediaSession
// ---------------------------------------------------------------------------

export const MEDIA_SESSION_SCHEMA_VERSION = 1 as const;

export const MediaSessionStatusSchema = z.enum(['active', 'completed', 'cancelled', 'error']);
export type MediaSessionStatus = z.infer<typeof MediaSessionStatusSchema>;

export const MediaSessionTransportSchema = z.enum(['websocket', 'sse-fallback']);
export type MediaSessionTransport = z.infer<typeof MediaSessionTransportSchema>;

export const MediaSessionSchema = z.object({
  schemaVersion: z.literal(MEDIA_SESSION_SCHEMA_VERSION),
  id: z.string().min(1),
  status: MediaSessionStatusSchema,
  mode: MediaSessionModeSchema,
  characterProfileId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  consentArtifactId: z.string().min(1),
  transport: MediaSessionTransportSchema,
  /**
   * The authenticated `req.user.uid` that created this session. Binds the
   * session to its owner so the WS upgrade handshake and the status/cancel
   * routes can enforce that only the creator ever observes or controls it —
   * a session id alone is not authorization.
   */
  ownerId: z.string().min(1),
});
export type MediaSession = z.infer<typeof MediaSessionSchema>;

export function isMediaSession(value: unknown): value is MediaSession {
  return MediaSessionSchema.safeParse(value).success;
}

// ---------------------------------------------------------------------------
// CharacterProfile
// ---------------------------------------------------------------------------

export const CHARACTER_PROFILE_SCHEMA_VERSION = 1 as const;

export const CharacterProfileSchema = z.object({
  schemaVersion: z.literal(CHARACTER_PROFILE_SCHEMA_VERSION),
  id: z.string().min(1),
  displayName: z.string().min(1),
  category: CharacterProfileCategorySchema,
  personality: z.string().min(1),
  description: z.string().min(1),
});
export type CharacterProfile = z.infer<typeof CharacterProfileSchema>;

export function isCharacterProfile(value: unknown): value is CharacterProfile {
  return CharacterProfileSchema.safeParse(value).success;
}

/**
 * One canonical CharacterProfile per existing ElevenLabs persona
 * (`VOICE_MAP` in `server/elevenlabs.ts`). `id` intentionally equals the
 * `VOICE_MAP` key — that key is *not* a provider-proprietary identifier (it is
 * this app's own persona name, e.g. "moonbeam"), so reusing it here is a
 * relabeling, not a schema-boundary violation. The actual ElevenLabs voice ID
 * lives only in `server/media/provider-bindings.ts`.
 */
export const CHARACTER_PROFILE_SEEDS: readonly CharacterProfile[] = [
  { schemaVersion: 1, id: 'moonbeam', displayName: 'Moonbeam', category: 'sleep', personality: 'Warm, maternal, calming', description: 'Warm & soothing lullaby voice' },
  { schemaVersion: 1, id: 'whisper', displayName: 'Whisper', category: 'sleep', personality: 'Quiet, dreamy, tender', description: 'Soft & gentle dreamy narrator' },
  { schemaVersion: 1, id: 'stardust', displayName: 'Stardust', category: 'sleep', personality: 'Mystical, airy, enchanting', description: 'Ethereal & magical bedtime guide' },
  { schemaVersion: 1, id: 'captain', displayName: 'Captain Story', category: 'classic', personality: 'Dramatic, expressive, enchanting', description: 'Dramatic British storyteller' },
  { schemaVersion: 1, id: 'professor', displayName: 'Professor Nova', category: 'classic', personality: 'Wise, warm, authoritative', description: 'Deep & wise adventure narrator' },
  { schemaVersion: 1, id: 'aurora', displayName: 'Aurora', category: 'classic', personality: 'Warm, engaging, versatile', description: 'Warm & expressive tale weaver' },
  { schemaVersion: 1, id: 'giggles', displayName: 'Giggles', category: 'fun', personality: 'Giggly, energetic, silly', description: 'Playful & silly fun narrator' },
  { schemaVersion: 1, id: 'blaze', displayName: 'Blaze', category: 'fun', personality: 'Bold, heroic, exciting', description: 'Bold & exciting action voice' },
  { schemaVersion: 1, id: 'ziggy', displayName: 'Ziggy', category: 'fun', personality: 'Animated, cheerful, whimsical', description: 'Animated & cheerful character voice' },
];

export function findCharacterProfile(id: string): CharacterProfile | undefined {
  return CHARACTER_PROFILE_SEEDS.find((profile) => profile.id === id);
}

// ---------------------------------------------------------------------------
// PerformanceProfile
// ---------------------------------------------------------------------------

export const PERFORMANCE_PROFILE_SCHEMA_VERSION = 1 as const;

export const PerformanceProfileSchema = z.object({
  schemaVersion: z.literal(PERFORMANCE_PROFILE_SCHEMA_VERSION),
  characterProfileId: z.string().min(1),
  mode: MediaSessionModeSchema,
  stabilityDelta: z.number(),
  styleDelta: z.number(),
  speakerBoostOverride: z.boolean().nullable(),
});
export type PerformanceProfile = z.infer<typeof PerformanceProfileSchema>;

export function isPerformanceProfile(value: unknown): value is PerformanceProfile {
  return PerformanceProfileSchema.safeParse(value).success;
}

/**
 * Canonicalizes the sleep-mode softening branch already implemented inline in
 * `generateSpeech()` (`server/elevenlabs.ts`): a non-sleep voice used in sleep
 * mode gets `stability += 0.15` (capped), `style -= 0.10` (floored), and no
 * speaker boost. Declarative here; `server/elevenlabs.ts`'s own implementation
 * is untouched this increment — this is the data-first expression of the same
 * rule, used by the realtime slice rather than replacing the existing function.
 */
export const SLEEP_MODE_PERFORMANCE_OVERRIDE: Pick<PerformanceProfile, 'stabilityDelta' | 'styleDelta' | 'speakerBoostOverride'> = {
  stabilityDelta: 0.15,
  styleDelta: -0.10,
  speakerBoostOverride: false,
};

// ---------------------------------------------------------------------------
// GenerationJob
// ---------------------------------------------------------------------------

export const GENERATION_JOB_SCHEMA_VERSION = 1 as const;

export const GenerationJobKindSchema = z.enum(['speech', 'text']);
export const GenerationJobStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed']);

export const GenerationJobSchema = z.object({
  schemaVersion: z.literal(GENERATION_JOB_SCHEMA_VERSION),
  id: z.string().min(1),
  kind: GenerationJobKindSchema,
  status: GenerationJobStatusSchema,
  provider: z.string().min(1),
  model: z.string().min(1),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  /** Opaque pointer (e.g. a route path) — never inline base64 audio/image bytes. */
  resultRef: z.string().nullable(),
  error: z.string().nullable(),
});
export type GenerationJob = z.infer<typeof GenerationJobSchema>;

export function isGenerationJob(value: unknown): value is GenerationJob {
  return GenerationJobSchema.safeParse(value).success;
}

// ---------------------------------------------------------------------------
// SafetyInspection
// ---------------------------------------------------------------------------

export const SAFETY_INSPECTION_SCHEMA_VERSION = 1 as const;

export const SafetyInspectionSubjectTypeSchema = z.enum(['chat-reply', 'realtime-utterance']);
export const SafetyInspectionOutcomeSchema = z.enum(['approved', 'fallback']);

export const SafetyInspectionSchema = z.object({
  schemaVersion: z.literal(SAFETY_INSPECTION_SCHEMA_VERSION),
  id: z.string().min(1),
  subjectType: SafetyInspectionSubjectTypeSchema,
  outcome: SafetyInspectionOutcomeSchema,
  /**
   * Values mirror `ModerationCategory` in `server/safety/content-safety.ts`
   * (a superset of `SafetyCategory` from `shared/safety-terms.ts` that also
   * includes 'structural' | 'leakage' | 'pii'). Kept as a plain string array
   * here — this is a read-model over the existing safety verdict for
   * observability/provenance, not a re-implementation of the safety engine, so
   * it deliberately does not re-derive a strict literal union across the
   * server/shared boundary.
   */
  categories: z.array(z.string().min(1)),
  checkedAt: z.string(),
});
export type SafetyInspection = z.infer<typeof SafetyInspectionSchema>;

export function isSafetyInspection(value: unknown): value is SafetyInspection {
  return SafetyInspectionSchema.safeParse(value).success;
}

// ---------------------------------------------------------------------------
// ConsentArtifact
// ---------------------------------------------------------------------------

export const CONSENT_ARTIFACT_SCHEMA_VERSION = 1 as const;

/**
 * `"realtime-media"` is a new, additive scope. A parent's existing
 * story-generation consent is never reinterpreted as covering the realtime
 * media surface — a session cannot be created without a `ConsentArtifact`
 * carrying this exact scope.
 */
export const ConsentArtifactScopeSchema = z.enum(['story-generation', 'realtime-media']);

export const ConsentArtifactSchema = z.object({
  schemaVersion: z.literal(CONSENT_ARTIFACT_SCHEMA_VERSION),
  id: z.string().min(1),
  /** Mirrors `CONSENT_VERSION` in `lib/consent-record.ts` at the time consent was granted. */
  consentRecordVersion: z.number().int().positive(),
  grantedAt: z.string(),
  scope: ConsentArtifactScopeSchema,
});
export type ConsentArtifact = z.infer<typeof ConsentArtifactSchema>;

export function isConsentArtifact(value: unknown): value is ConsentArtifact {
  return ConsentArtifactSchema.safeParse(value).success;
}

// ---------------------------------------------------------------------------
// ProvenanceRecord
// ---------------------------------------------------------------------------

export const PROVENANCE_RECORD_SCHEMA_VERSION = 1 as const;

export const ProvenanceRecordSchema = z.object({
  schemaVersion: z.literal(PROVENANCE_RECORD_SCHEMA_VERSION),
  id: z.string().min(1),
  subjectId: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  /** Exact 40-char deployed source revision, or null when unavailable — mirrors `ServerDeletionReceipt.releaseSha`. */
  releaseSha: z.string().regex(/^[0-9a-f]{40}$/i).nullable(),
  generatedAt: z.string(),
  safetyInspectionId: z.string().min(1).nullable(),
});
export type ProvenanceRecord = z.infer<typeof ProvenanceRecordSchema>;

export function isProvenanceRecord(value: unknown): value is ProvenanceRecord {
  return ProvenanceRecordSchema.safeParse(value).success;
}

// ---------------------------------------------------------------------------
// RealtimeEvent
// ---------------------------------------------------------------------------

export const REALTIME_EVENT_SCHEMA_VERSION = 1 as const;

export const RealtimeEventTypeSchema = z.enum([
  'session_started',
  'response_text_delta',
  'safety_inspection',
  'speech_chunk_ready',
  'speech_complete',
  'error',
  'session_ended',
]);
export type RealtimeEventType = z.infer<typeof RealtimeEventTypeSchema>;

/**
 * Versioned server->client event envelope. Binary audio bytes are NEVER carried
 * in `payload` — a `speech_chunk_ready` event only ever describes a chunk
 * (`sequence`, `byteLength`); the actual bytes follow as a separate binary
 * WebSocket frame (or, on the SSE-fallback transport, are fetched from a
 * `resultRef` route, matching the existing `/api/tts-audio/:file` pattern).
 */
export const RealtimeEventSchema = z.object({
  schemaVersion: z.literal(REALTIME_EVENT_SCHEMA_VERSION),
  eventId: z.string().min(1),
  sessionId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  eventType: RealtimeEventTypeSchema,
  timestampMs: z.number().int().nonnegative(),
  payload: z.record(z.string(), z.unknown()),
});
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

export function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  return RealtimeEventSchema.safeParse(value).success;
}
