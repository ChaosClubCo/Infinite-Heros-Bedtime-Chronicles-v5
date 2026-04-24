import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('feature-flags', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe('default values', () => {
    it('videoEnabled defaults to false (env var absent)', async () => {
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().videoEnabled).toBe(false);
    });

    it('voiceChatEnabled defaults to true (env var absent)', async () => {
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().voiceChatEnabled).toBe(true);
    });

    it('streamingEnabled defaults to true (env var absent)', async () => {
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().streamingEnabled).toBe(true);
    });
  });

  describe('env var overrides', () => {
    it('videoEnabled is true when FEATURE_VIDEO_ENABLED=true', async () => {
      vi.stubEnv('FEATURE_VIDEO_ENABLED', 'true');
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().videoEnabled).toBe(true);
    });

    it('videoEnabled remains false when FEATURE_VIDEO_ENABLED=false', async () => {
      vi.stubEnv('FEATURE_VIDEO_ENABLED', 'false');
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().videoEnabled).toBe(false);
    });

    it('voiceChatEnabled is false when FEATURE_VOICE_CHAT_ENABLED=false', async () => {
      vi.stubEnv('FEATURE_VOICE_CHAT_ENABLED', 'false');
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().voiceChatEnabled).toBe(false);
    });

    it('voiceChatEnabled remains true when FEATURE_VOICE_CHAT_ENABLED=true', async () => {
      vi.stubEnv('FEATURE_VOICE_CHAT_ENABLED', 'true');
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().voiceChatEnabled).toBe(true);
    });

    it('streamingEnabled is false when FEATURE_STREAMING_ENABLED=false', async () => {
      vi.stubEnv('FEATURE_STREAMING_ENABLED', 'false');
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().streamingEnabled).toBe(false);
    });

    it('streamingEnabled remains true when FEATURE_STREAMING_ENABLED=true', async () => {
      vi.stubEnv('FEATURE_STREAMING_ENABLED', 'true');
      const { getFeatureFlags } = await import('./feature-flags');
      expect(getFeatureFlags().streamingEnabled).toBe(true);
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns false for videoEnabled by default', async () => {
      const { isFeatureEnabled } = await import('./feature-flags');
      expect(isFeatureEnabled('videoEnabled')).toBe(false);
    });

    it('returns true for voiceChatEnabled by default', async () => {
      const { isFeatureEnabled } = await import('./feature-flags');
      expect(isFeatureEnabled('voiceChatEnabled')).toBe(true);
    });

    it('returns true for streamingEnabled by default', async () => {
      const { isFeatureEnabled } = await import('./feature-flags');
      expect(isFeatureEnabled('streamingEnabled')).toBe(true);
    });

    it('returns true for videoEnabled when env var is set to true', async () => {
      vi.stubEnv('FEATURE_VIDEO_ENABLED', 'true');
      const { isFeatureEnabled } = await import('./feature-flags');
      expect(isFeatureEnabled('videoEnabled')).toBe(true);
    });

    it('returns false for voiceChatEnabled when env var is set to false', async () => {
      vi.stubEnv('FEATURE_VOICE_CHAT_ENABLED', 'false');
      const { isFeatureEnabled } = await import('./feature-flags');
      expect(isFeatureEnabled('voiceChatEnabled')).toBe(false);
    });

    it('returns false for streamingEnabled when env var is set to false', async () => {
      vi.stubEnv('FEATURE_STREAMING_ENABLED', 'false');
      const { isFeatureEnabled } = await import('./feature-flags');
      expect(isFeatureEnabled('streamingEnabled')).toBe(false);
    });
  });

  describe('getFeatureFlags returns a copy', () => {
    it('mutating the returned object does not affect subsequent calls', async () => {
      const { getFeatureFlags } = await import('./feature-flags');
      const flags = getFeatureFlags();
      flags.streamingEnabled = false;
      expect(getFeatureFlags().streamingEnabled).toBe(true);
    });
  });
});
