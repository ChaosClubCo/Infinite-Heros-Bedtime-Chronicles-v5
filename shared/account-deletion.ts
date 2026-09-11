/**
 * PII-free confirmation returned after the server has completed account and
 * retained-data deletion. The device adds its own local-cleanup confirmation
 * after receiving this response.
 */
export const ACCOUNT_DELETION_RECEIPT_VERSION = 2 as const;

export type DeletionScope =
  | 'voice_chat_history'
  | 'cloud_sync_records'
  | 'parent_auth_identity';

export interface ServerDeletionReceipt {
  version: typeof ACCOUNT_DELETION_RECEIPT_VERSION;
  receiptId: string;
  completedAt: string;
  /** Exact 40-character deployed source revision, or null when unavailable. */
  releaseSha: string | null;
  status: 'completed';
  deletedScopes: DeletionScope[];
  localDeviceData: 'pending_client_cleanup';
}

const VALID_DELETION_SCOPES: readonly DeletionScope[] = [
  'voice_chat_history',
  'cloud_sync_records',
  'parent_auth_identity',
] as const;

export function isServerDeletionReceipt(value: unknown): value is ServerDeletionReceipt {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ServerDeletionReceipt>;
  const releaseShaValid = candidate.releaseSha === null
    || (typeof candidate.releaseSha === 'string' && /^[0-9a-f]{40}$/i.test(candidate.releaseSha));

  return candidate.version === ACCOUNT_DELETION_RECEIPT_VERSION
    && candidate.status === 'completed'
    && typeof candidate.receiptId === 'string'
    && candidate.receiptId.length >= 16
    && typeof candidate.completedAt === 'string'
    && !Number.isNaN(Date.parse(candidate.completedAt))
    && releaseShaValid
    && Array.isArray(candidate.deletedScopes)
    && candidate.deletedScopes.length >= 2
    && candidate.deletedScopes.every((scope) => typeof scope === 'string' && VALID_DELETION_SCOPES.includes(scope as DeletionScope))
    && candidate.deletedScopes.includes('cloud_sync_records')
    && candidate.deletedScopes.includes('parent_auth_identity')
    && candidate.localDeviceData === 'pending_client_cleanup';
}
