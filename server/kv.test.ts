import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ENV_KEYS = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_KV_NAMESPACE_ID", "CLOUDFLARE_API_TOKEN"] as const;

function withKvEnv() {
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct-1";
  process.env.CLOUDFLARE_KV_NAMESPACE_ID = "ns-1";
  process.env.CLOUDFLARE_API_TOKEN = "token-1";
}

function clearKvEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("kv (KV disabled — no Cloudflare env vars set)", () => {
  beforeEach(() => {
    vi.resetModules();
    clearKvEnv();
  });

  it("KV_ENABLED is false", async () => {
    const { KV_ENABLED } = await import("./kv");
    expect(KV_ENABLED).toBe(false);
  });
});

describe("kv (KV enabled — Cloudflare env vars set)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    withKvEnv();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearKvEnv();
  });

  it("KV_ENABLED is true", async () => {
    const { KV_ENABLED } = await import("./kv");
    expect(KV_ENABLED).toBe(true);
  });

  it("kvGet returns the parsed value on a successful fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ foo: "bar" }) }) as unknown as typeof fetch;
    const { kvGet } = await import("./kv");
    const result = await kvGet<{ foo: string }>("some-key");
    expect(result).toEqual({ foo: "bar" });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/values/some-key"),
      expect.objectContaining({ headers: { Authorization: "Bearer token-1" } }),
    );
  });

  it("kvGet returns null on a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const { kvGet } = await import("./kv");
    expect(await kvGet("missing-key")).toBeNull();
  });

  it("kvGet returns null and never throws on a network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    const { kvGet } = await import("./kv");
    await expect(kvGet("any-key")).resolves.toBeNull();
  });

  it("kvSet issues a fire-and-forget PUT and does not await the fetch", async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    const fetchMock = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { kvSet } = await import("./kv");
    kvSet("write-key", { hello: "world" }, 60);

    // kvSet returns synchronously without waiting for the fetch to resolve.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("expiration_ttl=60"),
      expect.objectContaining({ method: "PUT" }),
    );
    resolveFetch({ ok: true });
  });

  it("kvSet is a no-op for a non-positive TTL", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const { kvSet } = await import("./kv");
    kvSet("expired-key", { a: 1 }, 0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
