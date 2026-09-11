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
import { REALTIME_WS_PATH, closeRealtimeSession } from "../realtime/ws-server";
import { issueConnectionTicket } from "../realtime/connection-tickets";

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
    const ownerId = req.user?.uid;
    if (!ownerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

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
        ownerId,
      });

      const response: Record<string, unknown> = { session };
      if (transport === "websocket") {
        // A single-use, 5-minute ticket binds the upcoming upgrade handshake to
        // this caller — see server/realtime/connection-tickets.ts for why a
        // bearer JWT can't be used here directly.
        const ticket = issueConnectionTicket(session.id, ownerId);
        response.wsUrl = `${REALTIME_WS_PATH}?sessionId=${encodeURIComponent(session.id)}&ticket=${encodeURIComponent(ticket)}`;
      } else {
        // Honest about current capability: this is a plain status-poll endpoint,
        // not an EventSource-compatible interactive stream. Vercel deployments
        // have no persistent process to hold a realtime session open at all
        // (see server/realtime/ws-server.ts) — a true SSE/bidirectional
        // fallback is unbuilt, tracked as follow-up work, not shipped here.
        response.sseUrl = `/api/v1/realtime-media-sessions/${encodeURIComponent(session.id)}`;
        response.realtimeAvailable = false;
        response.note = "Interactive realtime media is not available on this deployment target yet; poll sseUrl for session status only.";
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
    // 404 (not 403) for both "doesn't exist" and "not yours" — a distinguishing
    // status code would let a caller enumerate other users' session ids.
    if (!session || session.ownerId !== req.user?.uid) {
      return res.status(404).json({ error: "Realtime media session not found" });
    }

    res.json({ session });
  });

  app.post("/api/v1/realtime-media-sessions/:id/cancel", rateLimited(), (req, res) => {
    const sessionId = sanitizeString(req.params.id, 64);
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const session = getSession(sessionId);
    if (!session || session.ownerId !== req.user?.uid) {
      return res.status(404).json({ error: "Realtime media session not found" });
    }

    // Naturally idempotent: cancelling an already-cancelled/completed session
    // is a no-op that returns the current session rather than erroring, so
    // callers never need a separate idempotency-key cache for a plain state
    // transition (unlike the expensive generation calls in server/routes/story.ts).
    if (session.status === "active") {
      updateSessionStatus(sessionId, "cancelled");
      closeRealtimeSession(sessionId, 4000, "Session cancelled");
    }

    res.json({ session: getSession(sessionId) });
  });
}
