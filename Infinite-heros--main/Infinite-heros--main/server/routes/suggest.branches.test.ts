import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import type { Express } from "express";
import type { Server } from "node:http";

// Branch-coverage focused tests for /api/suggest-settings: validation
// failures, the invalid-AI-response guard, mode/duration/speed/voice
// fallback substitution, and the catch-block error path. The existing
// __tests__/integration/api-routes.test.ts only exercises the happy path.

const mockGenerateText = vi.fn();

vi.mock("../ai", () => ({
  getAIRouter: () => ({ generateText: mockGenerateText }),
}));

let app: Express;
let server: Server;
const previousRateLimitMax = process.env.RATE_LIMIT_MAX;

beforeAll(async () => {
  // rate-limit.ts reads RATE_LIMIT_MAX once at module load, so it must be set
  // before the dynamic import below pulls it in transitively (via ./suggest ->
  // ./helpers -> ../rate-limit). This file sends more requests than the
  // default 10/window limit permits.
  process.env.RATE_LIMIT_MAX = "100";
  const { registerSuggestRoutes } = await import("./suggest");
  app = express();
  app.use(express.json());
  registerSuggestRoutes(app);
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => (err ? reject(err) : resolve()));
  });
  if (previousRateLimitMax === undefined) {
    delete process.env.RATE_LIMIT_MAX;
  } else {
    process.env.RATE_LIMIT_MAX = previousRateLimitMax;
  }
});

beforeEach(() => {
  mockGenerateText.mockReset();
});

function suggestionPayload(overrides: Record<string, unknown> = {}) {
  return {
    mode: "classic",
    duration: "medium",
    speed: "medium",
    voice: "captain",
    tip: "Have a great story!",
    ...overrides,
  };
}

function mockAiResponse(parsedJson: unknown) {
  mockGenerateText.mockResolvedValueOnce({
    text: JSON.stringify(parsedJson),
    parsedJson,
    provider: "gemini",
    model: "gemini-test",
    usage: { inputTokens: 10, outputTokens: 10 },
  });
}

describe("POST /api/suggest-settings validation", () => {
  it("returns 400 for an out-of-range hour", async () => {
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova", hour: 99 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 for an out-of-range childAge", async () => {
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova", childAge: 50 });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/suggest-settings AI response handling", () => {
  it("returns the suggestion using AI-provided values when all are valid", async () => {
    mockAiResponse(suggestionPayload());
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova", heroPower: "Shield" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(suggestionPayload());
  });

  it("falls back to defaults when mode/duration/speed/voice are invalid", async () => {
    mockAiResponse({ mode: "not-a-mode", duration: "not-a-duration", speed: "not-a-speed", voice: "not-a-voice", tip: 42 });
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova" });

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("classic");
    expect(res.body.duration).toBe("medium");
    expect(res.body.speed).toBe("medium");
    // Falls back to the mode's default voice since "not-a-voice" isn't a known voice key.
    expect(res.body.voice).toBe("captain");
    // Non-string tip falls back to the default copy.
    expect(res.body.tip).toBe("A great story awaits!");
  });

  it("truncates an overlong tip to 120 characters", async () => {
    mockAiResponse(suggestionPayload({ tip: "x".repeat(200) }));
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova" });

    expect(res.status).toBe(200);
    expect(res.body.tip).toHaveLength(120);
  });

  it("returns 500 when the AI response has no parsable JSON object", async () => {
    mockAiResponse(null);
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Invalid AI response");
  });

  it("returns 500 when the AI response is a JSON array instead of an object", async () => {
    mockAiResponse(["not", "an", "object"]);
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Invalid AI response");
  });

  it("returns a 5xx error when the AI router throws", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("provider unavailable"));
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova" });

    expect([500, 503]).toContain(res.status);
    expect(res.body.error).toBeDefined();
  });

  it("accepts a childAge at the young end (<=5) and an older age (>5) without error", async () => {
    mockAiResponse(suggestionPayload());
    const young = await request(app).post("/api/suggest-settings").send({ heroName: "Nova", childAge: 3 });
    expect(young.status).toBe(200);

    mockAiResponse(suggestionPayload());
    const older = await request(app).post("/api/suggest-settings").send({ heroName: "Nova", childAge: 9 });
    expect(older.status).toBe(200);
  });

  it("accepts an optional childName", async () => {
    mockAiResponse(suggestionPayload());
    const res = await request(app).post("/api/suggest-settings").send({ heroName: "Nova", childName: "Sam" });
    expect(res.status).toBe(200);
  });
});
