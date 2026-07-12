// Shared Cloudflare KV REST client. When all three env vars below are set,
// callers get durable, cross-invocation state (survives Vercel cold starts /
// server restarts); when any are absent, KV_ENABLED is false and callers
// should fall back to an in-memory-only store — see server/rate-limit.ts and
// server/idempotency.ts for the two current consumers of this module.

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

export const KV_ENABLED = !!(CF_ACCOUNT_ID && CF_NAMESPACE_ID && CF_API_TOKEN);

export async function kvGet<T>(key: string): Promise<T | null> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

/** Fire-and-forget — never block the request path on a KV write. */
export function kvSet<T>(key: string, value: T, ttlSeconds: number): void {
  if (ttlSeconds <= 0) return;
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${encodeURIComponent(key)}?expiration_ttl=${ttlSeconds}`;
  fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  }).catch(() => {});
}
