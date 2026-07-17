import express, { type Express, type Request, type Response } from "express";
import { getVoiceChatTranscriptCutoff } from "../../compliance";
import {
  approveChatResponse,
  buildChildSafeChatMessages,
  sanitizeChatInput,
} from "../../safety/chat-safety";
import { chatStorage } from "../chat/storage";
import { openai, speechToText, ensureCompatibleFormat } from "./client";

// Body parser with 50MB limit for audio payloads. The decoded payload is still
// rejected above 25MB before it is passed to a provider.
const audioBodyParser = express.json({ limit: "50mb" });

const MAX_TITLE_LENGTH = 200;
const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;
const VOICE_CHAT_TEXT_MODEL = process.env.VOICE_CHAT_TEXT_MODEL?.trim() || "gpt-4o-mini";

function parseIdParam(raw: string | string[]): number | null {
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return null;
  const id = parseInt(str, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Enforce the configured transcript TTL before any chat history is read or used
 * as model context. Production route registration already requires a valid
 * retention value, so a null cutoff is treated as a configuration failure.
 */
async function pruneExpiredTranscripts(userId: string): Promise<void> {
  const cutoff = getVoiceChatTranscriptCutoff();
  if (!cutoff) {
    throw new Error("Voice Chat transcript retention is not configured");
  }
  await chatStorage.deleteExpiredMessagesForUser(userId, cutoff);
}

export function registerAudioRoutes(app: Express): void {
  // Get all conversations (with optional pagination) — scoped to the requesting user.
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid ?? "anonymous";
      await pruneExpiredTranscripts(userId);
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

  // Get single conversation with messages — returns 404 if not owned by requester.
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      const userId = req.user?.uid ?? "anonymous";
      await pruneExpiredTranscripts(userId);
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

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid ?? "anonymous";
      await pruneExpiredTranscripts(userId);
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

  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
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

  /**
   * Voice chat safety order:
   *   1. Purge transcripts older than the approved retention window.
   *   2. Transcribe audio. The raw recording is never persisted by this server.
   *   3. Sanitize and persist only the bounded transcript.
   *   4. Generate a complete text response with the child policy re-asserted and
   *      history bounded to the latest turns.
   *   5. Moderate the complete response and replace unsafe output with a known-safe
   *      fallback before sending or storing anything child-facing.
   *   6. Return approved text. The client invokes the existing TTS route only after
   *      it receives this approved transcript, so unsafe model audio is never streamed.
   */
  app.post("/api/conversations/:id/messages", audioBodyParser, async (req: Request, res: Response) => {
    try {
      const conversationId = parseIdParam(req.params.id);
      if (conversationId === null) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const userId = req.user?.uid ?? "anonymous";
      await pruneExpiredTranscripts(userId);
      const conversation = await chatStorage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const { audio } = req.body;
      if (!audio || typeof audio !== "string") {
        return res.status(400).json({ error: "Audio data (base64 string) is required" });
      }

      const estimatedSize = Math.ceil(audio.length * 0.75);
      if (estimatedSize > MAX_AUDIO_SIZE_BYTES) {
        return res.status(400).json({ error: "Audio data too large. Maximum 25MB." });
      }

      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);
      const rawTranscript = await speechToText(audioBuffer, inputFormat);
      const userTranscript = sanitizeChatInput(rawTranscript);
      if (!userTranscript) {
        return res.status(400).json({ error: "No usable speech was detected" });
      }

      await chatStorage.createMessage(conversationId, "user", userTranscript);

      const existingMessages = await chatStorage.getMessagesByConversation(conversationId);
      const chatHistory = buildChildSafeChatMessages(existingMessages);
      const completion = await openai.chat.completions.create({
        model: VOICE_CHAT_TEXT_MODEL,
        messages: chatHistory,
        max_completion_tokens: 1_000,
      });

      const rawAssistant = completion.choices[0]?.message?.content ?? "";
      const approved = approveChatResponse(rawAssistant);
      if (approved.outcome === "fallback") {
        console.warn("Voice chat response blocked by output safety", {
          categories: approved.verdict.categories,
          conversationId,
        });
      }

      await chatStorage.createMessage(conversationId, "assistant", approved.text);

      // Preserve the existing SSE envelope. A single complete transcript event is
      // intentional: no child-facing bytes are emitted until moderation succeeds.
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "transcript", data: approved.text })}\n\n`);
      res.write(`data: ${JSON.stringify({
        type: "done",
        transcript: approved.text,
        safetyOutcome: approved.outcome,
      })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing voice message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process voice message" });
      }
    }
  });
}
