import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import WebSocket from "ws";
import { attachRealtimeWebSocketServer, REALTIME_WS_PATH } from "./ws-server";
import { createSession, updateSessionStatus, getSession, _resetSessionStoreForTests } from "./session-store";
import { issueConnectionTicket, _resetConnectionTicketsForTests } from "./connection-tickets";

const { mockGenerateText } = vi.hoisted(() => ({ mockGenerateText: vi.fn() }));
vi.mock("../ai", () => ({
  getAIRouter: () => ({ generateText: mockGenerateText }),
}));

const { mockGenerateSpeech } = vi.hoisted(() => ({ mockGenerateSpeech: vi.fn() }));
vi.mock("../elevenlabs", async (importOriginal) => {
  // Keep the real VOICE_MAP (server/media/provider-bindings.ts needs it to
  // build VOICE_BINDING_SEEDS) — only generateSpeech itself is mocked.
  const actual = await importOriginal<typeof import("../elevenlabs")>();
  return { ...actual, generateSpeech: mockGenerateSpeech };
});

let server: Server;
let port: number;

/** Create a session and a matching WebSocket URL with a valid, freshly-issued ticket. */
function createSessionAndUrl(input: Parameters<typeof createSession>[0]) {
  const session = createSession(input);
  const ticket = issueConnectionTicket(session.id, session.ownerId);
  const url = `ws://localhost:${port}${REALTIME_WS_PATH}?sessionId=${session.id}&ticket=${ticket}`;
  return { session, url };
}

async function startServer() {
  server = createServer();
  attachRealtimeWebSocketServer(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as { port: number }).port;
}

