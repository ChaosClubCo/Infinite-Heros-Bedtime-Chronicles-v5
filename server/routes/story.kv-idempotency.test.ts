import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import type { Express } from "express";
import type { Server } from "node:http";

// Exercises the KV-backed idempotency wiring added for M1: when Cloudflare
// KV is configured, a successful /api/generate-story response should be
// mirrored into KV under an idem: key so a duplicate request landing on a
// different serverless invocation (no shared in-memory cache) can still be
// deduped — see idempotency.test.ts for the underlying getResolved/
// setResolved unit tests. story.branches.test.ts covers the in-memory-only
// path; this file isolates the KV path by setting CLOUDFLARE_* env vars
// before the dynamic import (vitest runs each test file with its own module
// registry, so this doesn't leak into other test files).

const mockGenerateText = vi.fn();

vi.mock("../ai", () => ({
  getAIRouter: () => ({ generateText: mockGenerateText, generateTextStream: vi.fn() }),
}));

let app: Express;
let server: Server;
const previousRateLimitMax = process.env.RATE_LIMIT_MAX;
const previousCfVars = {
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_KV_NAMESPACE_ID: process.env.CLOUDFLARE_KV_NAMESPACE_ID,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
};
const originalFetch = global.fetch;

const validStoryPayload = {
  title: "A KV Test Story",
  parts: [{ text: "Once upon a time...", choices: ["Left", "Right"], partIndex: 0 }],
  vocabWord: { word: "brave", definition: "showing courage" },
  joke: "Why?",
  lesson: "Be kind",
  tomorrowHook: "More tomorrow!",
  rewardBadge: { emoji: "x", title: "Badge", description: "desc" },
};

let kvStore: Record<string, unknown>;

beforeAll(async () => {
  process.env.RATE_LIMIT_MAX = "100";
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
  process.env.CLOUDFLARE_KV_NAMESPACE_ID = "test-namespace";
  process.env.CLOUDFLARE_API_TOKEN = "test-token";

  kvStore = {};
  global.fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const urlStr = String(url);
    const keyMatch = urlStr.match(/\/values\/([^?]+)/);
    const key = keyMatch ? decodeURIComponent(keyMatch[1]) : "";
    if (init?.method === "PUT") {
      kvStore[key] = JSON.parse(String(init.body));
      return { ok: true, json: async () => ({}) } as Response;
    }
    if (key in kvStore) {
      return { ok: true, json: async () => kvStore[key] } as Response;
    }
    return { ok: false, json: async () => null } as Response;
  }) as unknown as typeof fetch;

  const { registerStoryRoutes } = await import("./story");
  app = express();
  app.use(express.json());
  registerStoryRoutes(app);
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => (err ? reject(err) : resolve()));
  });
  global.fetch = originalFetch;
  if (previousRateLimitMax === undefined) delete process.env.RATE_LIMIT_MAX;
  else process.env.RATE_LIMIT_MAX = previousRateLimitMax;
  for (const [key, value] of Object.entries(previousCfVars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

beforeEach(() => {
  mockGenerateText.mockReset();
  for (const key of Object.keys(kvStore)) delete kvStore[key];
});

describe("POST /api/generate-story KV-backed cross-invocation dedup", () => {
  it("mirrors a successful generation into Cloudflare KV under an idem: key", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: JSON.stringify(validStoryPayload),
      parsedJson: validStoryPayload,
      provider: "gemini",
      model: "gemini-test",
      usage: { inputTokens: 10, outputTokens: 10 },
    });

    const res = await request(app).post("/api/generate-story").send({ heroName: "KvDedupHero", heroTitle: "unique-kv-case" });
    expect(res.status).toBe(200);

    const kvKeys = Object.keys(kvStore).filter((k) => k.startsWith("idem:"));
    expect(kvKeys.length).toBe(1);
    expect((kvStore[kvKeys[0]] as { body: unknown }).body).toEqual(validStoryPayload);
  });

  it("does not write to KV when generation fails", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("provider unavailable"));
    const res = await request(app).post("/api/generate-story").send({ heroName: "KvFailHero", heroTitle: "unique-kv-fail-case" });
    expect([500, 503]).toContain(res.status);

    const kvKeys = Object.keys(kvStore).filter((k) => k.startsWith("idem:"));
    expect(kvKeys.length).toBe(0);
  });

  it("only generates once for two concurrent identical requests even when the KV lookup is slow", async () => {
    // Regression test: the KV getResolved() check must stay inside the
    // generationPromise IIFE in story.ts, not between the in-memory get()
    // and set(). If it were awaited in between, two requests racing through
    // that gap would both miss the in-memory cache and both start their own
    // generation. A slow/delayed KV GET (as simulated here) is exactly the
    // condition that would expose that window.
    const originalFetchImpl = global.fetch;
    global.fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init?.method || init.method === "GET" || init.method === undefined) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return originalFetchImpl(url, init);
    }) as unknown as typeof fetch;

    let resolveGeneration: (v: unknown) => void = () => {};
    let generationStarted = false;
    mockGenerateText.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          generationStarted = true;
          resolveGeneration = () =>
            resolve({
              text: JSON.stringify(validStoryPayload),
              parsedJson: validStoryPayload,
              provider: "gemini",
              model: "gemini-test",
              usage: { inputTokens: 10, outputTokens: 10 },
            });
        }),
    );

    try {
      const body = { heroName: "ConcurrentHero", heroTitle: "unique-concurrent-case" };
      // Fire the first request, then a second "concurrent" one 5ms later —
      // long after the fixed code's synchronous set() would have run, but
      // short enough that the buggy version (which awaited the 30ms-delayed
      // KV lookup before its set()) would still see an empty in-memory cache.
      // supertest's Test object is lazy — it doesn't dispatch until awaited/
      // then'd — so each must be explicitly kicked off with .then() rather
      // than left as a bare reference, or it never actually hits the route.
      const firstReqPromise = request(app).post("/api/generate-story").send(body).then((r) => r);
      const secondReqPromise = new Promise<void>((resolve) => setTimeout(resolve, 5)).then(() =>
        request(app).post("/api/generate-story").send(body).then((r) => r),
      );

      // Wait for the (single, if the fix holds) generation call to actually
      // start, rather than guessing a fixed delay — the request also passes
      // through the rate-limiter's own KV check first, so the exact timing
      // isn't worth hardcoding.
      await vi.waitFor(() => expect(generationStarted).toBe(true), { timeout: 2000 });
      resolveGeneration(undefined);

      const [first, second] = await Promise.all([firstReqPromise, secondReqPromise]);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    } finally {
      global.fetch = originalFetchImpl;
    }
  });
});
