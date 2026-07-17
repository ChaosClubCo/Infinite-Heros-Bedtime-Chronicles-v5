import { randomUUID } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import {
  ACCOUNT_DELETION_RECEIPT_VERSION,
  type ServerDeletionReceipt,
} from '@shared/account-deletion';
import { deleteAuthenticatedUser } from '../auth';
import { logger } from '../logger';

/**
 * Parent-initiated deletion endpoint.
 *
 * The global /api auth gate validates the Supabase access token before this
 * handler runs. We delete PostgreSQL chat history first, then the Supabase Auth
 * identity. Deleting auth.users cascades to sync_records. If the identity step
 * fails, the caller remains signed in and can retry; the already-purged chat
 * deletion is idempotent.
 *
 * The successful response is a PII-free receipt. It confirms server-side
 * deletion only; the client marks local cleanup complete after clearing device
 * storage. The receipt deliberately contains no user id, email, profile, story,
 * or transcript data.
 *
 * Chat storage is imported inside the request handler so deployments that do
 * not configure DATABASE_URL can still start normally with Voice Chat disabled.
 */
export function registerAccountRoutes(app: Express): void {
  app.delete('/api/account', async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || user.isAnonymous) {
      return res.status(400).json({ error: 'A signed-in parent account is required' });
    }

    try {
      const { chatStorage } = await import('../replit_integrations/chat/storage');
      await chatStorage.deleteAllConversationsForUser(user.uid);
      await deleteAuthenticatedUser(user.uid);

      const receipt: ServerDeletionReceipt = {
        version: ACCOUNT_DELETION_RECEIPT_VERSION,
        receiptId: randomUUID(),
        completedAt: new Date().toISOString(),
        status: 'completed',
        deletedScopes: [
          'voice_chat_history',
          'cloud_sync_records',
          'parent_auth_identity',
        ],
        localDeviceData: 'pending_client_cleanup',
      };

      logger.info(
        { event: 'account_deleted', receiptId: receipt.receiptId },
        'parent account and retained server data deleted',
      );
      return res.status(200).json(receipt);
    } catch (error) {
      logger.error({
        event: 'account_delete_failed',
        err: error instanceof Error ? error.message : String(error),
      }, 'account deletion failed');
      return res.status(503).json({
        error: 'Account deletion could not be completed. Your local data was not cleared; please retry.',
      });
    }
  });
}
