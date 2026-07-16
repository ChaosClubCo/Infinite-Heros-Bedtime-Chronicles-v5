interface FeatureFlags {
  videoEnabled: boolean;
  voiceChatEnabled: boolean;
  streamingEnabled: boolean;
  /** Server-authoritative moderation of generated story text. Default ON. */
  contentSafetyEnabled: boolean;
  /** Optional LLM second pass on borderline stories. Default OFF (cost/latency). */
  contentSafetyLlmLayer: boolean;
  /** Tighten the soft-term threshold so a single soft hit rejects. Default OFF. */
  contentSafetyStrict: boolean;
}

const flags: FeatureFlags = {
  videoEnabled: process.env.FEATURE_VIDEO_ENABLED === 'true',
  voiceChatEnabled: process.env.FEATURE_VOICE_CHAT_ENABLED !== 'false', // default on
  streamingEnabled: process.env.FEATURE_STREAMING_ENABLED !== 'false', // default on
  contentSafetyEnabled: process.env.FEATURE_CONTENT_SAFETY_ENABLED !== 'false', // default on
  contentSafetyLlmLayer: process.env.FEATURE_CONTENT_SAFETY_LLM === 'true', // default off
  contentSafetyStrict: process.env.FEATURE_CONTENT_SAFETY_STRICT === 'true', // default off
};

export function getFeatureFlags(): FeatureFlags {
  return { ...flags };
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return flags[flag];
}
