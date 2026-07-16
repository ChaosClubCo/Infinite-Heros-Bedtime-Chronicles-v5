export interface VoiceChatComplianceStatus {
  approved: boolean;
  providerDpaConfirmed: boolean;
  childDataProcessingApproved: boolean;
  privacyPolicyPublished: boolean;
  appStoreDataSafetyReviewed: boolean;
  transcriptRetentionDays: number | null;
  missing: string[];
}

function envTrue(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === 'true';
}

function parseRetentionDays(): number | null {
  const raw = process.env.VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS?.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 90 ? value : null;
}

/**
 * Translate non-code legal/operational approvals into explicit deploy-time
 * attestations. These flags do not replace counsel or provider agreements; they
 * prevent a production deploy from silently enabling child voice processing
 * before the responsible owner has recorded those approvals.
 */
export function getVoiceChatComplianceStatus(): VoiceChatComplianceStatus {
  const providerDpaConfirmed = envTrue('AI_PROVIDER_DPA_CONFIRMED');
  const childDataProcessingApproved = envTrue('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED');
  const privacyPolicyPublished = envTrue('PRIVACY_POLICY_PUBLISHED');
  const appStoreDataSafetyReviewed = envTrue('APP_STORE_DATA_SAFETY_REVIEWED');
  const transcriptRetentionDays = parseRetentionDays();

  const missing: string[] = [];
  if (!providerDpaConfirmed) missing.push('AI_PROVIDER_DPA_CONFIRMED');
  if (!childDataProcessingApproved) missing.push('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED');
  if (!privacyPolicyPublished) missing.push('PRIVACY_POLICY_PUBLISHED');
  if (!appStoreDataSafetyReviewed) missing.push('APP_STORE_DATA_SAFETY_REVIEWED');
  if (transcriptRetentionDays === null) missing.push('VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS (integer 1-90)');

  return {
    approved: missing.length === 0,
    providerDpaConfirmed,
    childDataProcessingApproved,
    privacyPolicyPublished,
    appStoreDataSafetyReviewed,
    transcriptRetentionDays,
    missing,
  };
}

/**
 * Production is fail-closed. Development/test may exercise the implementation,
 * but FEATURE_VOICE_CHAT_ENABLED must still be explicitly true.
 */
export function isVoiceChatComplianceApproved(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return getVoiceChatComplianceStatus().approved;
}
