/**
 * Realtime WebSocket transport for typed-input moderated talkback.
 *
 * Only attaches on the long-running deployment target (Replit) — mirrors the
 * exact `!process.env.VERCEL` guard `server/index.ts` already uses for
 * `server.listen()`, because Vercel serves production traffic through a
 * stateless serverless function with no persistent process to hold a WebSocket
 * upgrade connection open (see `vercel.json`: all routes rewrite to one
 * `api/server.mjs` function). On Vercel, `POST /api/v1/realtime-media-sessions`
 * returns `transport: "sse-fallback"` instead of a `wsUrl` — this module is
 * simply inert there, not silently broken.
 *
 * No mic input, no transcription — this is a typed-text-only realtime slice
 * (see the increment plan's Decision 1). The pipeline re-plumbs the existing
 * chat-safe reply + moderation + TTS steps already implemented for the (dark)
 * voice-chat backend (`server/integrations/audio/routes.ts`) onto binary
 * WebSocket frames instead of base64-JSON-then-one-SSE-event.
 */

import type { Server as HttpServer, IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import { z } from 'zod';
import { getAIRouter } from '../ai';
import { logger } from '../logger';
import { getReleaseSha } from '../release-identity';
import { sanitizeChatInput, CHILD_CHAT_SYSTEM_PROMPT, MAX_CHAT_INPUT_LENGTH } from '../safety/chat-safety';
import { chatSafetyModerationProvider } from '../providers/safety-provider';
import { elevenLabsSpeechProvider } from '../providers/elevenlabs-provider';
import { findVoiceBinding } from '../media/provider-bindings';
import { consumeConnectionTicket } from './connection-tickets';
import {
  findCharacterProfile,
  SLEEP_MODE_PERFORMANCE_OVERRIDE,
  REALTIME_EVENT_SCHEMA_VERSION,
  GENERATION_JOB_SCHEMA_VERSION,
  PROVENANCE_RECORD_SCHEMA_VERSION,
  type MediaSession,
  type PerformanceProfile,
  type RealtimeEventType,
} from '../../shared/media/schemas';
import { getSession, updateSessionStatus } from './session-store';

export const REALTIME_WS_PATH = '/api/v1/realtime-media-sessions/ws';

const SPEECH_CHUNK_BYTES = 32 * 1024;

// Generous headroom over MAX_CHAT_INPUT_LENGTH (4,000 UTF-16 units, up to ~4
// bytes each in the worst case) plus the small JSON envelope, so a legitimate
// message is never rejected while an oversized/abusive frame is capped before
// it reaches JSON.parse or any provider call.
const WS_MAX_PAYLOAD_BYTES = 20 * 1024;

const ClientMessageSchema = z.object({
  type: z.literal('user_text'),
  text: z.string().min(1).max(MAX_CHAT_INPUT_LENGTH),
});

/** Live connections keyed by session id, so a cancel or shutdown can close them. */
const liveConnections = new Map<string, WebSocket>();

function buildPerformanceProfile(session: MediaSession): PerformanceProfile | undefined {
  const profile = findCharacterProfile(session.characterProfileId);
  if (!profile || session.mode !== 'sleep' || profile.category === 'sleep') return undefined;
  return {
    schemaVersion: 1,
    characterProfileId: session.characterProfileId,
    mode: 'sleep',
    ...SLEEP_MODE_PERFORMANCE_OVERRIDE,
  };
}

class RealtimeConnection {
  private sequence = 0;
  /** Serializes message handling: a client cannot pipeline a second generation
   * (each one calls a paid AI + TTS provider) while the first is in flight. */
  private busy = false;

  constructor(private readonly ws: WebSocket, private readonly session: MediaSession) {}

  private sendEvent(eventType: RealtimeEventType, payload: Record<string, unknown>): void {
    this.sequence += 1;
    this.ws.send(JSON.stringify({
      schemaVersion: REALTIME_EVENT_SCHEMA_VERSION,
      eventId: randomUUID(),
      sessionId: this.session.id,
      sequence: this.sequence,
      eventType,
      timestampMs: Date.now(),
      payload,
    }));
  }

  start(): void {
    this.sendEvent('session_started', {
      mode: this.session.mode,
      characterProfileId: this.session.characterProfileId,
    });
  }

  async handleMessage(raw: string): Promise<void> {
    if (this.busy) {
      this.sendEvent('error', { message: 'A response is already being generated for this session. Please wait for it to finish.' });
      return;
    }

    // Re-check the session's live status rather than trusting the snapshot
    // captured at connection time — a cancel (or expiry sweep) since then must
    // stop new generations even though the socket is still technically open.
    const currentSession = getSession(this.session.id);
    if (!currentSession || currentSession.status !== 'active') {
      this.sendEvent('error', { message: 'This session is no longer active.' });
      return;
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(raw);
    } catch {
      this.sendEvent('error', { message: 'Message must be valid JSON.' });
      return;
    }

    const parsed = ClientMessageSchema.safeParse(parsedBody);
    if (!parsed.success) {
      this.sendEvent('error', { message: 'Unrecognized message shape.' });
      return;
    }

    const userText = sanitizeChatInput(parsed.data.text);
    if (!userText) {
      this.sendEvent('error', { message: 'Message text was empty after sanitization.' });
      return;
    }

    this.busy = true;
    const startedAt = new Date().toISOString();
    try {
      const generation = await getAIRouter().generateText('suggestion', {
        systemPrompt: CHILD_CHAT_SYSTEM_PROMPT,
        userPrompt: userText,
      });

      // Moderate BEFORE anything reaches the child — mirrors the buffered-SSE
      // approach in server/routes/story.ts (safety on) rather than the legacy
      // token-by-token passthrough: no raw model output is ever emitted here.
      const moderation = await chatSafetyModerationProvider.moderate({
        text: generation.text,
        subjectType: 'realtime-utterance',
      });
      this.sendEvent('safety_inspection', { inspection: moderation.inspection });
      this.sendEvent('response_text_delta', {
        text: moderation.text,
        provider: generation.provider,
        model: generation.model,
      });

      const voiceBinding = findVoiceBinding(this.session.characterProfileId);
      if (!voiceBinding) {
        this.sendEvent('error', { message: 'No voice is configured for this character.' });
        return;
      }

      const speech = await elevenLabsSpeechProvider.generateSpeech({
        text: moderation.text,
        voiceBinding,
        performanceProfile: buildPerformanceProfile(this.session),
      });

      const totalChunks = Math.max(1, Math.ceil(speech.audioBuffer.length / SPEECH_CHUNK_BYTES));
      for (let i = 0; i < totalChunks; i++) {
        const chunk = speech.audioBuffer.subarray(i * SPEECH_CHUNK_BYTES, (i + 1) * SPEECH_CHUNK_BYTES);
        this.sendEvent('speech_chunk_ready', { chunkIndex: i, byteLength: chunk.length });
        this.ws.send(chunk);
      }
      this.sendEvent('speech_complete', {
        provider: speech.provider,
        model: speech.model,
        totalChunks,
      });

      logger.info({
        generationJob: {
          schemaVersion: GENERATION_JOB_SCHEMA_VERSION,
          id: randomUUID(),
          kind: 'speech',
          status: 'succeeded',
          provider: speech.provider,
          model: speech.model,
          createdAt: startedAt,
          completedAt: new Date().toISOString(),
          resultRef: null,
          error: null,
        },
        provenance: {
          schemaVersion: PROVENANCE_RECORD_SCHEMA_VERSION,
          id: randomUUID(),
          subjectId: this.session.id,
          provider: speech.provider,
          model: speech.model,
          releaseSha: getReleaseSha(),
          generatedAt: new Date().toISOString(),
          safetyInspectionId: moderation.inspection.id,
        },
      }, 'realtime speech generation completed');
    } catch (err) {
      logger.error({ err, sessionId: this.session.id }, 'realtime session generation failed');
      this.sendEvent('error', { message: 'Something went wrong generating a response. Please try again.' });
    } finally {
      this.busy = false;
    }
  }

  rejectBinary(): void {
    this.sendEvent('error', { message: 'This session accepts typed text only — binary frames are not supported for input.' });
  }
}

/** Close a live connection for `sessionId`, if one is currently open. */
export function closeRealtimeSession(sessionId: string, code = 1000, reason = 'Session ended'): void {
  const ws = liveConnections.get(sessionId);
  if (!ws) return;
  try {
    ws.close(code, reason);
  } catch (err) {
    logger.warn({ err, sessionId }, 'failed to close realtime session socket');
  }
}

/** Close every live connection — called from graceful shutdown. */
export function closeAllRealtimeConnections(): void {
  for (const [sessionId, ws] of liveConnections) {
    try {
      ws.close(1001, 'Server shutting down');
    } catch (err) {
      logger.warn({ err, sessionId }, 'failed to close realtime session socket during shutdown');
    }
  }
  liveConnections.clear();
}

/**
 * Attach the realtime WebSocket transport to an existing `http.Server`. No-ops
 * on Vercel (see module doc) so this is always safe to call unconditionally
 * from the long-running server bootstrap.
 */
export function attachRealtimeWebSocketServer(server: HttpServer): void {
  if (process.env.VERCEL) {
    logger.info('realtime WebSocket transport skipped (serverless deployment target)');
    return;
  }

  const wss = new WebSocketServer({ noServer: true, maxPayload: WS_MAX_PAYLOAD_BYTES });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    let pathname: string;
    let sessionId: string | null;
    let ticket: string | null;
    try {
      const url = new URL(req.url ?? '', 'http://localhost');
      pathname = url.pathname;
      sessionId = url.searchParams.get('sessionId');
      ticket = url.searchParams.get('ticket');
    } catch {
      socket.destroy();
      return;
    }

    if (pathname !== REALTIME_WS_PATH) {
      // Not our path, and this is the only `server.on('upgrade', ...)`
      // registration in the process — nothing else will ever claim this
      // socket, so leaving it open would leak it until the client times out.
      socket.destroy();
      return;
    }

    const session = sessionId ? getSession(sessionId) : undefined;
    if (!session || session.status !== 'active' || session.transport !== 'websocket') {
      // `socket.end()` (not write()+destroy()) so the response is flushed
      // before the socket closes — destroying immediately after write() can
      // drop the unflushed bytes and leave the client hanging indefinitely.
      socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      return;
    }

    // The session id alone is not authorization — a single-use ticket minted
    // at session-creation time (bound to the creator's uid) must also be
    // presented and is consumed here so it can never be replayed.
    const consumed = consumeConnectionTicket(session.id, ticket ?? undefined);
    if (!consumed || consumed.ownerId !== session.ownerId) {
      socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, session);
    });
  });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, session: MediaSession) => {
    liveConnections.set(session.id, ws);
    const connection = new RealtimeConnection(ws, session);
    connection.start();

    // An uncaught 'error' event on an EventEmitter crashes the process — a
    // socket reset, protocol violation, or similar transport-level fault must
    // not be allowed to take the whole server down.
    ws.on('error', (err) => {
      logger.warn({ err, sessionId: session.id }, 'realtime websocket connection error');
    });

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        connection.rejectBinary();
        return;
      }
      void connection.handleMessage(data.toString('utf8'));
    });

    ws.on('close', () => {
      liveConnections.delete(session.id);
      // Only clean-close a still-active session into 'completed' — a session
      // already 'cancelled' (or otherwise moved on) must keep that terminal
      // state rather than being overwritten by the socket closing afterward.
      const current = getSession(session.id);
      if (current?.status === 'active') {
        updateSessionStatus(session.id, 'completed');
      }
    });
  });

  logger.info('realtime WebSocket transport attached');
}
