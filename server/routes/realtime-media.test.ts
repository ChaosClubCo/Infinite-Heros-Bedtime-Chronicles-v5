import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import type { Express } from "express";
import { resetRateLimits } from "../rate-limit";
import { _resetSessionStoreForTests } from "../realtime/session-store";
import { EXPECTED_CONSENT_RECORD_VERSION } from "../../shared/media/schemas";

let app: Express;

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    mode: "sleep",
    characterProfileId: "moonbeam",
    consentArtifact: {
      schemaVersion: 1,
      id: "consent-1",
      consentRecordVersion: EXPECTED_CONSENT_RECORD_VERSION,
      grantedAt: new Date().toISOString(),
      scope: "realtime-media",
    },
    ...overrides,
  };
}

beforeAll(async () => {
  const { registerRealtimeMediaRoutes } = await import("./realtime-media");
  app = express();
  app.use(express.json());
  registerRealtimeMediaRoutes(app);
});

beforeEach(() => {
  resetRateLimits();
  _resetSessionStoreForTests();
  delete process.env.VERCEL;
});

afterAll(() => {
  delete process.env.VERCEL;
});

describe("POST /api/v1/realtime-media-sessions", () => {
  it("creates a session with a websocket transport off Vercel", async () => {
    const res = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    expect(res.status).toBe(201);
    expect(res.body.session.status).toBe("active");
    expect(res.body.session.transport).toBe("websocket");
    expect(res.body.wsUrl).toContain("/api/v1/realtime-media-sessions/ws?sessionId=");
    expect(res.body.sseUrl).toBeUndefined();
  });

  it("creates a session with an sse-fallback transport on Vercel", async () => {
    process.env.VERCEL = "1";
    const res = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    expect(res.status).toBe(201);
    expect(res.body.session.transport).toBe("sse-fallback");
    expect(res.body.sseUrl).toBe(`/api/v1/realtime-media-sessions/${res.body.session.id}`);
    expect(res.body.wsUrl).toBeUndefined();
  });

  it("rejects an unknown mode", async () => {
    const res = await request(app).post("/api/v1/realtime-media-sessions").send(validBody({ mode: "chaos" }));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown characterProfileId", async () => {
    const res = await request(app).post("/api/v1/realtime-media-sessions").send(validBody({ characterProfileId: "nonexistent" }));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/characterProfileId/i);
  });

  it("rejects a consent artifact with the wrong scope", async () => {
    const res = await request(app).post("/api/v1/realtime-media-sessions").send(
      validBody({
        consentArtifact: {
          schemaVersion: 1,
          id: "consent-1",
          consentRecordVersion: EXPECTED_CONSENT_RECORD_VERSION,
          grantedAt: new Date().toISOString(),
          scope: "story-generation",
        },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects a stale consentRecordVersion", async () => {
    const res = await request(app).post("/api/v1/realtime-media-sessions").send(
      validBody({
        consentArtifact: {
          schemaVersion: 1,
          id: "consent-1",
          consentRecordVersion: EXPECTED_CONSENT_RECORD_VERSION - 1,
          grantedAt: new Date().toISOString(),
          scope: "realtime-media",
        },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects a malformed consent artifact", async () => {
    const res = await request(app).post("/api/v1/realtime-media-sessions").send(validBody({ consentArtifact: { scope: "realtime-media" } }));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/realtime-media-sessions/:id", () => {
  it("returns the session for a known id", async () => {
    const created = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    const res = await request(app).get(`/api/v1/realtime-media-sessions/${created.body.session.id}`);
    expect(res.status).toBe(200);
    expect(res.body.session.id).toBe(created.body.session.id);
  });

  it("404s for an unknown id", async () => {
    const res = await request(app).get("/api/v1/realtime-media-sessions/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/realtime-media-sessions/:id/cancel", () => {
  it("cancels an active session", async () => {
    const created = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    const res = await request(app).post(`/api/v1/realtime-media-sessions/${created.body.session.id}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.session.status).toBe("cancelled");
  });

  it("is idempotent — cancelling twice returns the same cancelled state without erroring", async () => {
    const created = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    const first = await request(app).post(`/api/v1/realtime-media-sessions/${created.body.session.id}/cancel`);
    const second = await request(app).post(`/api/v1/realtime-media-sessions/${created.body.session.id}/cancel`);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.session.status).toBe("cancelled");
  });

  it("404s for an unknown id", async () => {
    const res = await request(app).post("/api/v1/realtime-media-sessions/does-not-exist/cancel");
    expect(res.status).toBe(404);
  });
});
