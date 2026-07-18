import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  CONSENT_CONTENT_HASH_SOURCE,
  CONSENT_VERIFICATION_METHOD,
  CONSENT_VERSION,
  DEFAULT_PARENT_CONSENT,
  type ParentConsent,
} from '@/constants/types';

const PARENT_CONSENT_KEY = '@infinity_heroes_parent_consent';

export interface VerifiedParentConsent extends ParentConsent {
  contentHash: string;
  locale: string;
  verificationMethod: typeof CONSENT_VERIFICATION_METHOD;
}

export async function getCurrentConsentContentHash(): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    CONSENT_CONTENT_HASH_SOURCE,
  );
}

function resolveLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'und';
  } catch {
    return 'und';
  }
}

export async function readVerifiedParentConsent(): Promise<ParentConsent> {
  try {
    const value = await AsyncStorage.getItem(PARENT_CONSENT_KEY);
    if (!value) return DEFAULT_PARENT_CONSENT;
    const parsed = JSON.parse(value) as Partial<ParentConsent>;
    return {
      consented: parsed.consented === true,
      consentedAt: typeof parsed.consentedAt === 'number' ? parsed.consentedAt : 0,
      version: typeof parsed.version === 'number' ? parsed.version : 0,
      contentHash: typeof parsed.contentHash === 'string' ? parsed.contentHash : '',
      locale: typeof parsed.locale === 'string' ? parsed.locale : '',
      verificationMethod: parsed.verificationMethod,
    };
  } catch {
    return DEFAULT_PARENT_CONSENT;
  }
}

export async function getVerifiedConsentGiven(): Promise<boolean> {
  const [consent, currentContentHash] = await Promise.all([
    readVerifiedParentConsent(),
    getCurrentConsentContentHash(),
  ]);

  return consent.consented === true
    && consent.version === CONSENT_VERSION
    && consent.contentHash === currentContentHash
    && typeof consent.locale === 'string'
    && consent.locale.length > 0
    && consent.verificationMethod === CONSENT_VERIFICATION_METHOD;
}

export async function setVerifiedParentConsent(locale = resolveLocale()): Promise<VerifiedParentConsent> {
  const record: VerifiedParentConsent = {
    consented: true,
    consentedAt: Date.now(),
    version: CONSENT_VERSION,
    contentHash: await getCurrentConsentContentHash(),
    locale: locale.trim() || 'und',
    verificationMethod: CONSENT_VERIFICATION_METHOD,
  };

  await AsyncStorage.setItem(PARENT_CONSENT_KEY, JSON.stringify(record));
  return record;
}
