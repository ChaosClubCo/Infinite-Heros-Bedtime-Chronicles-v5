import type { Request, Response, NextFunction } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

/**
 * Supabase Auth middleware.
 * Validates the Bearer access token (Supabase JWT) from the Authorization header
 * and attaches the decoded user to req.user.
 */

// Lazy-init a server-side Supabase client (service-role) for token verification.
// SECURITY: SUPABASE_SERVICE_ROLE_KEY is server-only and must NEVER be exposed to
// the client (never read it into an EXPO_PUBLIC_* var or ship it in the bundle).
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseUrl(): string | undefined {
  // The URL is not a secret; accept a server-only override or the public var.
  return process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;

  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }

  try {
    supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return supabaseAdmin;
  } catch (err) {
    logger.error({ err }, 'failed to initialize supabase admin client');
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        isAnonymous: boolean;
      };
    }
  }
}

/** Check at startup whether Supabase auth is configured. */
export function isAuthEnabled(): boolean {
  return !!(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Middleware that requires a valid Supabase access token.
 * If Supabase is not configured, auth is disabled (dev mode) and requests are
 * treated as anonymous; in production a missing config returns 503 (no opt-out).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const supabase = getSupabaseAdmin();

  // SECURITY: Block unauthenticated access in production — no opt-out
  if (!supabase) {
    if (process.env.NODE_ENV === 'production') {
      logger.error({ path: req.path, method: req.method }, 'supabase auth missing in production; rejecting request');
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
    // Development mode: allow with warning on first request
    if (!requireAuth._devWarned) {
      logger.warn('running without authentication in development mode');
      requireAuth._devWarned = true;
    }
    req.user = { uid: req.ip || 'anonymous', isAnonymous: true };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn({ event: 'auth_failure', reason: 'missing_bearer', path: req.path, method: req.method }, 'authentication failure');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  // Reject implausibly long tokens before handing them to Supabase — a valid
  // access token is well under 4KB; anything larger is abuse/DoS.
  if (token.length > 4096) {
    logger.warn({ event: 'auth_failure', reason: 'token_too_long', path: req.path, method: req.method }, 'authentication failure');
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      // Only a 401/403 from the auth server means the token itself is invalid/expired.
      // Every other status — 429 (rate limit), 4xx misconfig, 5xx, or a missing status
      // (network/transport failure) — is an upstream/transient problem, so surface it as a
      // retryable 503 rather than logging the user out with a 401.
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) {
        logger.warn({ event: 'auth_failure', reason: 'invalid_token', path: req.path, method: req.method }, 'authentication failure');
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      logger.error({ event: 'auth_upstream_error', status, path: req.path, method: req.method }, 'auth verification upstream error');
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
    if (!data?.user) {
      logger.warn({ event: 'auth_failure', reason: 'invalid_token', path: req.path, method: req.method }, 'authentication failure');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = {
      uid: data.user.id,
      isAnonymous: data.user.is_anonymous ?? false,
    };
    next();
  } catch (err) {
    // Thrown errors from getUser are almost always network/transport failures — treat as
    // transient (retryable) rather than an auth rejection.
    logger.error({ event: 'auth_upstream_error', err: err instanceof Error ? err.message : String(err), path: req.path, method: req.method }, 'auth verification threw');
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
}
requireAuth._devWarned = false;
