import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import type { Express } from "express";
import type { Server } from "node:http";

const mockProviders = [
  { name: "anthropic", displayName: "Anthropic Claude", available: true, capabilities: { text: true, image: false, streaming: true } },
  { name: "gemini", displayName: "Gemini", available: true, capabilities: { text: true, image: true, streaming: true } },
  { name: "openai", displayName: "OpenAI", available: false, capabilities: { text: true, image: true, streaming: true } },
];
const mockBreakers = [
  { provider: "anthropic", state: "closed" },
  { provider: "gemini", state: "open" },
];

vi.mock("../ai", () => ({
  getProviderStatuses: () => mockProviders,
  getBreakerStatuses: () => mockBreakers,
}));
vi.mock("../health-checks", () => ({
  getLiveStatus: vi.fn((key: string) => ({ reachable: true, checkedAt: Date.now(), latencyMs: 12, key })),
}));
vi.mock("../elevenlabs", () => ({ pingElevenLabs: vi.fn() }));
vi.mock("../ai/providers/gemini", () => ({ pingGemini: vi.fn() }));
vi.mock("../ai/providers/anthropic", () => ({ pingAnthropic: vi.fn() }));
vi.mock("../ai/providers/openai", () => ({ pingOpenAI: vi.fn() }));
vi.mock("../ai/providers/openrouter", () => ({ pingOpenRouter: vi.fn() }));
vi.mock("../feature-flags", () => ({ getFeatureFlags: () => ({ videoEnabled: false, voiceChatEnabled: true, streamingEnabled: true }) }));
vi.mock("../metrics", () => ({ getMetrics: () => ({ requests: { total: 0, errors: 0, byStatus: {} } }) }));
vi.mock("../load-shedding", () => ({ getActiveRequests: () => 0 }));

let app: Express;
let server: Server;
const previousElevenLabsKey = process.env.ELEVENLABS_API_KEY;
const previousReleaseSha = process.env.APP_RELEASE_SHA;
const previousVercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA;

beforeAll(async () => {
  process.env.ELEVENLABS_API_KEY = "test-key";
  process.env.VERCEL_GIT_COMMIT_SHA = "8a65b4b98aff49177853165aac7b54979c9119f9";
  process.env.APP_RELEASE_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const { registerHealthRoutes } = await import("./health");
  app = express();
  registerHealthRoutes(app);
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => (err ? reject(err) : resolve()));
  });
  if (previousElevenLabsKey === undefined) {
    delete process.env.ELEVENLABS_API_KEY;
  } else {
    process.env.ELEVENLABS_API_KEY = previousElevenLabsKey;
  }
  if (previousReleaseSha === undefined) {
    delete process.env.APP_RELEASE_SHA;
  } else {
    process.env.APP_RELEASE_SHA = previousReleaseSha;
  }
  if (previousVercelCommitSha === undefined) {
    delete process.env.VERCEL_GIT_COMMIT_SHA;
  } else {
    process.env.VERCEL_GIT_COMMIT_SHA = previousVercelCommitSha;
  }
});

