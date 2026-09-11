import type { Express } from "express";
import { z } from "zod";
import { sanitizeString } from "../validation";
import { rateLimited, sendRouteError } from "./helpers";
import {
  MediaSessionModeSchema,
  ConsentArtifactSchema,
  EXPECTED_CONSENT_RECORD_VERSION,
  findCharacterProfile,
} from "../../shared/media/schemas";
import { createSession, getSession, updateSessionStatus } from "../realtime/session-store";
import { REALTIME_WS_PATH } from "../realtime/ws-server";

const CreateSessionRequestSchema = z.object({
  mode: MediaSessionModeSchema,
  characterProfileId: z.string().min(1).max(64),
  consentArtifact: ConsentArtifactSchema,
});

/**
 * Session lifecycle for the typed-input realtime vertical slice. Sits behind
 * the same `requireAuth` / AI-provider-compliance / `rateLimited` middleware
 * every other `/api/*` route already goes through (see `server/routes.ts`).
 */
export function registerRealtimeMediaRoutes(app: Express): void {
  app.post("/api/v1/realtime-media-sessions", rateLimited(), (req, res) => {
    const parsed = CreateSessionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { mode, characterProfileId, consentArtifact } = parsed.data;

    // Consent verification: a new, additive scope. Existing story-generation
    // consent is never treated as covering the realtime media surface.
    if (consentArtifact.scope !== "realtime-media") {
      return res.status(403).json({ error: "A realtime-media consent artifact is required." });
    }
    if (consentArtifact.consentRecordVersion !== EXPECTED_CONSENT_RECORD_VERSION) {
      return res.status(403).json({ error: "Consent is out of date. Please re-confirm parental consent." });
    }

    if (!findCharacterProfile(characterProfileId)) {
      return res.status(400).json({ error: "Unknown characterProfileId." });
    }

    try {
      // Production traffic on Vercel has no persistent process to hold a
      // WebSocket upgrade open (see server/realtime/ws-server.ts's module doc)
      // — sessions there get an honest sse-fallback transport instead.
      const transport = process.env.VERCEL ? "sse-fallback" : "websocket";
      const session = createSession({
        mode,
        characterProfileId,
        consentArtifactId: consentArtifact.id,
        transport,
      });

      const response: Record<string, unknown> = { session };
      if (transport === "websocket") {
        response.wsUrl = `${REALTIME_WS_PATH}?sessionId=${encodeURIComponent(session.id)}`;
      } else {
        response.sseUrl = `/api/v1/realtime-media-sessions/${encodeURIComponent(session.id)}`;
      }

      res.status(201).json(response);
    } catch (error: unknown) {
      sendRouteError(req, res, error, "realtime media session creation failed", "Failed to create realtime media session");
    }
  });

  app.get("/api/v1/realtime-media-sessions/:id", (req, res) => {
    const sessionId = sanitizeString(req.params.id, 64);
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Realtime media session not found" });
    }

    res.json({ session });
  });

  app.post("/api/v1/realtime-media-sessions/:id/cancel", (req, res) => {
    const sessionId = sanitizeString(req.params.id, 64);
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Realtime media session not found" });
    }

    // Naturally idempotent: cancelling an already-cancelled/completed session
    // is a no-op that returns the current session rather than erroring, so
    // callers never need a separate idempotency-key cache for a plain state
    // transition (unlike the expensive generation calls in server/routes/story.ts).
    if (session.status === "active") {
      updateSessionStatus(sessionId, "cancelled");
    }

    res.json({ session: getSession(sessionId) });
  });
}
