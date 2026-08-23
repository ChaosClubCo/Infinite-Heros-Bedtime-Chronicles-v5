import { describe, it, expect } from 'vitest';
import {
  ACCOUNT_DELETION_RECEIPT_VERSION,
  isServerDeletionReceipt,
  type ServerDeletionReceipt,
} from './account-deletion';

describe('shared/account-deletion', () => {
  const validReceiptWithVoice: ServerDeletionReceipt = {
    version: ACCOUNT_DELETION_RECEIPT_VERSION,
    receiptId: '12345678-1234-4234-8234-1234567890ab',
    completedAt: '2026-08-14T12:00:00.000Z',
    releaseSha: '0123456789abcdef0123456789abcdef01234567',
    status: 'completed',
    deletedScopes: [
      'voice_chat_history',
      'cloud_sync_records',
      'parent_auth_identity',
    ],
    localDeviceData: 'pending_client_cleanup',
  };

  const validReceiptWithoutVoice: ServerDeletionReceipt = {
    version: ACCOUNT_DELETION_RECEIPT_VERSION,
    receiptId: '87654321-4321-4321-8321-ba0987654321',
    completedAt: '2026-08-14T12:30:00.000Z',
    releaseSha: null,
    status: 'completed',
    deletedScopes: [
      'cloud_sync_records',
      'parent_auth_identity',
    ],
    localDeviceData: 'pending_client_cleanup',
  };

  it('accepts valid 3-scope receipts (with voice chat history)', () => {
    expect(isServerDeletionReceipt(validReceiptWithVoice)).toBe(true);
  });

  it('accepts valid 2-scope receipts (when voice chat database was unconfigured)', () => {
    expect(isServerDeletionReceipt(validReceiptWithoutVoice)).toBe(true);
  });

  it('rejects non-object or null values', () => {
    expect(isServerDeletionReceipt(null)).toBe(false);
    expect(isServerDeletionReceipt(undefined)).toBe(false);
    expect(isServerDeletionReceipt('string')).toBe(false);
    expect(isServerDeletionReceipt(123)).toBe(false);
  });

  it('rejects mismatching receipt version', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        version: 1,
      }),
    ).toBe(false);
  });

  it('rejects incomplete receipt status', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        status: 'pending',
      }),
    ).toBe(false);
  });

  it('rejects short receipt IDs', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        receiptId: 'short-id',
      }),
    ).toBe(false);
  });

  it('rejects invalid timestamps', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        completedAt: 'not-a-date',
      }),
    ).toBe(false);
  });

  it('rejects invalid release SHA formats', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        releaseSha: 'too-short-sha',
      }),
    ).toBe(false);
  });

  it('rejects missing required core scopes (missing parent_auth_identity)', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        deletedScopes: ['voice_chat_history', 'cloud_sync_records'],
      }),
    ).toBe(false);
  });

  it('rejects missing required core scopes (missing cloud_sync_records)', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        deletedScopes: ['voice_chat_history', 'parent_auth_identity'],
      }),
    ).toBe(false);
  });

  it('rejects unrecognized deletion scopes', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        deletedScopes: [
          'cloud_sync_records',
          'parent_auth_identity',
          'unrecognized_scope' as any,
        ],
      }),
    ).toBe(false);
  });

  it('rejects invalid localDeviceData state', () => {
    expect(
      isServerDeletionReceipt({
        ...validReceiptWithVoice,
        localDeviceData: 'cleaned_up' as any,
      }),
    ).toBe(false);
  });
});
