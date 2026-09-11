/**
 * Provider-proprietary voice bindings — the server-only half of the
 * CharacterProfile/VoiceBinding split described in the increment plan.
 *
 * `shared/media/schemas.ts`'s `CharacterProfile` is intentionally provider-neutral
 * (no ElevenLabs voice ID). This module supplies the missing, proprietary half by
 * wrapping `VOICE_MAP` from `server/elevenlabs.ts` — which stays completely
 * unmodified — as versioned `VoiceBinding` records. Never import this module from
 * `app/`/`lib/`.
 */

import { z } from 'zod';
import { VOICE_MAP } from '../elevenlabs';

export const VOICE_BINDING_SCHEMA_VERSION = 1 as const;

export const VoiceBindingSchema = z.object({
  schemaVersion: z.literal(VOICE_BINDING_SCHEMA_VERSION),
  characterProfileId: z.string().min(1),
  provider: z.literal('elevenlabs'),
  providerVoiceId: z.string().min(1),
  providerVoiceSettings: z.object({
    stability: z.number(),
    similarity_boost: z.number(),
    style: z.number(),
    use_speaker_boost: z.boolean(),
  }),
});
export type VoiceBinding = z.infer<typeof VoiceBindingSchema>;

export function isVoiceBinding(value: unknown): value is VoiceBinding {
  return VoiceBindingSchema.safeParse(value).success;
}

/**
 * One binding per `VOICE_MAP` entry. `characterProfileId` equals the `VOICE_MAP`
 * key (e.g. "moonbeam"), matching `CHARACTER_PROFILE_SEEDS` in
 * `shared/media/schemas.ts` one-to-one.
 */
export const VOICE_BINDING_SEEDS: readonly VoiceBinding[] = Object.entries(VOICE_MAP).map(
  ([characterProfileId, voice]) => ({
    schemaVersion: VOICE_BINDING_SCHEMA_VERSION,
    characterProfileId,
    provider: 'elevenlabs' as const,
    providerVoiceId: voice.id,
    providerVoiceSettings: { ...voice.settings },
  }),
);

export function findVoiceBinding(characterProfileId: string): VoiceBinding | undefined {
  return VOICE_BINDING_SEEDS.find((binding) => binding.characterProfileId === characterProfileId);
}
