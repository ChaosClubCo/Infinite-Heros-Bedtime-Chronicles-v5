export interface VoiceChatComplianceStatus {
  approved: boolean;
  providerDpaConfirmed: boolean;
  childDataProcessingApproved: boolean;
  privacyPolicyPublished: boolean;
  appStoreDataSafetyReviewed: boolean;
  transcriptRetentionDays: number | null;
  missing: string[];
}

const DEFAULT_NON_PRODUCTION_RETENTION_DAYS = 30;

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
 * Return the retention window used by database cleanup. Production callers get
 * null unless an explicit 1-90 day value is configured; development/test use a
 * conservative 30-day default so the behavior remains testable without turning
 * an absent production attestation into an implicit approval.
 */
export function getVoiceChatTranscriptRetentionDays(): number | null {
  const configured = parseRetentionDays();
  if (configured !== null) return configured;
  return process.env.NODE_ENV === 'production'
    ? null
    : DEFAULT_NON_PRODUCTION_RETENTION_DAYS;
}

export function getVoiceChatTranscriptCutoff(nowMs = Date.now()): Date | null {
  const days = getVoiceChatTranscriptRetentionDays();
  if (days === null) return null;
  return new Date(nowMs - days * 24 * 60 * 60 * 1000);
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
