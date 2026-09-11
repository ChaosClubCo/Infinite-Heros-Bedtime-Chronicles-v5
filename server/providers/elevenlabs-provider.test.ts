import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerateSpeech } = vi.hoisted(() => ({ mockGenerateSpeech: vi.fn() }));
vi.mock('../elevenlabs', async (importOriginal) => {
  // Keep the real VOICE_MAP (server/media/provider-bindings.ts needs it to
  // build VOICE_BINDING_SEEDS) — only generateSpeech itself is mocked.
  const actual = await importOriginal<typeof import('../elevenlabs')>();
  return { ...actual, generateSpeech: mockGenerateSpeech };
});

import { elevenLabsSpeechProvider } from './elevenlabs-provider';
import { findVoiceBinding } from '../media/provider-bindings';
import type { PerformanceProfile } from '../../shared/media/schemas';

describe('elevenLabsSpeechProvider', () => {
  beforeEach(() => {
    mockGenerateSpeech.mockReset();
    delete process.env.ELEVENLABS_API_KEY;
  });

  it('isAvailable reflects ELEVENLABS_API_KEY presence', () => {
    expect(elevenLabsSpeechProvider.isAvailable()).toBe(false);
    process.env.ELEVENLABS_API_KEY = 'test-key';
    expect(elevenLabsSpeechProvider.isAvailable()).toBe(true);
  });

  it('translates a VoiceBinding into the (text, voiceKey) call and returns mp3 metadata', async () => {
    const buffer = Buffer.from('fake-mp3-bytes');
    mockGenerateSpeech.mockResolvedValueOnce(buffer);

    const voiceBinding = findVoiceBinding('moonbeam')!;
    const result = await elevenLabsSpeechProvider.generateSpeech({
      text: 'Once upon a time',
      voiceBinding,
    });

    expect(mockGenerateSpeech).toHaveBeenCalledWith('Once upon a time', 'moonbeam', undefined);
    expect(result).toEqual({
      audioBuffer: buffer,
      format: 'mp3',
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2',
    });
  });

  it('forwards the performance profile mode as the modeOverride', async () => {
    mockGenerateSpeech.mockResolvedValueOnce(Buffer.from('x'));
    const voiceBinding = findVoiceBinding('captain')!;
    const performanceProfile: PerformanceProfile = {
      schemaVersion: 1,
      characterProfileId: 'captain',
      mode: 'sleep',
      stabilityDelta: 0.15,
      styleDelta: -0.1,
      speakerBoostOverride: false,
    };

    await elevenLabsSpeechProvider.generateSpeech({
      text: 'Shh, sleepy time',
      voiceBinding,
      performanceProfile,
    });

    expect(mockGenerateSpeech).toHaveBeenCalledWith('Shh, sleepy time', 'captain', 'sleep');
  });

  it('propagates a provider failure rather than swallowing it', async () => {
    mockGenerateSpeech.mockRejectedValueOnce(new Error('TTS generation failed: boom'));
    const voiceBinding = findVoiceBinding('giggles')!;

    await expect(
      elevenLabsSpeechProvider.generateSpeech({ text: 'oops', voiceBinding }),
    ).rejects.toThrow('TTS generation failed');
  });
});
