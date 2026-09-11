import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AI provider and Voice Chat compliance gates', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('fails closed for all production AI processing when attestations are missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const {
      getAiProviderComplianceStatus,
      getVoiceChatComplianceStatus,
      getVoiceChatTranscriptCutoff,
      getRealtimeMediaComplianceStatus,
      isAiProviderProcessingApproved,
      isVoiceChatComplianceApproved,
      isRealtimeMediaComplianceApproved,
    } = await import('./compliance');

    expect(isAiProviderProcessingApproved()).toBe(false);
    expect(isVoiceChatComplianceApproved()).toBe(false);
    expect(isRealtimeMediaComplianceApproved()).toBe(false);
    expect(getAiProviderComplianceStatus().missing).toContain('AI_PROVIDER_DPA_CONFIRMED');
    expect(getVoiceChatComplianceStatus().missing).toContain('AI_PROVIDER_DPA_CONFIRMED');
    expect(getRealtimeMediaComplianceStatus().missing).toContain('AI_PROVIDER_DPA_CONFIRMED');
    expect(getVoiceChatTranscriptCutoff()).toBeNull();
  });

  it('approves production only when every attestation and retention limit is present', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_PROVIDER_DPA_CONFIRMED', 'true');
    vi.stubEnv('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED', 'true');
    vi.stubEnv('PRIVACY_POLICY_PUBLISHED', 'true');
    vi.stubEnv('APP_STORE_DATA_SAFETY_REVIEWED', 'true');
    vi.stubEnv('VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS', '30');

    const {
      getAiProviderComplianceStatus,
      getVoiceChatComplianceStatus,
      getVoiceChatTranscriptCutoff,
      getRealtimeMediaComplianceStatus,
      isAiProviderProcessingApproved,
      isVoiceChatComplianceApproved,
      isRealtimeMediaComplianceApproved,
    } = await import('./compliance');
    expect(isAiProviderProcessingApproved()).toBe(true);
    expect(isVoiceChatComplianceApproved()).toBe(true);
    expect(isRealtimeMediaComplianceApproved()).toBe(true);
    expect(getAiProviderComplianceStatus()).toMatchObject({ approved: true, missing: [] });
    expect(getVoiceChatComplianceStatus()).toMatchObject({
      approved: true,
      transcriptRetentionDays: 30,
      missing: [],
    });
    expect(getRealtimeMediaComplianceStatus()).toMatchObject({ approved: true, missing: [] });
    expect(getVoiceChatTranscriptCutoff(Date.UTC(2026, 6, 16))).toEqual(
      new Date(Date.UTC(2026, 5, 16)),
    );
  });

  it('realtime media compliance does not require the voice-chat transcript retention attestation', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_PROVIDER_DPA_CONFIRMED', 'true');
    vi.stubEnv('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED', 'true');
    vi.stubEnv('PRIVACY_POLICY_PUBLISHED', 'true');
    vi.stubEnv('APP_STORE_DATA_SAFETY_REVIEWED', 'true');
    // Deliberately no VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS set.

    const { isRealtimeMediaComplianceApproved, isVoiceChatComplianceApproved } = await import('./compliance');
    expect(isRealtimeMediaComplianceApproved()).toBe(true);
    expect(isVoiceChatComplianceApproved()).toBe(false);
  });

  it('rejects a retention window beyond the database hard cap', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_PROVIDER_DPA_CONFIRMED', 'true');
    vi.stubEnv('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED', 'true');
    vi.stubEnv('PRIVACY_POLICY_PUBLISHED', 'true');
    vi.stubEnv('APP_STORE_DATA_SAFETY_REVIEWED', 'true');
    vi.stubEnv('VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS', '31');

    const { getVoiceChatComplianceStatus, getVoiceChatTranscriptRetentionDays } = await import('./compliance');
    expect(getVoiceChatComplianceStatus().approved).toBe(false);
    expect(getVoiceChatTranscriptRetentionDays()).toBeNull();
  });

  it('allows implementation testing with a conservative default retention window', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const {
      getVoiceChatTranscriptRetentionDays,
      isAiProviderProcessingApproved,
      isVoiceChatComplianceApproved,
      isRealtimeMediaComplianceApproved,
    } = await import('./compliance');
    expect(isAiProviderProcessingApproved()).toBe(true);
    expect(isVoiceChatComplianceApproved()).toBe(true);
    expect(isRealtimeMediaComplianceApproved()).toBe(true);
    expect(getVoiceChatTranscriptRetentionDays()).toBe(30);
  });
});
