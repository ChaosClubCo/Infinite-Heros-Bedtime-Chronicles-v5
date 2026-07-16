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

// Spread the real module so every export the route modules import (e.g.
// recordContentBlock / recordSafetyLlm / recordRegeneration used by guardStory)
// is present — a partial mock leaves those undefined and breaks route loading.
// Only getMetrics (drives the "every 20th request" alerting) and recordTTS
// (asserted below) are overridden.
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

// The TTS test hits the real tts route → generateSpeech(); mock ElevenLabs so it
// never calls the network. Spread the real module to keep VOICE_MAP / MODE_*
// (also imported by the route) intact.
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
    vi.stubEnv("AI_INTEGRATIONS_GEMINI_API_KEY", "mock-gemini-key");
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

    // Wait for the 'finish' event listener to run
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
});
