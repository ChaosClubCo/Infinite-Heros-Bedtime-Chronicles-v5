export interface AiProviderComplianceStatus {
  approved: boolean;
  providerDpaConfirmed: boolean;
  childDataProcessingApproved: boolean;
  privacyPolicyPublished: boolean;
  appStoreDataSafetyReviewed: boolean;
  missing: string[];
}

export interface VoiceChatComplianceStatus extends AiProviderComplianceStatus {
  transcriptRetentionDays: number | null;
}

export const MAX_VOICE_CHAT_RETENTION_DAYS = 30;
const DEFAULT_NON_PRODUCTION_RETENTION_DAYS = 30;

function envTrue(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === 'true';
}

function getBaseAttestations(): Omit<AiProviderComplianceStatus, 'approved' | 'missing'> {
  return {
    providerDpaConfirmed: envTrue('AI_PROVIDER_DPA_CONFIRMED'),
    childDataProcessingApproved: envTrue('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED'),
    privacyPolicyPublished: envTrue('PRIVACY_POLICY_PUBLISHED'),
    appStoreDataSafetyReviewed: envTrue('APP_STORE_DATA_SAFETY_REVIEWED'),
  };
}

function getBaseMissing(
  status: Omit<AiProviderComplianceStatus, 'approved' | 'missing'>,
): string[] {
  const missing: string[] = [];
  if (!status.providerDpaConfirmed) missing.push('AI_PROVIDER_DPA_CONFIRMED');
  if (!status.childDataProcessingApproved) missing.push('AI_PROVIDER_CHILD_DATA_PROCESSING_APPROVED');
  if (!status.privacyPolicyPublished) missing.push('PRIVACY_POLICY_PUBLISHED');
  if (!status.appStoreDataSafetyReviewed) missing.push('APP_STORE_DATA_SAFETY_REVIEWED');
  return missing;
}

function parseRetentionDays(): number | null {
  const raw = process.env.VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS?.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= MAX_VOICE_CHAT_RETENTION_DAYS
    ? value
    : null;
}

/**
 * Provider approval covers every AI vendor enabled in the deployment, not merely
 * the primary provider. These flags are operator attestations backed by external
 * evidence; they do not create or replace a DPA, legal review, or app-store filing.
 */
export function getAiProviderComplianceStatus(): AiProviderComplianceStatus {
  const status = getBaseAttestations();
  const missing = getBaseMissing(status);
  return { ...status, approved: missing.length === 0, missing };
}

/** Production AI processing is fail-closed; tests/development remain exercisable. */
export function isAiProviderProcessingApproved(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return getAiProviderComplianceStatus().approved;
}

/**
 * Return the retention window used by request-time database cleanup. Production
 * callers get null unless an explicit 1-30 day value is configured;
 * development/test use the same 30-day hard cap by default.
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

/** Voice Chat adds a bounded-retention requirement to the general AI gate. */
export function getVoiceChatComplianceStatus(): VoiceChatComplianceStatus {
  const provider = getAiProviderComplianceStatus();
  const transcriptRetentionDays = parseRetentionDays();
  const missing = [...provider.missing];
  if (transcriptRetentionDays === null) {
    missing.push(`VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS (integer 1-${MAX_VOICE_CHAT_RETENTION_DAYS})`);
  }

  return {
    ...provider,
    approved: missing.length === 0,
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

/**
 * Realtime media sessions (typed-input moderated talkback + streamed speech)
 * add no additional attestation requirement beyond the general AI-provider
 * gate this increment — there is no microphone input and no new retained
 * transcript (see the increment plan), unlike voice chat's bounded-retention
 * requirement. Kept as its own named status/approval pair (rather than reusing
 * `isVoiceChatComplianceApproved`) because it gates a structurally different
 * feature with its own feature flag, and the two must be able to diverge
 * independently as each capability's requirements evolve.
 */
export function getRealtimeMediaComplianceStatus(): AiProviderComplianceStatus {
  return getAiProviderComplianceStatus();
}

/**
 * Production is fail-closed. Development/test may exercise the implementation,
 * but FEATURE_REALTIME_MEDIA_ENABLED must still be explicitly true.
 */
export function isRealtimeMediaComplianceApproved(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return getRealtimeMediaComplianceStatus().approved;
}
