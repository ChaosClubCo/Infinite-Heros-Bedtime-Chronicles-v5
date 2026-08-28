import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONSENT_DISCLOSURES,
  CONSENT_VERIFICATION_METHOD,
  CONSENT_VERSION,
  getConsentGiven,
  getParentConsentRecord,
  recordParentConsent,
} from './consent-record';

let mockStorage: Record<string, string> = {};
const expectedHash = 'a'.repeat(64);

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
  digestStringAsync: vi.fn(() => Promise.resolve(expectedHash)),
}));

const key = '@infinity_heroes_parent_consent';

beforeEach(() => {
  mockStorage = {};
  vi.clearAllMocks();
});

describe('verifiable parental consent', () => {
  it('records version, exact-copy hash, timestamp, locale, and verification method', async () => {
    const record = await recordParentConsent();

    expect(record).toMatchObject({
      consented: true,
      version: CONSENT_VERSION,
      contentHash: expectedHash,
      verificationMethod: CONSENT_VERIFICATION_METHOD,
    });
    expect(record.consentedAt).toBeGreaterThan(0);
    expect(record.locale.length).toBeGreaterThan(0);
    expect(JSON.parse(mockStorage[key])).toEqual(record);
  });

  it('rejects a legacy version-only consent record', async () => {
    mockStorage[key] = JSON.stringify({
      consented: true,
      consentedAt: Date.now(),
      version: 2,
    });

    await expect(getConsentGiven()).resolves.toBe(false);
  });

  it('rejects a record when the disclosure hash does not match current copy', async () => {
    mockStorage[key] = JSON.stringify({
      consented: true,
      consentedAt: Date.now(),
      version: CONSENT_VERSION,
      contentHash: 'b'.repeat(64),
      locale: 'en-US',
      verificationMethod: CONSENT_VERIFICATION_METHOD,
    });

    await expect(getParentConsentRecord()).resolves.toBeNull();
    await expect(getConsentGiven()).resolves.toBe(false);
  });

  it('accepts only the complete current record', async () => {
    mockStorage[key] = JSON.stringify({
      consented: true,
      consentedAt: Date.now(),
      version: CONSENT_VERSION,
      contentHash: expectedHash,
      locale: 'en-US',
      verificationMethod: CONSENT_VERIFICATION_METHOD,
    });

    await expect(getConsentGiven()).resolves.toBe(true);
  });

  it('keeps release copy truthful about disabled voice and verifiable deletion', () => {
    expect(CONSENT_DISCLOSURES[2]).toContain('Voice Chat is unavailable for this release');
    expect(CONSENT_DISCLOSURES[4]).toContain('PII-free verification receipt');
  });
});
