/**
 * Provider adapter interfaces for the generative media platform. Text generation
 * already has a real, working provider-agnostic interface (`AIProvider` in
 * `server/ai/types.ts`, routed by `AIRouter`) — it is re-exported here rather than
 * duplicated. Speech and moderation are new for this increment.
 */

import type { AIProvider } from '../ai/types';
import type { PerformanceProfile, SafetyInspection } from '../../shared/media/schemas';
import type { VoiceBinding } from '../media/provider-bindings';

/** Re-export rather than redefine — `AIProvider` already is a text-generation provider interface. */
export type TextGenerationProvider = AIProvider;

export interface SpeechGenerationRequest {
  text: string;
  voiceBinding: VoiceBinding;
  performanceProfile?: PerformanceProfile;
}

export interface SpeechGenerationResult {
  audioBuffer: Buffer;
  format: 'mp3';
  provider: string;
  model: string;
}

export interface SpeechGenerationProvider {
  providerId: string;
  isAvailable(): boolean;
  generateSpeech(req: SpeechGenerationRequest): Promise<SpeechGenerationResult>;
}

export interface ModerationRequest {
  text: string;
  subjectType: 'chat-reply' | 'realtime-utterance';
}

export interface ModerationResult {
  inspection: SafetyInspection;
  /** The text that is safe to use downstream — the original text when approved, a known-safe replacement on fallback. */
  text: string;
}

export interface ModerationProvider {
  providerId: string;
  moderate(req: ModerationRequest): Promise<ModerationResult>;
}
