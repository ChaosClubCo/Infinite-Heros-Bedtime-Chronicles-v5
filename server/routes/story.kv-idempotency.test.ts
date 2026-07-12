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
});
