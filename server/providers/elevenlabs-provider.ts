/**
 * SpeechGenerationProvider adapter wrapping the existing `server/elevenlabs.ts`
 * implementation verbatim. `generateSpeech()` itself is untouched by this
 * increment — this file only translates the canonical `VoiceBinding` +
 * `PerformanceProfile` request shape into that function's existing
 * `(text, voiceKey, modeOverride)` signature.
 */

import { generateSpeech } from '../elevenlabs';
import type { SpeechGenerationProvider, SpeechGenerationRequest, SpeechGenerationResult } from './types';

const ELEVENLABS_TTS_MODEL = 'eleven_multilingual_v2';

export const elevenLabsSpeechProvider: SpeechGenerationProvider = {
  providerId: 'elevenlabs',

  isAvailable(): boolean {
    return !!process.env.ELEVENLABS_API_KEY;
  },

  async generateSpeech(req: SpeechGenerationRequest): Promise<SpeechGenerationResult> {
    // VOICE_BINDING_SEEDS sets characterProfileId === the VOICE_MAP key (e.g.
    // "moonbeam"), so it doubles as the voiceKey `generateSpeech` expects —
    // no separate reverse lookup from providerVoiceId is needed.
    const voiceKey = req.voiceBinding.characterProfileId;
    const modeOverride = req.performanceProfile?.mode;

    const audioBuffer = await generateSpeech(req.text, voiceKey, modeOverride);

    return {
      audioBuffer,
      format: 'mp3',
      provider: 'elevenlabs',
      model: ELEVENLABS_TTS_MODEL,
    };
  },
};
