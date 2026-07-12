export interface LiveCheckResult {
  /** null = not checked yet (cold cache, e.g. first request after a serverless cold start) */
  reachable: boolean | null;
  checkedAt: number | null;
  latencyMs?: number;
}

const CHECK_TTL_MS = parseInt(process.env.HEALTH_CHECK_TTL_MS || String(45 * 1000), 10);

// Exported so individual probes (server/elevenlabs.ts, server/ai/providers/*)
// can pass a matching AbortSignal.timeout() into their own fetch() calls —
// otherwise a stalled probe's Promise.race here "times out" from the caller's
// perspective while the underlying request keeps the socket open in the
// background, leaking a connection per stalled health check.
export const CHECK_TIMEOUT_MS = 2000;

const cache = new Map<string, LiveCheckResult>();
const inFlight = new Set<string>();

/**
 * Returns the last cached reachability result synchronously and, when the
 * cache is stale, kicks off a background probe to refresh it. The probe is
 * never awaited by the caller — this guarantees callers (e.g. /api/health)
 * never block a request on an outbound network call. The first call for a
 * given key always returns `{reachable: null}` since nothing has been probed
 * yet (expected/honest behavior right after a cold start).
 */
export function getLiveStatus(key: string, probe: () => Promise<boolean>): LiveCheckResult {
  const cached = cache.get(key);
  const isFresh = !!cached && cached.checkedAt !== null && Date.now() - cached.checkedAt < CHECK_TTL_MS;

  if (!isFresh && !inFlight.has(key)) {
    inFlight.add(key);
    const start = Date.now();
    Promise.race([
      probe(),
      new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error("health check timeout")), CHECK_TIMEOUT_MS)),
    ])
      .then((reachable) => {
        cache.set(key, { reachable, checkedAt: Date.now(), latencyMs: Date.now() - start });
      })
      .catch(() => {
        cache.set(key, { reachable: false, checkedAt: Date.now(), latencyMs: Date.now() - start });
      })
      .finally(() => {
        inFlight.delete(key);
      });
  }

  return cached ?? { reachable: null, checkedAt: null };
}

/** For testing only. */
export function resetHealthCheckCache(): void {
  cache.clear();
  inFlight.clear();
}
