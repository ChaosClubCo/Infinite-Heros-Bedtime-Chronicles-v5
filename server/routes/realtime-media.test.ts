import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import type { Express } from "express";
import { resetRateLimits } from "../rate-limit";
import { _resetSessionStoreForTests } from "../realtime/session-store";
import { _resetConnectionTicketsForTests } from "../realtime/connection-tickets";
import { EXPECTED_CONSENT_RECORD_VERSION } from "../../shared/media/schemas";

let registerRealtimeMediaRoutes: (app: Express) => void;

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

/**
 * Builds a fresh app whose requests carry `req.user`, mimicking what
 * `server/auth.ts`'s `requireAuth` middleware attaches in production (this
 * route module is exercised standalone here, without the real auth gate in
 * front of it). Pass `undefined` to simulate an unauthenticated request.
 */
function createApp(uid: string | null = "user-1"): Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (uid) req.user = { uid, isAnonymous: false };
    next();
  });
  registerRealtimeMediaRoutes(app);
  return app;
}

let app: Express;

beforeAll(async () => {
  ({ registerRealtimeMediaRoutes } = await import("./realtime-media"));
  app = createApp();
});

beforeEach(() => {
  resetRateLimits();
  _resetSessionStoreForTests();
  _resetConnectionTicketsForTests();
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
    expect(res.body.session.ownerId).toBe("user-1");
    expect(res.body.wsUrl).toContain("/api/v1/realtime-media-sessions/ws?sessionId=");
    // A single-use connection ticket must be embedded — the WS upgrade
    // handshake requires it (server/realtime/connection-tickets.ts).
    expect(res.body.wsUrl).toMatch(/[?&]ticket=[^&]+/);
    expect(res.body.sseUrl).toBeUndefined();
  });

  it("requires authentication", async () => {
    const res = await request(createApp(null)).post("/api/v1/realtime-media-sessions").send(validBody());
    expect(res.status).toBe(401);
  });

  it("creates a session with an sse-fallback transport on Vercel, honest about lacking interactive capability", async () => {
    process.env.VERCEL = "1";
    const res = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    expect(res.status).toBe(201);
    expect(res.body.session.transport).toBe("sse-fallback");
    expect(res.body.sseUrl).toBe(`/api/v1/realtime-media-sessions/${res.body.session.id}`);
    expect(res.body.wsUrl).toBeUndefined();
    expect(res.body.realtimeAvailable).toBe(false);
    expect(res.body.note).toBeTruthy();
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
  it("returns the session for a known id to its owner", async () => {
    const created = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    const res = await request(app).get(`/api/v1/realtime-media-sessions/${created.body.session.id}`);
    expect(res.status).toBe(200);
    expect(res.body.session.id).toBe(created.body.session.id);
  });

  it("404s for an unknown id", async () => {
    const res = await request(app).get("/api/v1/realtime-media-sessions/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("404s (not 403) for a session owned by a different user, to avoid ID enumeration", async () => {
    const created = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    const otherUserApp = createApp("user-2");
    const res = await request(otherUserApp).get(`/api/v1/realtime-media-sessions/${created.body.session.id}`);
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

  it("404s (not 403) when a different user attempts to cancel", async () => {
    const created = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    const otherUserApp = createApp("user-2");
    const res = await request(otherUserApp).post(`/api/v1/realtime-media-sessions/${created.body.session.id}/cancel`);
    expect(res.status).toBe(404);

    // Confirm the other user's attempt did not cancel it out from under the owner.
    const check = await request(app).get(`/api/v1/realtime-media-sessions/${created.body.session.id}`);
    expect(check.body.session.status).toBe("active");
  });

  it("is rate-limited like other write endpoints", async () => {
    const created = await request(app).post("/api/v1/realtime-media-sessions").send(validBody());
    for (let i = 0; i < 10; i++) {
      await request(app).post(`/api/v1/realtime-media-sessions/${created.body.session.id}/cancel`);
    }
    const res = await request(app).post(`/api/v1/realtime-media-sessions/${created.body.session.id}/cancel`);
    expect(res.status).toBe(429);
  });
});
