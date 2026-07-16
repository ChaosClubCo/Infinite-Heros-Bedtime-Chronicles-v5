import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteAllConversationsForUser.mockResolvedValue(undefined);
    mocks.deleteAuthenticatedUser.mockResolvedValue(undefined);
  });

  it('deletes retained transcripts before deleting the Supabase identity', async () => {
    const calls: string[] = [];
    mocks.deleteAllConversationsForUser.mockImplementation(async () => { calls.push('chat'); });
    mocks.deleteAuthenticatedUser.mockImplementation(async () => { calls.push('identity'); });

    await request(createApp({ uid: 'parent-123', isAnonymous: false }))
      .delete('/api/account')
      .expect(204);

    expect(calls).toEqual(['chat', 'identity']);
    expect(mocks.deleteAllConversationsForUser).toHaveBeenCalledWith('parent-123');
    expect(mocks.deleteAuthenticatedUser).toHaveBeenCalledWith('parent-123');
  });

  it('does not delete the identity when transcript deletion fails', async () => {
    mocks.deleteAllConversationsForUser.mockRejectedValue(new Error('database unavailable'));

    await request(createApp({ uid: 'parent-123', isAnonymous: false }))
      .delete('/api/account')
      .expect(503);

    expect(mocks.deleteAuthenticatedUser).not.toHaveBeenCalled();
  });

  it('rejects anonymous sessions', async () => {
    await request(createApp({ uid: 'anonymous', isAnonymous: true }))
      .delete('/api/account')
      .expect(400);

    expect(mocks.deleteAllConversationsForUser).not.toHaveBeenCalled();
  });
});