describe("GET /api/health", () => {
  it("includes breaker statuses and live-check results alongside the existing fields", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.releaseSha).toBe("8a65b4b98aff49177853165aac7b54979c9119f9");
    expect(res.body.aiProvidersAvailable).toBe(true);
    expect(res.body.ttsAvailable).toBe(true);
    expect(res.body.breakers).toEqual(mockBreakers);
    expect(res.body.ttsLive).toEqual(expect.objectContaining({ reachable: true }));
    expect(res.body.aiProvidersLive).toEqual(expect.objectContaining({ reachable: true }));
  });

  it("reports releaseRepo/releaseRef from Vercel git metadata and null without it", async () => {
    const withoutGitMeta = await request(app).get("/api/health");
    expect(withoutGitMeta.body.releaseRepo).toBeNull();
    expect(withoutGitMeta.body.releaseRef).toBeNull();

    process.env.VERCEL_GIT_REPO_OWNER = "ChaosClubCo";
    process.env.VERCEL_GIT_REPO_SLUG = "Infinite-Heros-Bedtime-Chronicles-v5";
    process.env.VERCEL_GIT_COMMIT_REF = "main";
    try {
      const res = await request(app).get("/api/health");
      expect(res.body.releaseRepo).toBe("ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5");
      expect(res.body.releaseRef).toBe("main");
    } finally {
      delete process.env.VERCEL_GIT_REPO_OWNER;
      delete process.env.VERCEL_GIT_REPO_SLUG;
      delete process.env.VERCEL_GIT_COMMIT_REF;
    }
  });

  it("reports ttsLive as {reachable: null} without probing when ELEVENLABS_API_KEY is unset", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    try {
      const res = await request(app).get("/api/health");
      expect(res.body.ttsAvailable).toBe(false);
      expect(res.body.ttsLive).toEqual({ reachable: null, checkedAt: null });
    } finally {
      process.env.ELEVENLABS_API_KEY = "test-key";
    }
  });

  it("prefers anthropic over gemini for the live probe when both are available, matching the story fallback chain", async () => {
    const getLiveStatus = (await import("../health-checks")).getLiveStatus as ReturnType<typeof vi.fn>;
    getLiveStatus.mockClear();
    await request(app).get("/api/health");
    expect(getLiveStatus).toHaveBeenCalledWith("anthropic", expect.anything());
  });

  it("falls back to gemini for the live probe when anthropic is unavailable", async () => {
    const anthropicEntry = mockProviders.find((p) => p.name === "anthropic")!;
    const getLiveStatus = (await import("../health-checks")).getLiveStatus as ReturnType<typeof vi.fn>;
    anthropicEntry.available = false;
    getLiveStatus.mockClear();
    try {
      await request(app).get("/api/health");
      expect(getLiveStatus).toHaveBeenCalledWith("gemini", expect.anything());
    } finally {
      anthropicEntry.available = true;
    }
  });

  it("reports aiProvidersLive as {reachable: null} without probing when no live-probe provider is available", async () => {
    const anthropicEntry = mockProviders.find((p) => p.name === "anthropic")!;
    const geminiEntry = mockProviders.find((p) => p.name === "gemini")!;
    anthropicEntry.available = false;
    geminiEntry.available = false;
    try {
      const res = await request(app).get("/api/health");
      expect(res.body.aiProvidersLive).toEqual({ reachable: null, checkedAt: null });
    } finally {
      anthropicEntry.available = true;
      geminiEntry.available = true;
    }
  });

  it("falls back to openai for the live probe when anthropic and gemini are unavailable", async () => {
    const anthropicEntry = mockProviders.find((p) => p.name === "anthropic")!;
    const geminiEntry = mockProviders.find((p) => p.name === "gemini")!;
    const openaiEntry = mockProviders.find((p) => p.name === "openai")!;
    const getLiveStatus = (await import("../health-checks")).getLiveStatus as ReturnType<typeof vi.fn>;

    anthropicEntry.available = false;
    geminiEntry.available = false;
    openaiEntry.available = true;
    getLiveStatus.mockClear();
    try {
      await request(app).get("/api/health");
      expect(getLiveStatus).toHaveBeenCalledWith("openai", expect.anything());
    } finally {
      anthropicEntry.available = true;
      geminiEntry.available = true;
      openaiEntry.available = false;
    }
  });
});

describe("GET /privacy", () => {
  it("serves a self-contained, current parent-facing notice without runtime file access", async () => {
    const res = await request(app).get("/privacy");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.text).toContain("Privacy Policy");
    expect(res.text).toContain("Last updated: July 19, 2026");
    expect(res.text).toContain("Voice Chat is unavailable in this release");
    expect(res.text).toContain("privacy@bedtime-chronicles.com");
    expect(res.text).not.toContain("/static/privacy.css");
  });
});

describe("GET /api/ai-providers", () => {
  it("returns providers and breaker statuses", async () => {
    const res = await request(app).get("/api/ai-providers");
    expect(res.status).toBe(200);
    expect(res.body.providers).toEqual(mockProviders);
    expect(res.body.breakers).toEqual(mockBreakers);
  });
});
