import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Express } from "express";
import type { Server } from "node:http";

// Branch-coverage focused tests for /api/music/:mode and /api/music-info/:mode:
// the sendFile success/failure branches, track-index parsing (valid/NaN), and
// mode validation. __tests__/integration/api-routes.test.ts only covers the
// invalid-mode 400.

let mockFilePath = "";

vi.mock("../suno", () => ({
  getMusicFilePath: vi.fn((mode: string) => mockFilePath),
  getMusicFileName: vi.fn((mode: string) => "classic.mp3"),
  getMusicTrackCount: vi.fn((mode: string) => 3),
}));

let app: Express;
let server: Server;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "music-route-test-"));
const realTrackPath = path.join(tmpDir, "track.mp3");
const missingTrackPath = path.join(tmpDir, "does-not-exist.mp3");

beforeAll(async () => {
  fs.writeFileSync(realTrackPath, Buffer.from("fake-mp3-bytes"));
  const { registerMusicRoutes } = await import("./music");
  app = express();
  registerMusicRoutes(app);
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => (err ? reject(err) : resolve()));
  });
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("GET /api/music/:mode", () => {
  it("serves the track when the file exists", async () => {
    mockFilePath = realTrackPath;
    const res = await request(app).get("/api/music/classic");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("audio/mpeg");
  });

  it("returns 404 when the resolved track file is missing", async () => {
    mockFilePath = missingTrackPath;
    const res = await request(app).get("/api/music/classic");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Music file not found");
    // The JSON error must not inherit the success-path audio/mpeg or 5m-cache
    // headers set before sendFile().
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("rejects an invalid mode before touching the filesystem", async () => {
    const res = await request(app).get("/api/music/not-a-real-mode");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid mode");
  });

  it("accepts a numeric track query param", async () => {
    mockFilePath = realTrackPath;
    const res = await request(app).get("/api/music/classic?track=2");
    expect(res.status).toBe(200);
  });

  it("ignores a non-numeric track query param instead of erroring", async () => {
    mockFilePath = realTrackPath;
    const res = await request(app).get("/api/music/classic?track=not-a-number");
    expect(res.status).toBe(200);
  });
});

describe("GET /api/music-info/:mode", () => {
  it("returns the track count for a valid mode", async () => {
    const res = await request(app).get("/api/music-info/classic");
    expect(res.status).toBe(200);
    expect(res.body.trackCount).toBe(3);
  });

  it("returns 400 for an invalid mode", async () => {
    const res = await request(app).get("/api/music-info/not-a-real-mode");
    expect(res.status).toBe(400);
  });
});
