import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const mockGetUser = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        getUser: mockGetUser,
        admin: {
          deleteUser: mockDeleteUser,
        },
      },
    })),
  };
});

describe('server/auth.ts — real Supabase Auth middleware & utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function mockRequestResponse(headers: Record<string, string> = {}, ip: string = '127.0.0.1') {
    const req = {
      headers,
      ip,
      path: '/test-path',
      method: 'POST',
      user: undefined,
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  }

  // ══════════════════════════════════════════════════════════════════
  // 1. isAuthEnabled()
  // ══════════════════════════════════════════════════════════════════
  describe('isAuthEnabled()', () => {
    it('returns false when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const { isAuthEnabled } = await import('./auth');
      expect(isAuthEnabled()).toBe(false);
    });

    it('returns false when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-123';
      const { isAuthEnabled } = await import('./auth');
      expect(isAuthEnabled()).toBe(false);
    });

    it('returns true when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present', async () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-123';
      const { isAuthEnabled } = await import('./auth');
      expect(isAuthEnabled()).toBe(true);
    });

    it('returns true when EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present', async () => {
      delete process.env.SUPABASE_URL;
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://public.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-123';
      const { isAuthEnabled } = await import('./auth');
      expect(isAuthEnabled()).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 2. deleteAuthenticatedUser()
  // ══════════════════════════════════════════════════════════════════
  describe('deleteAuthenticatedUser()', () => {
    it('throws error when Supabase admin is not configured', async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const { deleteAuthenticatedUser } = await import('./auth');

      await expect(deleteAuthenticatedUser('user_123')).rejects.toThrow(
        'Supabase admin is not configured'
      );
    });

    it('successfully calls supabase.auth.admin.deleteUser', async () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      mockDeleteUser.mockResolvedValueOnce({ error: null });
      const { deleteAuthenticatedUser } = await import('./auth');

      await deleteAuthenticatedUser('user_123');
      expect(mockDeleteUser).toHaveBeenCalledWith('user_123');
    });

    it('throws when deleteUser returns an error', async () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      mockDeleteUser.mockResolvedValueOnce({
        error: { message: 'User not found' },
      });
      const { deleteAuthenticatedUser } = await import('./auth');

      await expect(deleteAuthenticatedUser('user_999')).rejects.toThrow(
        'Supabase account deletion failed: User not found'
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // 3. requireAuth() Middleware
  // ══════════════════════════════════════════════════════════════════
  describe('requireAuth()', () => {
    describe('unconfigured / dev vs production mode', () => {
      beforeEach(() => {
        delete process.env.SUPABASE_URL;
        delete process.env.EXPO_PUBLIC_SUPABASE_URL;
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      });

      it('in development mode: allows request, sets anonymous req.user, and calls next()', async () => {
        process.env.NODE_ENV = 'development';
        const { requireAuth } = await import('./auth');
        const { req, res, next } = mockRequestResponse({}, '192.168.1.50');

        await requireAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({ uid: '192.168.1.50', isAnonymous: true });
        expect(res.status).not.toHaveBeenCalled();
      });

      it('in development mode: uses "anonymous" when req.ip is empty', async () => {
        process.env.NODE_ENV = 'development';
        const { requireAuth } = await import('./auth');
        const { req, res, next } = mockRequestResponse({}, '');

        await requireAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({ uid: 'anonymous', isAnonymous: true });
      });

      it('in production mode: rejects unconfigured auth with HTTP 503 fail-closed', async () => {
        process.env.NODE_ENV = 'production';
        const { requireAuth } = await import('./auth');
        const { req, res, next } = mockRequestResponse();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({ error: 'Service temporarily unavailable' });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('configured Supabase client - header validation', () => {
      beforeEach(() => {
        process.env.SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      });

      it('rejects missing Authorization header with HTTP 401', async () => {
        const { requireAuth } = await import('./auth');
        const { req, res, next } = mockRequestResponse();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
      });

      it('rejects non-Bearer header (e.g. Basic auth) with HTTP 401', async () => {
        const { requireAuth } = await import('./auth');
        const { req, res, next } = mockRequestResponse({ authorization: 'Basic abc123xyz' });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      });

      it('rejects lowercase bearer token header with HTTP 401', async () => {
        const { requireAuth } = await import('./auth');
        const { req, res, next } = mockRequestResponse({ authorization: 'bearer token123' });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      });

      it('rejects token exceeding 4096 characters (DoS guard) with HTTP 401', async () => {
        const { requireAuth } = await import('./auth');
        const longToken = 'a'.repeat(4097);
        const { req, res, next } = mockRequestResponse({ authorization: `Bearer ${longToken}` });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('configured Supabase client - token verification & error classification', () => {
      beforeEach(() => {
        process.env.SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
      });

      it('valid token: populates req.user and calls next()', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockResolvedValueOnce({
          data: { user: { id: 'usr_valid_123', is_anonymous: false } },
          error: null,
        });
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer valid_jwt_token' });

        await requireAuth(req, res, next);

        expect(mockGetUser).toHaveBeenCalledWith('valid_jwt_token');
        expect(req.user).toEqual({ uid: 'usr_valid_123', isAnonymous: false });
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('valid anonymous token: sets isAnonymous to true', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockResolvedValueOnce({
          data: { user: { id: 'usr_anon_456', is_anonymous: true } },
          error: null,
        });
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer anon_jwt_token' });

        await requireAuth(req, res, next);

        expect(req.user).toEqual({ uid: 'usr_anon_456', isAnonymous: true });
        expect(next).toHaveBeenCalled();
      });

      it('defaults isAnonymous to false if is_anonymous field is missing', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockResolvedValueOnce({
          data: { user: { id: 'usr_789' } },
          error: null,
        });
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer jwt_token' });

        await requireAuth(req, res, next);

        expect(req.user).toEqual({ uid: 'usr_789', isAnonymous: false });
        expect(next).toHaveBeenCalled();
      });

      it('status 401 error from Supabase: returns 401 "Invalid or expired token"', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockResolvedValueOnce({
          data: null,
          error: { status: 401, message: 'JWT expired' },
        });
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer expired_token' });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(next).not.toHaveBeenCalled();
      });

      it('status 403 error from Supabase: returns 401 "Invalid or expired token"', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockResolvedValueOnce({
          data: null,
          error: { status: 403, message: 'Forbidden' },
        });
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer forbidden_token' });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(next).not.toHaveBeenCalled();
      });

      it('upstream status 429 (rate limit) error: returns retryable HTTP 503', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockResolvedValueOnce({
          data: null,
          error: { status: 429, message: 'Too many requests' },
        });
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer valid_token' });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({ error: 'Service temporarily unavailable' });
        expect(next).not.toHaveBeenCalled();
      });

      it('upstream status 500 server error: returns retryable HTTP 503', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockResolvedValueOnce({
          data: null,
          error: { status: 500, message: 'Internal server error' },
        });
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer valid_token' });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({ error: 'Service temporarily unavailable' });
        expect(next).not.toHaveBeenCalled();
      });

      it('missing user in data object (no error): returns HTTP 401', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockResolvedValueOnce({
          data: { user: null },
          error: null,
        });
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer valid_token' });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(next).not.toHaveBeenCalled();
      });

      it('thrown exception during getUser (network error): returns retryable HTTP 503', async () => {
        const { requireAuth } = await import('./auth');
        mockGetUser.mockRejectedValueOnce(new Error('Network connection timeout'));
        const { req, res, next } = mockRequestResponse({ authorization: 'Bearer valid_token' });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({ error: 'Service temporarily unavailable' });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});
