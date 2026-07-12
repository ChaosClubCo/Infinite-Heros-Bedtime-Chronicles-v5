import { KV_ENABLED, kvGet, kvSet } from "./kv";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60 * 1000), 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);

type RateLimitEntry = { count: number; resetAt: number };

/**
 * Sliding-window per-key rate limiter (synchronous, in-memory).
 * When auth is enabled, callers should pass `req.user.uid` so authenticated
 * users on shared IPs don't exhaust each other's quota.
 * Used directly by tests — do not make async.
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

/**
 * Async rate-limit check. Uses Cloudflare KV when CLOUDFLARE_ACCOUNT_ID,
 * CLOUDFLARE_KV_NAMESPACE_ID, and CLOUDFLARE_API_TOKEN are set so limits
 * persist across server restarts. Falls back to the in-memory map otherwise.
 */
export async function checkRateLimitAsync(key: string): Promise<boolean> {
  if (!KV_ENABLED) return checkRateLimit(key);

  const now = Date.now();

  // Try KV first; fall back to in-memory on fetch errors.
  let entry = await kvGet<RateLimitEntry>(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(key, entry);
    kvSet(key, entry, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
    return true;
  }

  entry.count++;
  rateLimitMap.set(key, entry);
  kvSet(key, entry, Math.ceil((entry.resetAt - now) / 1000));
  return entry.count <= RATE_LIMIT_MAX;
}

/** Periodic cleanup — called via setInterval in routes/context.ts. */
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
