import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Express } from "express";
import type { Server } from "node:http";

// Regression coverage for the video.ts / routes/video.ts race-condition fix:
// getVideoFilePath() no longer pre-checks fs.existsSync() (a TOCTOU race
// against the hourly cache-cleanup sweep), so the route must classify a
// sendFile() ENOENT as a clean 404 instead of a generic 500.

let mockFilePath: string | null = null;

vi.mock("../video", () => ({
  isVideoAvailable: vi.fn(() => true),
  createVideoJob: vi.fn(async () => ({ jobId: "test-job" })),
  getVideoJob: vi.fn(() => null),
  getVideoFilePath: vi.fn(() => mockFilePath),
}));

let app: Express;
let server: Server;
const previousFeatureVideoEnabled = process.env.FEATURE_VIDEO_ENABLED;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-route-test-"));
const realFilePath = path.join(tmpDir, "real-video.mp4");
const missingFilePath = path.join(tmpDir, "deleted-before-serve.mp4");

beforeAll(async () => {
  process.env.FEATURE_VIDEO_ENABLED = "true";
  fs.writeFileSync(realFilePath, Buffer.from("fake-mp4-bytes"));

  const { registerVideoRoutes } = await import("./video");
  app = express();
  app.use(express.json());
  registerVideoRoutes(app);
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => (err ? reject(err) : resolve()));
  });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (previousFeatureVideoEnabled === undefined) {
    delete process.env.FEATURE_VIDEO_ENABLED;
  } else {
    process.env.FEATURE_VIDEO_ENABLED = previousFeatureVideoEnabled;
  }
});

describe("GET /api/video/:id file serving", () => {
  it("serves the file when it is present on disk", async () => {
    mockFilePath = realFilePath;
    const res = await request(app).get("/api/video/deadbeef");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("video/mp4");
  });

  it("returns 404 (not 500) when the recorded path goes stale before sendFile runs", async () => {
    // Simulates the race: getVideoFilePath() returned a path for a job whose
    // file was deleted by cache cleanup between the lookup and this request.
    mockFilePath = missingFilePath;
    const res = await request(app).get("/api/video/deadbeef");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Video not found");
    // The JSON error must not inherit the success-path video/mp4 or 24h-cache
    // headers set before sendFile().
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.headers["cache-control"]).toBe("no-store");
  });
});
