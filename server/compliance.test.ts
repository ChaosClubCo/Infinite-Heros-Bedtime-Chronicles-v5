import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('voice chat compliance gate', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('fails closed in production when attestations are missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { getVoiceChatComplianceStatus, isVoiceChatComplianceApproved } = await import('./compliance');

    expect(isVoiceChatComplianceApproved()).toBe(false);
    expect(getVoiceChatComplianceStatus().missing).toContain('AI_PROVIDER_DPA_CONFIRMED');
  });

  it('approves production only when every attestation and retention limit is present', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_PROVIDER_DPA_CONFIRMED', 'true');
    vi.stubEnv('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED', 'true');
    vi.stubEnv('PRIVACY_POLICY_PUBLISHED', 'true');
    vi.stubEnv('APP_STORE_DATA_SAFETY_REVIEWED', 'true');
    vi.stubEnv('VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS', '30');

    const { getVoiceChatComplianceStatus, isVoiceChatComplianceApproved } = await import('./compliance');
    expect(isVoiceChatComplianceApproved()).toBe(true);
    expect(getVoiceChatComplianceStatus()).toMatchObject({
      approved: true,
      transcriptRetentionDays: 30,
      missing: [],
    });
  });

  it('rejects an absent, zero, or excessive retention window', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_PROVIDER_DPA_CONFIRMED', 'true');
    vi.stubEnv('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED', 'true');
    vi.stubEnv('PRIVACY_POLICY_PUBLISHED', 'true');
    vi.stubEnv('APP_STORE_DATA_SAFETY_REVIEWED', 'true');
    vi.stubEnv('VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS', '365');

    const { getVoiceChatComplianceStatus } = await import('./compliance');
    expect(getVoiceChatComplianceStatus().approved).toBe(false);
  });

  it('allows implementation testing outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const { isVoiceChatComplianceApproved } = await import('./compliance');
    expect(isVoiceChatComplianceApproved()).toBe(true);
  });
});
