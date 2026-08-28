import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import type { Express } from "express";
import type { Server } from "node:http";

// Branch-coverage focused tests for /api/generate-story and
// /api/generate-story-stream: the idempotency cache-hit path, the
// invalid-AI-response guards, and the SSE streaming success/error branches.
// __tests__/integration/api-routes.test.ts only covers the request-validation
// and happy-path branches, and never exercises the stream endpoint at all.

const mockGenerateText = vi.fn();
const mockGenerateTextStream = vi.fn();

vi.mock("../ai", () => ({
  getAIRouter: () => ({
    generateText: mockGenerateText,
    generateTextStream: mockGenerateTextStream,
  }),
}));

let app: Express;
let server: Server;
const previousRateLimitMax = process.env.RATE_LIMIT_MAX;

beforeAll(async () => {
  // See suggest.branches.test.ts for why this must precede the dynamic import.
  process.env.RATE_LIMIT_MAX = "100";
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
  if (previousRateLimitMax === undefined) {
    delete process.env.RATE_LIMIT_MAX;
  } else {
    process.env.RATE_LIMIT_MAX = previousRateLimitMax;
  }
});

beforeEach(() => {
  mockGenerateText.mockReset();
  mockGenerateTextStream.mockReset();
});

const validStoryPayload = {
  title: "A Test Story",
  parts: [{ text: "Once upon a time...", choices: ["Left", "Right"], partIndex: 0 }],
  vocabWord: { word: "brave", definition: "showing courage" },
  joke: "Why?",
  lesson: "Be kind",
  tomorrowHook: "More tomorrow!",
  rewardBadge: { emoji: "x", title: "Badge", description: "desc" },
};

function mockStoryResponse(parsedJson: unknown, overrides: Record<string, unknown> = {}) {
  mockGenerateText.mockResolvedValueOnce({
    text: JSON.stringify(parsedJson),
    parsedJson,
    provider: "gemini",
    model: "gemini-test",
    usage: { inputTokens: 10, outputTokens: 10 },
    ...overrides,
  });
}

describe("POST /api/generate-story idempotency", () => {
  it("does not regenerate for an identical request within the idempotency window", async () => {
    mockStoryResponse(validStoryPayload);
    const body = { heroName: "IdempotencyHero", duration: "short" };

    const first = await request(app).post("/api/generate-story").send(body);
    expect(first.status).toBe(200);
    expect(mockGenerateText).toHaveBeenCalledTimes(1);

    const second = await request(app).post("/api/generate-story").send(body);
    expect(second.status).toBe(200);
    expect(second.body.title).toBe(first.body.title);
    // Still 1 — the second request was served from the idempotency cache.
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/generate-story error paths", () => {
  it("returns a 5xx error when the AI response has no parsed JSON", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "not json",
      parsedJson: undefined,
      provider: "gemini",
      model: "gemini-test",
    });

    const res = await request(app).post("/api/generate-story").send({ heroName: "NoJsonHero" });
    expect([500, 503]).toContain(res.status);
  });

  it("returns a 5xx error when the story structure is missing parts", async () => {
    mockStoryResponse({ title: "No Parts Here" });

    const res = await request(app).post("/api/generate-story").send({ heroName: "NoPartsHero" });
    expect([500, 503]).toContain(res.status);
  });

  it("returns a 5xx error when the AI router throws, and clears the idempotency entry so a retry can succeed", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("provider unavailable"));
    const body = { heroName: "RetryHero", heroTitle: "unique-throw-case" };

    const failed = await request(app).post("/api/generate-story").send(body);
    expect([500, 503]).toContain(failed.status);

    mockStoryResponse(validStoryPayload);
    const retried = await request(app).post("/api/generate-story").send(body);
    expect(retried.status).toBe(200);
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it("drops choices from the final part in non-sleep modes", async () => {
    mockStoryResponse({
      ...validStoryPayload,
      parts: [
        { text: "Part one", choices: ["A", "B"], partIndex: 0 },
        { text: "The end", choices: ["Should be dropped"], partIndex: 1 },
      ],
    });

    const res = await request(app).post("/api/generate-story").send({ heroName: "FinalPartHero", mode: "classic" });
    expect(res.status).toBe(200);
    expect(res.body.parts[res.body.parts.length - 1].choices).toBeUndefined();
  });
});

describe("POST /api/generate-story-stream", () => {
  it("streams provider info and chunk/done events over SSE", async () => {
    mockGenerateTextStream.mockReturnValueOnce((async function* () {
      yield { text: "Once", done: false, provider: "gemini", model: "gemini-test" };
      yield { text: "", done: true, provider: "gemini", model: "gemini-test" };
    })());

    const res = await request(app).post("/api/generate-story-stream").send({ heroName: "StreamHero" });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.text).toContain('"type":"provider"');
    expect(res.text).toContain('"type":"chunk"');
    expect(res.text).toContain('"type":"done"');
  });

  it("returns a JSON error when the stream throws before any bytes are written", async () => {
    mockGenerateTextStream.mockReturnValueOnce((async function* () {
      // Throws on first iteration, before yielding any chunk — exercises the
      // pre-headers-sent error branch (JSON response, not an SSE error event).
      throw new Error("stream failed to start");
    })());

    const res = await request(app).post("/api/generate-story-stream").send({ heroName: "StreamFailEarlyHero" });

    expect([500, 503]).toContain(res.status);
    expect(res.body.error).toBeDefined();
    // Before any bytes are written the error is a real JSON response, not an
    // SSE error event, so it must not inherit the text/event-stream header.
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("writes an SSE error event when the stream fails after headers are already sent", async () => {
    mockGenerateTextStream.mockReturnValueOnce((async function* () {
      yield { text: "Once upon a time", done: false, provider: "gemini", model: "gemini-test" };
      throw new Error("stream interrupted mid-flight");
    })());

    const res = await request(app).post("/api/generate-story-stream").send({ heroName: "StreamFailLateHero" });

    expect(res.status).toBe(200);
    expect(res.text).toContain('"type":"chunk"');
    expect(res.text).toContain('"type":"error"');
  });
});

describe("POST /api/sync/interactions", () => {
  it("rejects a missing or non-array interactions field", async () => {
    const res = await request(app).post("/api/sync/interactions").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("processes a batch of offline interactions and echoes a synced count", async () => {
    const res = await request(app)
      .post("/api/sync/interactions")
      .send({
        interactions: [
          { id: "act_1", type: "like", storyId: "story-1", timestamp: 1700000000000 },
          { type: "story_completion", storyId: "story-2" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.syncedCount).toBe(2);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0]).toMatchObject({ id: "act_1", type: "like", storyId: "story-1", status: "processed" });
    // The second interaction omits id/timestamp — the handler must backfill both.
    expect(res.body.results[1].id).toBeTruthy();
    expect(res.body.results[1].timestamp).toBeGreaterThan(0);
  });
});
