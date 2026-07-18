import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const PARENT_CONSENT_KEY = '@infinity_heroes_parent_consent';

export const CONSENT_VERSION = 3 as const;
export const CONSENT_VERIFICATION_METHOD = 'parent_gate_arithmetic_v1' as const;

export const CONSENT_DISCLOSURES = [
  'Child profile name and age stay on this device. The server accepts older client fields for compatibility but discards those values before story or suggestion prompts are built for AI providers.',
  'A parent account and cloud backup are optional. When enabled, Supabase stores the parent account plus stories and progress; the cloud profile stub excludes the child’s name and age.',
  'Voice Chat is unavailable for this release. Microphone access and voice-message processing remain disabled until privacy, safety, provider, and device-review requirements are separately approved. If a later approved release enables Voice Chat, its data practices will require a new consent version.',
  'Child-facing AI text is generated under a child-safety policy and checked before it is displayed or narrated. There are no ads, public child profiles, stranger chat, or behavioral advertising.',
  'Delete All Data removes the parent account, cloud backup records, retained server data, and local device data. A successful server deletion returns a PII-free verification receipt tied to the deployed release identity.',
] as const;

const CONSENT_CANONICAL_TEXT = CONSENT_DISCLOSURES.join('\n');

export interface VerifiableParentConsent {
  consented: true;
  consentedAt: number;
  version: typeof CONSENT_VERSION;
  contentHash: string;
  locale: string;
  verificationMethod: typeof CONSENT_VERIFICATION_METHOD;
}

function resolveLocale(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale?.trim();
    return locale || 'und';
  } catch {
    return 'und';
  }
}

export async function getCurrentConsentContentHash(): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    CONSENT_CANONICAL_TEXT,
  );
}

export async function recordParentConsent(): Promise<VerifiableParentConsent> {
  const record: VerifiableParentConsent = {
    consented: true,
    consentedAt: Date.now(),
    version: CONSENT_VERSION,
    contentHash: await getCurrentConsentContentHash(),
    locale: resolveLocale(),
    verificationMethod: CONSENT_VERIFICATION_METHOD,
  };

  await AsyncStorage.setItem(PARENT_CONSENT_KEY, JSON.stringify(record));
  return record;
}

export async function getParentConsentRecord(): Promise<VerifiableParentConsent | null> {
  try {
    const raw = await AsyncStorage.getItem(PARENT_CONSENT_KEY);
    if (!raw) return null;

    const value = JSON.parse(raw) as Partial<VerifiableParentConsent>;
    if (
      value.consented !== true
      || value.version !== CONSENT_VERSION
      || typeof value.consentedAt !== 'number'
      || !Number.isFinite(value.consentedAt)
      || value.consentedAt <= 0
      || typeof value.contentHash !== 'string'
      || !/^[0-9a-f]{64}$/i.test(value.contentHash)
      || typeof value.locale !== 'string'
      || value.locale.trim().length === 0
      || value.verificationMethod !== CONSENT_VERIFICATION_METHOD
    ) {
      return null;
    }

    const expectedHash = await getCurrentConsentContentHash();
    return value.contentHash.toLowerCase() === expectedHash.toLowerCase()
      ? value as VerifiableParentConsent
      : null;
  } catch {
    return null;
  }
}

/**
 * Fail closed unless the exact current disclosure copy, version, locale, and
 * parent-gate verification method are all present and valid.
 */
export async function getConsentGiven(): Promise<boolean> {
  return (await getParentConsentRecord()) !== null;
}
