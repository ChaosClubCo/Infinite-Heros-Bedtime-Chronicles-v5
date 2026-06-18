import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Firebase Admin auth middleware.
 * Validates the Bearer token from the Authorization header.
 * Attaches decoded user info to req.user.
 */

// Lazy-init firebase-admin to avoid import errors when not configured
let adminAuth: import('firebase-admin/auth').Auth | null = null;

async function getAdminAuth() {
  if (adminAuth) return adminAuth;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    return null;
  }

  try {
    const { getApps, initializeApp, cert } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    const serviceAccount = JSON.parse(serviceAccountJson);

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    adminAuth = getAuth();
    return adminAuth;
  } catch (err) {
    console.error('[Auth] Failed to initialize Firebase Admin:', err instanceof Error ? err.message : String(err));
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

/** Check at startup whether Firebase auth is configured. */
export function isAuthEnabled(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
}

/**
 * Middleware that requires a valid Firebase auth token.
 * If FIREBASE_SERVICE_ACCOUNT_KEY is not set, auth is disabled (dev mode).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = await getAdminAuth();

  // SECURITY: Block unauthenticated access in production — no opt-out
  if (!auth) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Auth] CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY is not set in production. Rejecting request.');
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
    // Development mode: allow with warning on first request
    if (!requireAuth._devWarned) {
      console.warn('[Auth] WARNING: Running without authentication (development mode). Set FIREBASE_SERVICE_ACCOUNT_KEY for production.');
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
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
    };
    next();
  } catch {
    logger.warn({ event: 'auth_failure', reason: 'invalid_token', path: req.path, method: req.method }, 'authentication failure');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
requireAuth._devWarned = false;
