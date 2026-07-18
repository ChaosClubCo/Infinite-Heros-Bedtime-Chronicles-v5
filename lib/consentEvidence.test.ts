import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_VERIFICATION_METHOD,
  CONSENT_VERSION,
} from '@/constants/types';

let mockStorage: Record<string, string> = {};
const CONSENT_KEY = '@infinity_heroes_parent_consent';
const TEST_HASH = 'a'.repeat(64);

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
  },
}));

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: vi.fn(() => Promise.resolve(TEST_HASH)),
}));

import {
  getVerifiedConsentGiven,
  setVerifiedParentConsent,
} from './consentEvidence';

describe('verifiable parental consent evidence', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('stores version, content hash, locale, timestamp, and verification method', async () => {
    const record = await setVerifiedParentConsent('en-US');

    expect(record).toMatchObject({
      consented: true,
      version: CONSENT_VERSION,
      contentHash: TEST_HASH,
      locale: 'en-US',
      verificationMethod: CONSENT_VERIFICATION_METHOD,
    });
    expect(record.consentedAt).toBeGreaterThan(0);
    expect(JSON.parse(mockStorage[CONSENT_KEY])).toEqual(record);
    await expect(getVerifiedConsentGiven()).resolves.toBe(true);
  });

  it('rejects a legacy version-only consent record', async () => {
    mockStorage[CONSENT_KEY] = JSON.stringify({
      consented: true,
      consentedAt: Date.now(),
      version: CONSENT_VERSION,
    });

    await expect(getVerifiedConsentGiven()).resolves.toBe(false);
  });

  it('rejects a record for different disclosure content', async () => {
    mockStorage[CONSENT_KEY] = JSON.stringify({
      consented: true,
      consentedAt: Date.now(),
      version: CONSENT_VERSION,
      contentHash: 'b'.repeat(64),
      locale: 'en-US',
      verificationMethod: CONSENT_VERIFICATION_METHOD,
    });

    await expect(getVerifiedConsentGiven()).resolves.toBe(false);
  });
});
