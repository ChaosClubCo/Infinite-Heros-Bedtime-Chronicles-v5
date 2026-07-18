import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deleteAllConversationsForUser: vi.fn(),
  deleteAuthenticatedUser: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../auth', () => ({
  deleteAuthenticatedUser: mocks.deleteAuthenticatedUser,
}));
vi.mock('../logger', () => ({
  logger: { info: mocks.info, error: mocks.error },
}));
vi.mock('../replit_integrations/chat/storage', () => ({
  chatStorage: {
    deleteAllConversationsForUser: mocks.deleteAllConversationsForUser,
  },
}));

import { registerAccountRoutes } from './account';

function createApp(user?: { uid: string; isAnonymous: boolean }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  registerAccountRoutes(app);
  return app;
}

describe('DELETE /api/account', () => {
  const originalDbUrl = process.env.DATABASE_URL;
  const originalReleaseSha = process.env.APP_RELEASE_SHA;
  const releaseSha = '0123456789abcdef0123456789abcdef01234567';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: a database IS configured, so the chat-history step runs.
    process.env.DATABASE_URL = 'postgres://test-db';
    process.env.APP_RELEASE_SHA = releaseSha;
    mocks.deleteAllConversationsForUser.mockResolvedValue(undefined);
    mocks.deleteAuthenticatedUser.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDbUrl;
    if (originalReleaseSha === undefined) delete process.env.APP_RELEASE_SHA;
    else process.env.APP_RELEASE_SHA = originalReleaseSha;
  });

  it('deletes retained data in order and returns a PII-free verification receipt', async () => {
    const calls: string[] = [];
    mocks.deleteAllConversationsForUser.mockImplementation(async () => { calls.push('chat'); });
    mocks.deleteAuthenticatedUser.mockImplementation(async () => { calls.push('identity'); });

    const response = await request(createApp({ uid: 'parent-123', isAnonymous: false }))
      .delete('/api/account')
      .expect(200);

    expect(calls).toEqual(['chat', 'identity']);
    expect(mocks.deleteAllConversationsForUser).toHaveBeenCalledWith('parent-123');
    expect(mocks.deleteAuthenticatedUser).toHaveBeenCalledWith('parent-123');
    expect(response.body).toMatchObject({
      version: 2,
      releaseSha,
      status: 'completed',
      deletedScopes: [
        'voice_chat_history',
        'cloud_sync_records',
        'parent_auth_identity',
      ],
      localDeviceData: 'pending_client_cleanup',
    });
    expect(response.body.receiptId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(response.body.completedAt))).toBe(false);
    expect(JSON.stringify(response.body)).not.toContain('parent-123');
  });

  it('honestly records a null release SHA when runtime metadata is unavailable', async () => {
    delete process.env.APP_RELEASE_SHA;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.GITHUB_SHA;

    const response = await request(createApp({ uid: 'parent-123', isAnonymous: false }))
      .delete('/api/account')
      .expect(200);

    expect(response.body.releaseSha).toBeNull();
  });

  it('does not delete the identity or issue a receipt when transcript deletion fails', async () => {
    mocks.deleteAllConversationsForUser.mockRejectedValue(new Error('database unavailable'));

    const response = await request(createApp({ uid: 'parent-123', isAnonymous: false }))
      .delete('/api/account')
      .expect(503);

    expect(mocks.deleteAuthenticatedUser).not.toHaveBeenCalled();
    expect(response.body.receiptId).toBeUndefined();
  });

  it('skips transcript deletion but still deletes the identity when no database is configured', async () => {
    // The documented default (story-only) deployment has no DATABASE_URL — the old
    // code tried to connect anyway, threw, 503'd, and never deleted the identity,
    // leaving cloud sync data undeletable. Now the step is skipped and deletion completes.
    delete process.env.DATABASE_URL;

    const response = await request(createApp({ uid: 'parent-123', isAnonymous: false }))
      .delete('/api/account')
      .expect(200);

    expect(mocks.deleteAllConversationsForUser).not.toHaveBeenCalled();
    expect(mocks.deleteAuthenticatedUser).toHaveBeenCalledWith('parent-123');
    expect(response.body.status).toBe('completed');
  });

  it('rejects anonymous sessions', async () => {
    await request(createApp({ uid: 'anonymous', isAnonymous: true }))
      .delete('/api/account')
      .expect(400);

    expect(mocks.deleteAllConversationsForUser).not.toHaveBeenCalled();
  });
});
