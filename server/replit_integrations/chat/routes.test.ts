import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const createMock = vi.fn();
const getConversationMock = vi.fn();
const createMessageMock = vi.fn();
const getMessagesByConversationMock = vi.fn();

const OpenAIMock = vi.fn(function MockOpenAI() {
  return {
  chat: {
    completions: {
      create: createMock,
    },
  },
  };
});

vi.mock("openai", () => ({
  default: OpenAIMock,
}));

vi.mock("./storage", () => ({
  chatStorage: {
    getConversation: getConversationMock,
    getAllConversations: vi.fn(),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    getMessagesByConversation: getMessagesByConversationMock,
    createMessage: createMessageMock,
  },
}));

vi.mock("../../auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe("registerChatRoutes", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    getConversationMock.mockResolvedValue({ id: 1, userId: "user-1", title: "Chat" });
    createMessageMock.mockResolvedValue({ id: 1 });
    getMessagesByConversationMock.mockResolvedValue([
      { role: "user", content: "hello" },
    ]);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns JSON 503 without writing a user message when OpenAI is not configured", async () => {
    const { registerChatRoutes } = await import("./routes");
    const app = express();
    app.use(express.json());
    registerChatRoutes(app);

    const res = await request(app).post("/api/conversations/1/messages").send({ content: "hello" });

    expect(res.status).toBe(503);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: "Voice chat is not configured" });
    expect(createMessageMock).not.toHaveBeenCalled();
    expect(OpenAIMock).not.toHaveBeenCalled();
  });

  it("keeps the error response as JSON when stream creation fails before streaming starts", async () => {
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-key";
    createMock.mockRejectedValueOnce(new Error("stream failed"));

    const { registerChatRoutes } = await import("./routes");
    const app = express();
    app.use(express.json());
    registerChatRoutes(app);

    const res = await request(app).post("/api/conversations/1/messages").send({ content: "hello" });

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: "Failed to send message" });
  });
});