async function stopServer() {
  // Force-drop any lingering WebSocket-upgraded sockets a test forgot to
  // terminate — server.close() alone waits indefinitely for existing
  // connections to end, which previously stalled the whole suite.
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server.close() timed out")), 4000);
    server.close((err) => {
      clearTimeout(timer);
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

type QueuedMessage = { text?: string; binary?: Buffer };

/**
 * A single `ws` "message" listener attached SYNCHRONOUSLY, right when the
 * WebSocket is constructed — never after an `await` boundary. `next()` can
 * then be called (and awaited) as many times as needed afterward.
 *
 * This matters because the server sends `session_started` immediately upon
 * connection. Attaching a fresh `.once("message", ...)` listener only after
 * `await`-ing the "open" event left a real window, on fast loopback
 * connections, where that first message could arrive and fire before any
 * listener existed — `.once()` never sees an event that already fired, so
 * the message was silently dropped and every later `nextMessage()` call hung
 * until its timeout. Queuing from the start eliminates that window.
 */
function createMessageQueue(ws: WebSocket) {
  const buffered: QueuedMessage[] = [];
  const waiters: ((msg: QueuedMessage) => void)[] = [];

  ws.on("message", (data, isBinary) => {
    const msg: QueuedMessage = isBinary ? { binary: data as Buffer } : { text: data.toString("utf8") };
    const waiter = waiters.shift();
    if (waiter) waiter(msg);
    else buffered.push(msg);
  });

  return {
    next(timeoutMs = 4000): Promise<QueuedMessage> {
      const already = buffered.shift();
      if (already) return Promise.resolve(already);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`nextMessage timed out after ${timeoutMs}ms`)), timeoutMs);
        waiters.push((msg) => {
          clearTimeout(timer);
          resolve(msg);
        });
      });
    },
  };
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket open timed out after 4000ms")), 4000);
    ws.once("open", () => {
      clearTimeout(timer);
      resolve();
    });
    ws.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe("attachRealtimeWebSocketServer", () => {
  beforeEach(() => {
    _resetSessionStoreForTests();
    _resetConnectionTicketsForTests();
    delete process.env.VERCEL;
    mockGenerateText.mockReset();
    mockGenerateSpeech.mockReset();
  });

  afterEach(async () => {
    if (server?.listening) await stopServer();
    delete process.env.VERCEL;
  });

  it("does not attach an upgrade listener on Vercel", async () => {
    process.env.VERCEL = "1";
    server = createServer();
    attachRealtimeWebSocketServer(server);
    expect(server.listenerCount("upgrade")).toBe(0);
  });

  it("attaches an upgrade listener off Vercel", async () => {
    server = createServer();
    attachRealtimeWebSocketServer(server);
    expect(server.listenerCount("upgrade")).toBeGreaterThan(0);
  });

  it("refuses an upgrade for an unknown sessionId", async () => {
    await startServer();
    const ws = new WebSocket(`ws://localhost:${port}${REALTIME_WS_PATH}?sessionId=nonexistent`);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("expected rejection timed out")), 4000);
      ws.once("unexpected-response", () => { clearTimeout(timer); resolve(); });
      ws.once("error", () => { clearTimeout(timer); resolve(); });
    });
    ws.terminate();
  }, 8000);

  it("sends session_started immediately on a valid connection", async () => {
    await startServer();
    const { session, url } = createSessionAndUrl({
      mode: "sleep",
      characterProfileId: "moonbeam",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    const ws = new WebSocket(url);
    const queue = createMessageQueue(ws);
    await waitForOpen(ws);

    const first = await queue.next();
    const event = JSON.parse(first.text!);
    expect(event.eventType).toBe("session_started");
    expect(event.sessionId).toBe(session.id);
    expect(event.schemaVersion).toBe(1);
    ws.terminate();
  }, 8000);

  it("runs the full typed-text pipeline: text reply, safety inspection, binary speech chunk, completion", async () => {
    await startServer();
    const { url } = createSessionAndUrl({
      mode: "classic",
      characterProfileId: "captain",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    mockGenerateText.mockResolvedValueOnce({
      text: "A gentle adventure begins under a friendly sky.",
      provider: "anthropic",
      model: "claude-sonnet-4-6",
    });
    mockGenerateSpeech.mockResolvedValueOnce(Buffer.from("fake-mp3-bytes"));

    const ws = new WebSocket(url);
    const queue = createMessageQueue(ws);
    await waitForOpen(ws);

    await queue.next(); // session_started

    ws.send(JSON.stringify({ type: "user_text", text: "Tell me a story" }));

    // Safety inspection must complete (and be reported) before any reply text
    // reaches the client — see the ordering comment in RealtimeConnection.
    const safety = JSON.parse((await queue.next()).text!);
    expect(safety.eventType).toBe("safety_inspection");
    expect(safety.payload.inspection.outcome).toBe("approved");

    const textDelta = JSON.parse((await queue.next()).text!);
    expect(textDelta.eventType).toBe("response_text_delta");
    expect(textDelta.payload.text).toContain("gentle adventure");

    const chunkMeta = JSON.parse((await queue.next()).text!);
    expect(chunkMeta.eventType).toBe("speech_chunk_ready");

    const chunkBytes = await queue.next();
    expect(chunkBytes.binary?.toString("utf8")).toBe("fake-mp3-bytes");

    const complete = JSON.parse((await queue.next()).text!);
    expect(complete.eventType).toBe("speech_complete");
    expect(complete.payload.provider).toBe("elevenlabs");

    expect(mockGenerateText).toHaveBeenCalledWith(
      "suggestion",
      expect.objectContaining({ userPrompt: "Tell me a story" }),
    );

    ws.terminate();
  }, 8000);

  it("never emits the raw model reply when moderation replaces it with a fallback", async () => {
    await startServer();
    const { url } = createSessionAndUrl({
      mode: "classic",
      characterProfileId: "captain",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    mockGenerateText.mockResolvedValueOnce({
      text: "The villain pulled out a gun and killed everyone in the castle.",
      provider: "anthropic",
      model: "claude-sonnet-4-6",
    });
    mockGenerateSpeech.mockResolvedValueOnce(Buffer.from("fallback-audio"));

    const ws = new WebSocket(url);
    const queue = createMessageQueue(ws);
    await waitForOpen(ws);
    await queue.next(); // session_started

    ws.send(JSON.stringify({ type: "user_text", text: "Tell me a scary story" }));

    const safety = JSON.parse((await queue.next()).text!);
    expect(safety.eventType).toBe("safety_inspection");
    expect(safety.payload.inspection.outcome).toBe("fallback");

    const textDelta = JSON.parse((await queue.next()).text!);
    expect(textDelta.eventType).toBe("response_text_delta");
    expect(textDelta.payload.text).not.toContain("gun");
    expect(textDelta.payload.text).not.toContain("killed");

    ws.terminate();
  }, 8000);

  it("emits an error event for a malformed client message instead of crashing the connection", async () => {
    await startServer();
    const { url } = createSessionAndUrl({
      mode: "sleep",
      characterProfileId: "moonbeam",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    const ws = new WebSocket(url);
    const queue = createMessageQueue(ws);
    await waitForOpen(ws);
    await queue.next(); // session_started

    ws.send(JSON.stringify({ type: "not_a_real_type" }));
    const errorEvent = JSON.parse((await queue.next()).text!);
    expect(errorEvent.eventType).toBe("error");

    ws.terminate();
  }, 8000);

  it("marks the session completed when the socket closes", async () => {
    await startServer();
    const { session, url } = createSessionAndUrl({
      mode: "sleep",
      characterProfileId: "moonbeam",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    const ws = new WebSocket(url);
    const queue = createMessageQueue(ws);
    await waitForOpen(ws);
    await queue.next(); // session_started

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("close event timed out")), 4000);
      ws.once("close", () => { clearTimeout(timer); resolve(); });
      ws.close();
    });

    // Allow the server-side 'close' handler a tick to run.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getSession(session.id)?.status).toBe("completed");
  }, 8000);

  it("preserves a cancelled session's terminal state instead of overwriting it to completed on close", async () => {
    await startServer();
    const { session, url } = createSessionAndUrl({
      mode: "sleep",
      characterProfileId: "moonbeam",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    const ws = new WebSocket(url);
    const queue = createMessageQueue(ws);
    await waitForOpen(ws);
    await queue.next(); // session_started

    // Simulate a concurrent cancel (e.g. via POST .../cancel) happening while
    // the socket is still open.
    updateSessionStatus(session.id, "cancelled");

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("close event timed out")), 4000);
      ws.once("close", () => { clearTimeout(timer); resolve(); });
      ws.close();
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getSession(session.id)?.status).toBe("cancelled");
  }, 8000);

  it("rejects a second message while a reply is still being generated", async () => {
    await startServer();
    const { url } = createSessionAndUrl({
      mode: "classic",
      characterProfileId: "captain",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    // Never resolves during this test — keeps the connection "busy".
    mockGenerateText.mockReturnValueOnce(new Promise(() => {}));

    const ws = new WebSocket(url);
    const queue = createMessageQueue(ws);
    await waitForOpen(ws);
    await queue.next(); // session_started

    ws.send(JSON.stringify({ type: "user_text", text: "First message" }));
    ws.send(JSON.stringify({ type: "user_text", text: "Second message while busy" }));

    const busyError = JSON.parse((await queue.next()).text!);
    expect(busyError.eventType).toBe("error");
    expect(busyError.payload.message).toMatch(/already being generated/i);
    expect(mockGenerateText).toHaveBeenCalledTimes(1);

    ws.terminate();
  }, 8000);

  it("refuses an upgrade with a missing or invalid ticket even for a known active session", async () => {
    await startServer();
    const session = createSession({
      mode: "sleep",
      characterProfileId: "moonbeam",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    const ws = new WebSocket(`ws://localhost:${port}${REALTIME_WS_PATH}?sessionId=${session.id}&ticket=not-a-real-ticket`);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("expected rejection timed out")), 4000);
      ws.once("unexpected-response", () => { clearTimeout(timer); resolve(); });
      ws.once("error", () => { clearTimeout(timer); resolve(); });
    });
    ws.terminate();
  }, 8000);

  it("refuses an upgrade reusing a ticket already consumed by a prior connection", async () => {
    await startServer();
    const { url } = createSessionAndUrl({
      mode: "sleep",
      characterProfileId: "moonbeam",
      consentArtifactId: "consent-1",
      transport: "websocket",
      ownerId: "user-1",
    });

    const first = new WebSocket(url);
    await waitForOpen(first);
    first.terminate();

    // The ticket was already consumed by the first (successful) handshake, so
    // a second attempt with the same ticket must be rejected regardless of
    // whether the first connection's close has been processed yet.
    const second = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("expected rejection timed out")), 4000);
      second.once("unexpected-response", () => { clearTimeout(timer); resolve(); });
      second.once("error", () => { clearTimeout(timer); resolve(); });
    });
    second.terminate();
  }, 8000);
});
