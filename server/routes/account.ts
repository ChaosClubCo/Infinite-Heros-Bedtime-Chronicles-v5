import type { Express, Request, Response } from 'express';
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

      logger.info({ event: 'account_deleted' }, 'parent account and retained server data deleted');
      return res.status(204).send();
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
