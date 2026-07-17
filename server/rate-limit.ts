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

  // The in-memory map is the AUTHORITATIVE counter within a window; KV is used
  // only to seed/restore a window across restarts. This ordering fixes two ways
  // the old KV-first path silently disabled the limiter:
  //   1. Every mid-window write used a sub-60s TTL, which Cloudflare KV rejects
  //      (60s minimum), so the KV count never advanced past 1.
  //   2. A KV read error/outage returned null and reset the window to count 1.
  // Preferring a live local window makes both harmless; KV is best-effort.
  const local = rateLimitMap.get(key);
  let entry: RateLimitEntry | undefined = local && now <= local.resetAt ? local : undefined;

  if (!entry) {
    // No live local window — try to restore from KV (a miss or fetch error just
    // means "no seed"; we start a fresh window in memory either way).
    const seed = await kvGet<RateLimitEntry>(key);
    entry = seed && now <= seed.resetAt ? seed : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  entry.count++;
  rateLimitMap.set(key, entry);

  // Persist for cross-restart durability, clamped to Cloudflare KV's 60s minimum
  // expiration_ttl. The over-long TTL on a short remaining window is harmless —
  // the resetAt check above discards a stale seed on restore.
  kvSet(key, entry, Math.max(60, Math.ceil((entry.resetAt - now) / 1000)));
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
