import { describe, expect, it } from 'vitest';
import { VOICE_MAP } from '../elevenlabs';
import { VOICE_BINDING_SEEDS, findVoiceBinding, isVoiceBinding, VoiceBindingSchema } from './provider-bindings';

describe('VOICE_BINDING_SEEDS', () => {
  it('has exactly one binding per VOICE_MAP entry', () => {
    expect(VOICE_BINDING_SEEDS.length).toBe(Object.keys(VOICE_MAP).length);
  });

  it('every binding validates and points at the correct ElevenLabs voice id', () => {
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      const binding = findVoiceBinding(key);
      expect(binding).toBeDefined();
      expect(isVoiceBinding(binding)).toBe(true);
      expect(binding?.providerVoiceId).toBe(voice.id);
      expect(binding?.providerVoiceSettings).toEqual(voice.settings);
      expect(binding?.provider).toBe('elevenlabs');
    }
  });

  it('findVoiceBinding misses an unknown character id', () => {
    expect(findVoiceBinding('nonexistent')).toBeUndefined();
  });

  it('rejects a binding for a non-elevenlabs provider', () => {
    const bad = { ...VOICE_BINDING_SEEDS[0], provider: 'azure' };
    expect(VoiceBindingSchema.safeParse(bad).success).toBe(false);
  });
});
