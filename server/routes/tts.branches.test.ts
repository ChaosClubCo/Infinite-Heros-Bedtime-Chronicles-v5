import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import fs from "node:fs";
import type { Express } from "express";
import type { Server } from "node:http";

// Branch-coverage focused tests for the TTS routes: cache-hit vs cache-miss,
// generation failure, invalid-voice rejection, and serving a cached file.
// __tests__/integration/api-routes.test.ts only covers request validation.
//
// The route caches to the real /tmp/tts-cache directory (TTS_CACHE_DIR), and
// the cache key is a deterministic hash of voice+mode+text, so a "cache miss"
// test would silently become a "cache hit" on any re-run unless the specific
// files this file writes are removed first — hence the cleanup below.

const mockGenerateSpeech = vi.fn();

vi.mock("../elevenlabs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../elevenlabs")>();
  return { ...actual, generateSpeech: mockGenerateSpeech };
});

const mockR2Get = vi.fn();
const mockR2Put = vi.fn();
let mockR2Enabled = false;

vi.mock("../r2", () => {
  return {
    get R2_ENABLED() { return mockR2Enabled; },
    r2Get: (...args: any[]) => mockR2Get(...args),
    r2Put: (...args: any[]) => mockR2Put(...args),
  };
});

let app: Express;
let server: Server;
const previousRateLimitMax = process.env.RATE_LIMIT_MAX;

async function cleanCacheFiles() {
  const { ttsCachePathFor } = await import("./helpers");
  const { VOICE_MAP } = await import("../elevenlabs");
  const cacheKeys = [
    "moonbeam::a brand new bedtime line",
    "moonbeam:sleep:a repeatable cache line",
    "moonbeam::this one will fail to generate",
    "moonbeam::a file that will exist on disk",
    "moonbeam::an r2 cached story line",
    "moonbeam::a brand new r2 story line",
    "moonbeam::a completely missing file",
    `preview:captain:${VOICE_MAP.captain.previewText}`,
    "preview:whisper:shh... the moon is rising softly",
    `preview:whisper:${VOICE_MAP.whisper.previewText}`,
  ];
  await Promise.all(
    cacheKeys.map((key) => fs.promises.unlink(ttsCachePathFor(key).filePath).catch(() => {})),
  );
}

beforeAll(async () => {
  // See suggest.branches.test.ts for why this must be set before the dynamic
  // import below (rate-limit.ts reads it once at module load).
  process.env.RATE_LIMIT_MAX = "100";
  const { registerTtsRoutes } = await import("./tts");
  await cleanCacheFiles();
  app = express();
  app.use(express.json());
  registerTtsRoutes(app);
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await cleanCacheFiles();
  if (previousRateLimitMax === undefined) {
    delete process.env.RATE_LIMIT_MAX;
  } else {
    process.env.RATE_LIMIT_MAX = previousRateLimitMax;
  }
});

beforeEach(() => {
  mockGenerateSpeech.mockReset();
});

describe("POST /api/tts", () => {
  it("generates and caches audio on a cache miss", async () => {
    mockGenerateSpeech.mockResolvedValueOnce(Buffer.from("fake-audio"));
    // Unique text per test so the cache-path hash is never hit by an earlier run.
    const res = await request(app).post("/api/tts").send({ text: "a brand new bedtime line", voice: "moonbeam" });

    expect(res.status).toBe(200);
    expect(res.body.audioUrl).toMatch(/^\/api\/tts-audio\/[a-f0-9]+\.mp3$/);
    expect(mockGenerateSpeech).toHaveBeenCalledTimes(1);
  });

  it("skips generation on a cache hit for identical text+voice+mode", async () => {
    mockGenerateSpeech.mockResolvedValueOnce(Buffer.from("fake-audio"));
    const body = { text: "a repeatable cache line", voice: "moonbeam", mode: "sleep" };

    const first = await request(app).post("/api/tts").send(body);
    expect(first.status).toBe(200);
    expect(mockGenerateSpeech).toHaveBeenCalledTimes(1);

    const second = await request(app).post("/api/tts").send(body);
    expect(second.status).toBe(200);
    expect(second.body.audioUrl).toBe(first.body.audioUrl);
    // Still 1 — the second request hit the cache and did not regenerate.
    expect(mockGenerateSpeech).toHaveBeenCalledTimes(1);
  });

  it("returns a 5xx error when speech generation fails", async () => {
    mockGenerateSpeech.mockRejectedValueOnce(new Error("TTS generation failed: upstream error"));
    const res = await request(app).post("/api/tts").send({ text: "this one will fail to generate", voice: "moonbeam" });

    expect([500, 503]).toContain(res.status);
    expect(res.body.error).toBeDefined();
  });
});

