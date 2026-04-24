interface FeatureFlags {
  videoEnabled: boolean;
  voiceChatEnabled: boolean;
  streamingEnabled: boolean;
}

const flags: FeatureFlags = {
  videoEnabled: process.env.FEATURE_VIDEO_ENABLED === 'true',
  voiceChatEnabled: process.env.FEATURE_VOICE_CHAT_ENABLED !== 'false', // default on
  streamingEnabled: process.env.FEATURE_STREAMING_ENABLED !== 'false', // default on
};

export function getFeatureFlags(): FeatureFlags {
  return { ...flags };
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return flags[flag];
}
