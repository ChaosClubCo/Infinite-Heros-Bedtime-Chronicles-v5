import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "./index";

vi.mock("./alerting", () => ({
  checkAlertThresholds: vi.fn(),
  resetAlertState: vi.fn(),
}));

vi.mock("./auth", () => ({
  requireAuth: vi.fn((req: any, res: any, next: any) => {
    req.user = { uid: "test-user-id", isAnonymous: false };
    next();
  }),
  isAuthEnabled: vi.fn(() => true),
}));

vi.mock("./metrics", () => ({
  recordTTS: vi.fn(),
  getMetrics: vi.fn(() => ({
    requests: { total: 20, errors: 0, byStatus: {} },
    tts: { calls: 0, failures: 0, cacheHits: 0, cacheHitRate: "0%" },
  })),
  recordRequest: vi.fn(),
  recordError: vi.fn(),
  recordCacheHit: vi.fn(),
}));

describe("Server index integration", () => {
  let app: any;

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