describe("POST /api/tts with Cloudflare R2 enabled", () => {
  beforeAll(() => {
    mockR2Enabled = true;
  });

  afterAll(() => {
    mockR2Enabled = false;
  });

  beforeEach(() => {
    mockR2Get.mockReset();
    mockR2Put.mockReset();
    mockGenerateSpeech.mockReset();
  });

  it("returns cached audio from R2 on local cache miss but R2 hit", async () => {
    mockR2Get.mockResolvedValueOnce(Buffer.from("r2-cached-audio"));

    const body = { text: "an r2 cached story line", voice: "moonbeam" };
    const res = await request(app).post("/api/tts").send(body);

    expect(res.status).toBe(200);
    expect(res.body.audioUrl).toBeDefined();
    expect(mockR2Get).toHaveBeenCalledTimes(1);
    expect(mockGenerateSpeech).not.toHaveBeenCalled();

    // Clean up local file created during the test
    const { ttsCachePathFor } = await import("./helpers");
    const { filePath } = ttsCachePathFor("moonbeam::an r2 cached story line");
    expect(fs.existsSync(filePath)).toBe(true);
    await fs.promises.unlink(filePath).catch(() => {});
  });

  it("generates speech and uploads to R2 on both local and R2 miss", async () => {
    mockR2Get.mockResolvedValueOnce(null);
    mockGenerateSpeech.mockResolvedValueOnce(Buffer.from("newly-generated-audio"));
    mockR2Put.mockResolvedValueOnce(true);

    const body = { text: "a brand new r2 story line", voice: "moonbeam" };
    const res = await request(app).post("/api/tts").send(body);

    expect(res.status).toBe(200);
    expect(res.body.audioUrl).toBeDefined();
    expect(mockR2Get).toHaveBeenCalledTimes(1);
    expect(mockGenerateSpeech).toHaveBeenCalledTimes(1);

    // Wait slightly since R2 upload is async (fire-and-forget) in the route handler
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockR2Put).toHaveBeenCalledTimes(1);

    const { ttsCachePathFor } = await import("./helpers");
    const { filePath } = ttsCachePathFor("moonbeam::a brand new r2 story line");
    await fs.promises.unlink(filePath).catch(() => {});
  });
});

describe("GET /api/tts-audio/:file", () => {
  it("serves a cached audio file that exists", async () => {
    mockGenerateSpeech.mockResolvedValueOnce(Buffer.from("fake-audio-bytes"));
    const gen = await request(app).post("/api/tts").send({ text: "a file that will exist on disk", voice: "moonbeam" });
    expect(gen.status).toBe(200);
    const fileName = gen.body.audioUrl.split("/").pop();

    const res = await request(app).get(`/api/tts-audio/${fileName}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("audio/mpeg");
  });
});

describe("GET /api/tts-audio/:file with Cloudflare R2 enabled", () => {
  beforeAll(() => {
    mockR2Enabled = true;
  });

  afterAll(() => {
    mockR2Enabled = false;
  });

  beforeEach(() => {
    mockR2Get.mockReset();
    mockR2Put.mockReset();
  });

  it("downloads from R2 and serves file if missing locally", async () => {
    mockR2Get.mockResolvedValueOnce(Buffer.from("fake-r2-audio-bytes"));

    const { ttsCachePathFor } = await import("./helpers");
    const { fileName, filePath } = ttsCachePathFor("preview:whisper:shh... the moon is rising softly");
    await fs.promises.unlink(filePath).catch(() => {});

    const res = await request(app).get(`/api/tts-audio/${fileName}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("audio/mpeg");
    expect(mockR2Get).toHaveBeenCalledWith(fileName);

    expect(fs.existsSync(filePath)).toBe(true);
    await fs.promises.unlink(filePath).catch(() => {});
  });

  it("returns 404 if file is missing locally and not found in R2", async () => {
    mockR2Get.mockResolvedValueOnce(null);

    const { ttsCachePathFor } = await import("./helpers");
    const { fileName, filePath } = ttsCachePathFor("moonbeam::a completely missing file");
    await fs.promises.unlink(filePath).catch(() => {});

    const res = await request(app).get(`/api/tts-audio/${fileName}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/tts-preview", () => {
  it("returns 400 for an unknown voice key", async () => {
    const res = await request(app).post("/api/tts-preview").send({ voice: "not-a-real-voice" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid voice");
  });

  it("generates a preview on a cache miss and caches it for a repeat request", async () => {
    mockGenerateSpeech.mockResolvedValueOnce(Buffer.from("preview-audio"));
    const first = await request(app).post("/api/tts-preview").send({ voice: "captain" });
    expect(first.status).toBe(200);
    expect(mockGenerateSpeech).toHaveBeenCalledTimes(1);

    const second = await request(app).post("/api/tts-preview").send({ voice: "captain" });
    expect(second.status).toBe(200);
    expect(mockGenerateSpeech).toHaveBeenCalledTimes(1);
  });

  it("returns a 5xx error when preview generation fails", async () => {
    mockGenerateSpeech.mockRejectedValueOnce(new Error("TTS generation failed: upstream error"));
    const res = await request(app).post("/api/tts-preview").send({ voice: "aurora" });

    expect([500, 503]).toContain(res.status);
  });
});

describe("GET /api/voices", () => {
  it("lists every voice with its category and mode defaults", async () => {
    const res = await request(app).get("/api/voices");
    expect(res.status).toBe(200);
    expect(res.body.voices.length).toBeGreaterThan(0);
    expect(res.body.defaults).toBeDefined();
  });
});

