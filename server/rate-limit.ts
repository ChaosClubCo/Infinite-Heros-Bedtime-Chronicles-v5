const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60 * 1000), 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);

// Cloudflare KV config — when all three are set, rate-limit state survives server restarts.
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const KV_ENABLED = !!(CF_ACCOUNT_ID && CF_NAMESPACE_ID && CF_API_TOKEN);

type RateLimitEntry = { count: number; resetAt: number };

async function kvGet(key: string): Promise<RateLimitEntry | null> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } });
    if (!res.ok) return null;
    return await res.json() as RateLimitEntry;
  } catch {
    return null;
  }
}

function kvSet(key: string, entry: RateLimitEntry): void {
  const ttlSeconds = Math.ceil((entry.resetAt - Date.now()) / 1000);
  if (ttlSeconds <= 0) return;
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${encodeURIComponent(key)}?expiration_ttl=${ttlSeconds}`;
  // fire-and-forget — never block the request path on KV writes
  fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {});
}

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
  let entry = await kvGet(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(key, entry);
    kvSet(key, entry);
    return true;
  }

  entry.count++;
  rateLimitMap.set(key, entry);
  kvSet(key, entry);
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
