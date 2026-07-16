import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { requireAuth } from "../../auth";
import {
  approveChatResponse,
  buildChildSafeChatMessages,
  MAX_CHAT_INPUT_LENGTH,
  sanitizeChatInput,
} from "../../safety/chat-safety";

// Construct the OpenAI client lazily so a missing AI_INTEGRATIONS_OPENAI_API_KEY
// does not throw at module load — that would crash the serverless function on
// cold start before any request or graceful degradation can run.
let _openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  if (!_openai) {
    _openai = new OpenAI({
      apiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}

const MAX_TITLE_LENGTH = 200;
const CHAT_TEXT_MODEL = process.env.VOICE_CHAT_TEXT_MODEL?.trim() || "gpt-4o-mini";

function parseIdParam(raw: string | string[]): number | null {
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return null;
  const id = parseInt(str, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function registerChatRoutes(app: Express): void {
  app.get("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid ?? "anonymous";
      const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 50, 1), 200);
      const offset = Math.max(parseInt(String(req.query.offset), 10) || 0, 0);
      const conversations = await chatStorage.getAllConversations(userId);
      const paginated = conversations.slice(offset, offset + limit);
      res.json({ data: paginated, total: conversations.length, limit, offset });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      const userId = req.user?.uid ?? "anonymous";
      const conversation = await chatStorage.getConversation(id, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid ?? "anonymous";
      const { title } = req.body;
      const sanitizedTitle = typeof title === "string"
        ? title.trim().slice(0, MAX_TITLE_LENGTH) || "New Chat"
        : "New Chat";
      const conversation = await chatStorage.createConversation(sanitizedTitle, userId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      const userId = req.user?.uid ?? "anonymous";
      await chatStorage.deleteConversation(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = parseIdParam(req.params.id);
      if (conversationId === null) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const { content } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }
      if (content.length > MAX_CHAT_INPUT_LENGTH) {
        return res.status(400).json({
          error: `Message too long. Maximum ${MAX_CHAT_INPUT_LENGTH} characters.`,
        });
      }

      const userId = req.user?.uid ?? "anonymous";
      const conversation = await chatStorage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const openai = getOpenAIClient();
      if (!openai) {
        return res.status(503).json({ error: "Chat is not configured" });
      }

      const safeContent = sanitizeChatInput(content);
      await chatStorage.createMessage(conversationId, "user", safeContent);

      const allMessages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = buildChildSafeChatMessages(allMessages);
      const completion = await openai.chat.completions.create({
        model: CHAT_TEXT_MODEL,
        messages: chatMessages,
        max_completion_tokens: 1_000,
      });

      const rawResponse = completion.choices[0]?.message?.content ?? "";
      const approved = approveChatResponse(rawResponse);
      if (approved.outcome === "fallback") {
        console.warn("Text chat response blocked by output safety", {
          categories: approved.verdict.categories,
          conversationId,
        });
      }
      await chatStorage.createMessage(conversationId, "assistant", approved.text);

      // Keep the existing SSE response shape but emit only after the full response
      // has passed moderation. A single content chunk remains compatible with the UI.
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ content: approved.text })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, safetyOutcome: approved.outcome })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
