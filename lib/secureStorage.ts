import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export const SECURE_STORAGE_PREFIX = '@infinity_heroes_sec_';
export const SECURE_ENVELOPE_VERSION = 1;

export interface SecureStorageEnvelope {
  v: number;
  salt: string;
  payload: string;
  signature: string;
}

/**
 * Derives a SHA-256 HMAC-like signature over a payload and salt.
 */
async function computeSignature(payload: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${payload}`,
  );
}

/**
 * Generates a cryptographic random hex salt.
 */
function generateSalt(length = 16): string {
  const bytes = Crypto.getRandomBytes(length);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Simple reversible XOR mask with a repeating salt string, encoded in Base64
 * for safe string storage across platforms.
 */
function maskPayload(plaintext: string, salt: string): string {
  const textBytes = new TextEncoder().encode(plaintext);
  const saltBytes = new TextEncoder().encode(salt);
  const masked = new Uint8Array(textBytes.length);

  for (let i = 0; i < textBytes.length; i++) {
    masked[i] = textBytes[i] ^ saltBytes[i % saltBytes.length];
  }

  let binary = '';
  for (let i = 0; i < masked.byteLength; i++) {
    binary += String.fromCharCode(masked[i]);
  }
  return btoa(binary);
}

/**
 * Unmasks a Base64 masked payload with the salt string.
 */
function unmaskPayload(maskedBase64: string, salt: string): string {
  const binary = atob(maskedBase64);
  const masked = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    masked[i] = binary.charCodeAt(i);
  }

  const saltBytes = new TextEncoder().encode(salt);
  const unmasked = new Uint8Array(masked.length);
  for (let i = 0; i < masked.length; i++) {
    unmasked[i] = masked[i] ^ saltBytes[i % saltBytes.length];
  }

  return new TextDecoder().decode(unmasked);
}

/**
 * Stores a value securely with a tamper-evident cryptographic envelope.
 */
export async function setSecureItem<T = unknown>(key: string, value: T): Promise<void> {
  const fullKey = key.startsWith(SECURE_STORAGE_PREFIX) ? key : `${SECURE_STORAGE_PREFIX}${key}`;
  const serialized = JSON.stringify(value);
  const salt = generateSalt(16);
  const maskedPayload = maskPayload(serialized, salt);
  const signature = await computeSignature(maskedPayload, salt);

  const envelope: SecureStorageEnvelope = {
    v: SECURE_ENVELOPE_VERSION,
    salt,
    payload: maskedPayload,
    signature,
  };

  await AsyncStorage.setItem(fullKey, JSON.stringify(envelope));
}

/**
 * Retrieves and validates a securely stored item.
 * Returns null if the item doesn't exist, is corrupted, or fails signature verification.
 */
export async function getSecureItem<T = unknown>(key: string): Promise<T | null> {
  const fullKey = key.startsWith(SECURE_STORAGE_PREFIX) ? key : `${SECURE_STORAGE_PREFIX}${key}`;
  try {
    const raw = await AsyncStorage.getItem(fullKey);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as Partial<SecureStorageEnvelope>;
    if (
      !envelope ||
      envelope.v !== SECURE_ENVELOPE_VERSION ||
      typeof envelope.salt !== 'string' ||
      typeof envelope.payload !== 'string' ||
      typeof envelope.signature !== 'string'
    ) {
      return null;
    }

    // Verify integrity signature
    const expectedSig = await computeSignature(envelope.payload, envelope.salt);
    if (expectedSig !== envelope.signature) {
      // Data was tampered with or corrupted
      return null;
    }

    const decryptedJson = unmaskPayload(envelope.payload, envelope.salt);
    return JSON.parse(decryptedJson) as T;
  } catch {
    return null;
  }
}

/**
 * Removes a secure item.
 */
export async function removeSecureItem(key: string): Promise<void> {
  const fullKey = key.startsWith(SECURE_STORAGE_PREFIX) ? key : `${SECURE_STORAGE_PREFIX}${key}`;
  await AsyncStorage.removeItem(fullKey);
}

/**
 * Removes all secure items created by this module.
 */
export async function clearAllSecureItems(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const secureKeys = allKeys.filter((k) => k.startsWith(SECURE_STORAGE_PREFIX));
  if (secureKeys.length > 0) {
    await AsyncStorage.multiRemove(secureKeys);
  }
}
