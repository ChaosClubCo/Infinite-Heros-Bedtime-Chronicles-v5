import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import type { Express } from "express";
import type { Server } from "node:http";

let app: Express;
let server: Server;

beforeAll(async () => {
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
});

describe.each(["classic", "madlibs", "sleep"])("background music disabled: %s", (mode) => {
  it("returns a deterministic no-store disabled response instead of touching the filesystem", async () => {
    const res = await request(app).get(`/api/music/${mode}`);

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body).toEqual({
      enabled: false,
      error: "Background music is disabled for this release",
    });
  });

  it("reports zero available tracks", async () => {
    const res = await request(app).get(`/api/music-info/${mode}`);

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body).toEqual({ enabled: false, trackCount: 0 });
  });
});

describe("background music route validation", () => {
  it("rejects an invalid playback mode", async () => {
    const res = await request(app).get("/api/music/not-a-real-mode");

    expect(res.status).toBe(400);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body.error).toBe("Invalid mode");
  });

  it("rejects an invalid info mode", async () => {
    const res = await request(app).get("/api/music-info/not-a-real-mode");

    expect(res.status).toBe(400);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body.error).toBe("Invalid mode");
  });
});
