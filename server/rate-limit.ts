const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60 * 1000), 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);

/**
 * Sliding-window per-key rate limiter.
 * When auth is enabled, callers should pass `req.user.uid` so authenticated
 * users on shared IPs don't exhaust each other's quota.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

/** Periodic cleanup — call via setInterval in the server bootstrap. */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

/** For testing only. */
export function resetRateLimits(): void {
  rateLimitMap.clear();
}
