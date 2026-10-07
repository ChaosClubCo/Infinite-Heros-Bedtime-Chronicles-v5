import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express, Request, Response, NextFunction } from "express";
import { createApp } from "./index";

vi.mock("./alerting", () => ({
  checkAlertThresholds: vi.fn(),
  resetAlertState: vi.fn(),
}));

vi.mock("./auth", () => ({
  requireAuth: vi.fn((req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user: { uid: string; isAnonymous: boolean } }).user = {
      uid: "test-user-id",
      isAnonymous: false,
    };
    next();
  }),
  isAuthEnabled: vi.fn(() => true),
}));

vi.mock("./metrics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./metrics")>();
  return {
    ...actual,
    getMetrics: vi.fn(() => ({
      requests: { total: 20, errors: 0, byStatus: {} },
      tts: { calls: 0, failures: 0, cacheHits: 0, cacheHitRate: "0%" },
    })),
    recordTTS: vi.fn(),
  };
});

vi.mock("./elevenlabs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./elevenlabs")>();
  return {
    ...actual,
    generateSpeech: vi.fn(async () => Buffer.from("mock-audio")),
  };
});

describe("Server index integration", () => {
  let app: Express;

  beforeAll(async () => {
    vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");
    vi.stubEnv("AI_INTEGRATIONS_GEMINI_API_KEY", undefined);
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("ELEVENLABS_API_KEY", "mock-elevenlabs-key");
    app = await createApp();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("invokes checkAlertThresholds every 20th request completed via request-finish hook", async () => {
    const { checkAlertThresholds } = await import("./alerting");
    vi.mocked(checkAlertThresholds).mockClear();

    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(checkAlertThresholds).toHaveBeenCalledTimes(1);
  });

  it("invokes recordTTS when calling the TTS endpoint", async () => {
    const { recordTTS } = await import("./metrics");
    vi.mocked(recordTTS).mockClear();

    await request(app)
      .post("/api/tts")
      .send({ text: "Hello", voice: "moonbeam", mode: "sleep" });

    expect(recordTTS).toHaveBeenCalled();
  });

  it("registers the Gemini image route when GEMINI_API_KEY is configured", async () => {
    const res = await request(app)
      .post("/api/generate-image")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Prompt is required" });
  });
});
