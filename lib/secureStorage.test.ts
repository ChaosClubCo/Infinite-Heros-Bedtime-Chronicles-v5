import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  clearAllSecureItems,
  SECURE_STORAGE_PREFIX,
  SECURE_ENVELOPE_VERSION,
} from './secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

let mockStorage: Record<string, string> = {};

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    getAllKeys: vi.fn(() => Promise.resolve(Object.keys(mockStorage))),
    multiRemove: vi.fn((keys: string[]) => {
      keys.forEach((key) => delete mockStorage[key]);
      return Promise.resolve();
    }),
  },
}));

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: vi.fn((_algo: string, str: string) => {
    const hash = createHash('sha256').update(str).digest('hex');
    return Promise.resolve(hash);
  }),
  getRandomBytes: vi.fn((length: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = (i * 17 + 3) % 256;
    }
    return bytes;
  }),
}));

describe('secureStorage', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('stores and retrieves a string value in secure envelope', async () => {
    await setSecureItem('parent_secret', 'my-super-secret-pin-4821');

    // Confirm AsyncStorage has the prefixed key
    const raw = mockStorage[`${SECURE_STORAGE_PREFIX}parent_secret`];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw);
    expect(parsed.v).toBe(SECURE_ENVELOPE_VERSION);
    expect(typeof parsed.salt).toBe('string');
    expect(typeof parsed.payload).toBe('string');
    expect(typeof parsed.signature).toBe('string');
    // Ensure raw secret is not plaintext
    expect(parsed.payload).not.toContain('my-super-secret-pin-4821');

    // Retrieve and verify roundtrip
    const retrieved = await getSecureItem<string>('parent_secret');
    expect(retrieved).toBe('my-super-secret-pin-4821');
  });

  it('stores and retrieves structured objects', async () => {
    const obj = { pin: '1234', timestamp: 1710000000, enabled: true };
    await setSecureItem('parent_settings', obj);

    const retrieved = await getSecureItem<typeof obj>('parent_settings');
    expect(retrieved).toEqual(obj);
  });

  it('returns null for non-existent keys', async () => {
    const res = await getSecureItem('non_existent');
    expect(res).toBeNull();
  });

  it('detects and rejects tampered payloads (signature mismatch)', async () => {
    await setSecureItem('tamper_test', { sensitive: 'data' });

    const key = `${SECURE_STORAGE_PREFIX}tamper_test`;
    const envelope = JSON.parse(mockStorage[key]);
    // Tamper with the payload string
    envelope.payload = envelope.payload + 'tampered';
    mockStorage[key] = JSON.stringify(envelope);

    const result = await getSecureItem('tamper_test');
    expect(result).toBeNull();
  });

  it('rejects invalid or corrupted JSON envelopes', async () => {
    const key = `${SECURE_STORAGE_PREFIX}corrupt_test`;
    mockStorage[key] = 'not-json{{{';

    const result = await getSecureItem('corrupt_test');
    expect(result).toBeNull();
  });

  it('rejects envelopes with unsupported versions', async () => {
    const key = `${SECURE_STORAGE_PREFIX}version_test`;
    mockStorage[key] = JSON.stringify({
      v: 999,
      salt: 'abc',
      payload: 'xyz',
      signature: '123',
    });

    const result = await getSecureItem('version_test');
    expect(result).toBeNull();
  });

  it('removes a secure item', async () => {
    await setSecureItem('temp_item', 'value');
    expect(await getSecureItem('temp_item')).toBe('value');

    await removeSecureItem('temp_item');
    expect(await getSecureItem('temp_item')).toBeNull();
  });

  it('clears all secure items without touching regular items', async () => {
    mockStorage['@infinity_heroes_preferences'] = JSON.stringify({ voice: 'Kore' });
    mockStorage['@infinity_heroes_stories'] = JSON.stringify([]);
    await setSecureItem('key1', 'val1');
    await setSecureItem('key2', 'val2');

    expect(Object.keys(mockStorage).length).toBe(4);

    await clearAllSecureItems();

    expect(mockStorage[`${SECURE_STORAGE_PREFIX}key1`]).toBeUndefined();
    expect(mockStorage[`${SECURE_STORAGE_PREFIX}key2`]).toBeUndefined();
    expect(mockStorage['@infinity_heroes_preferences']).toBeDefined();
    expect(mockStorage['@infinity_heroes_stories']).toBeDefined();
  });
});
