import { describe, expect, it, vi } from 'vitest';
import { getOrCreateAccessToken } from './auth-session';

describe('getOrCreateAccessToken', () => {
  it('reuses an existing session token without creating another user', async () => {
    const signInAnonymously = vi.fn();
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'existing-token' } } }),
        signInAnonymously,
      },
    };

    await expect(getOrCreateAccessToken(client)).resolves.toBe('existing-token');
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('creates an anonymous Supabase session when no session exists', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        signInAnonymously: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'anonymous-token' } },
          error: null,
        }),
      },
    };

    await expect(getOrCreateAccessToken(client)).resolves.toBe('anonymous-token');
    expect(client.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('returns null instead of fabricating a token when anonymous auth fails', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        signInAnonymously: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'anonymous sign-ins disabled' },
        }),
      },
    };

    await expect(getOrCreateAccessToken(client)).resolves.toBeNull();
  });
});
