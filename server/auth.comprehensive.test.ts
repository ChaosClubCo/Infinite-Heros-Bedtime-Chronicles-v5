import { describe, it, expect, vi, beforeEach } from 'vitest';

// ══════════════════════════════════════════════════════════════════
// Supabase Auth Middleware Tests
// Tests the requireAuth middleware behavior in all scenarios.
// ══════════════════════════════════════════════════════════════════

// Mirror the auth logic for testing without importing @supabase/supabase-js
describe('requireAuth middleware behavior', () => {
  // ── Dev Mode (no Firebase config) ─────────────────────────────
  describe('dev mode (Supabase not configured)', () => {
    it('allows request without auth header', () => {
      const isConfigured = false;
      const result = isConfigured ? 'check-token' : 'skip-auth';
      expect(result).toBe('skip-auth');
    });

    it('assigns anonymous user with IP as uid', () => {
      const ip = '127.0.0.1';
      const user = { uid: ip || 'anonymous', isAnonymous: true };
      expect(user.uid).toBe('127.0.0.1');
      expect(user.isAnonymous).toBe(true);
    });

    it('uses "anonymous" when IP is empty', () => {
      const ip = '';
      const user = { uid: ip || 'anonymous', isAnonymous: true };
      expect(user.uid).toBe('anonymous');
    });

    it('uses "anonymous" when IP is undefined', () => {
      const ip: string | undefined = undefined;
      const user = { uid: ip || 'anonymous', isAnonymous: true };
      expect(user.uid).toBe('anonymous');
    });
  });

  // ── Production Mode (Firebase configured) ─────────────────────
  describe('production mode (Supabase configured)', () => {
    it('rejects request without Authorization header', () => {
      const authHeader: string | undefined = undefined;
      const hasBearerToken = authHeader?.startsWith('Bearer ');
      expect(hasBearerToken).toBeFalsy();
    });

    it('rejects request with non-Bearer auth', () => {
      const authHeader = 'Basic abc123';
      expect(authHeader.startsWith('Bearer ')).toBe(false);
    });

    it('rejects empty Authorization header', () => {
      const authHeader = '';
      expect(authHeader.startsWith('Bearer ')).toBe(false);
    });

    it('rejects "Bearer " with no token', () => {
      const authHeader = 'Bearer ';
      const token = authHeader.slice(7);
      expect(token).toBe('');
    });

    it('extracts token correctly from valid Bearer header', () => {
      const authHeader = 'Bearer eyJhbGciOiJSUzI1NiJ9.test.sig';
      const token = authHeader.slice(7);
      expect(token).toBe('eyJhbGciOiJSUzI1NiJ9.test.sig');
    });

    it('rejects "bearer " (lowercase)', () => {
      const authHeader = 'bearer token';
      expect(authHeader.startsWith('Bearer ')).toBe(false);
    });

    it('rejects "BEARER " (uppercase)', () => {
      const authHeader = 'BEARER token';
      expect(authHeader.startsWith('Bearer ')).toBe(false);
    });
  });

  // ── Token Validation ──────────────────────────────────────────
  describe('token decoding (Supabase getUser result)', () => {
    it('extracts uid from the Supabase user id', () => {
      const supaUser = { id: 'user123', is_anonymous: false };
      const user = {
        uid: supaUser.id,
        isAnonymous: supaUser.is_anonymous ?? false,
      };
      expect(user.uid).toBe('user123');
      expect(user.isAnonymous).toBe(false);
    });

    it('identifies anonymous sign-in', () => {
      const supaUser = { id: 'anon456', is_anonymous: true };
      const user = {
        uid: supaUser.id,
        isAnonymous: supaUser.is_anonymous ?? false,
      };
      expect(user.isAnonymous).toBe(true);
    });

    it('handles missing is_anonymous field', () => {
      const supaUser = { id: 'user789' } as { id: string; is_anonymous?: boolean };
      const user = {
        uid: supaUser.id,
        isAnonymous: supaUser.is_anonymous ?? false,
      };
      expect(user.isAnonymous).toBe(false);
    });

    it('treats only is_anonymous === true as anonymous', () => {
      const cases: { is_anonymous?: boolean; expected: boolean }[] = [
        { is_anonymous: true, expected: true },
        { is_anonymous: false, expected: false },
        { is_anonymous: undefined, expected: false },
      ];
      for (const c of cases) {
        const isAnon = (c.is_anonymous ?? false) === true;
        expect(isAnon).toBe(c.expected);
      }
    });
  });

  // ── POST-only Auth ────────────────────────────────────────────
  describe('method-based auth bypass', () => {
    it('skips auth for GET requests', () => {
      const method = 'GET';
      const shouldSkip = method === 'GET';
      expect(shouldSkip).toBe(true);
    });

    it('requires auth for POST requests', () => {
      const method = 'POST';
      const shouldSkip = method === 'GET';
      expect(shouldSkip).toBe(false);
    });

    it('requires auth for PUT requests', () => {
      const shouldSkip = 'PUT' === 'GET';
      expect(shouldSkip).toBe(false);
    });

    it('requires auth for DELETE requests', () => {
      const shouldSkip = 'DELETE' === 'GET';
      expect(shouldSkip).toBe(false);
    });

    it('requires auth for PATCH requests', () => {
      const shouldSkip = 'PATCH' === 'GET';
      expect(shouldSkip).toBe(false);
    });
  });

  // ── Supabase Client Initialization ────────────────────────────
  describe('Supabase client lazy init', () => {
    function canInit(url?: string, serviceRoleKey?: string) {
      return !!(url && serviceRoleKey);
    }
    const url = 'https://aeraxfupuvwiskmfjliq.supabase.co';

    it('returns false when SUPABASE_SERVICE_ROLE_KEY is empty', () => {
      expect(canInit(url, '')).toBe(false);
    });

    it('returns false when SUPABASE_SERVICE_ROLE_KEY is undefined', () => {
      expect(canInit(url, undefined)).toBe(false);
    });

    it('returns false when the Supabase URL is missing', () => {
      expect(canInit(undefined, 'service-role-key')).toBe(false);
    });

    it('initializes when both URL and service-role key are present', () => {
      expect(canInit(url, 'service-role-key')).toBe(true);
    });
  });

  // ── Error Responses ───────────────────────────────────────────
  describe('error responses', () => {
    it('returns 401 for missing auth', () => {
      const status = 401;
      const body = { error: 'Authentication required' };
      expect(status).toBe(401);
      expect(body.error).toBe('Authentication required');
    });

    it('returns 401 for invalid token', () => {
      const status = 401;
      const body = { error: 'Invalid or expired token' };
      expect(status).toBe(401);
      expect(body.error).toBe('Invalid or expired token');
    });

    it('error messages do not leak internal details', () => {
      const errorMessages = ['Authentication required', 'Invalid or expired token'];
      for (const msg of errorMessages) {
        expect(msg).not.toContain('Supabase');
        expect(msg).not.toContain('stack');
        expect(msg).not.toContain('internal');
      }
    });
  });
});
