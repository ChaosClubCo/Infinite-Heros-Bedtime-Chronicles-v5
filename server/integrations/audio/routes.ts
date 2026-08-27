import express, { type Express, type Request, type Response } from "express";
import { requireAuth } from "../../auth";
import { getVoiceChatTranscriptCutoff } from "../../compliance";
import { approveChatResponse, buildChildSafeChatMessages, sanitizeChatInput } from "../../safety/chat-safety";
import { chatStorage } from "../chat/storage";
import { openai, speechToText, ensureCompatibleFormat } from "./client";

const audioBodyParser = express.json({ limit: "50mb" });
const MAX_TITLE_LENGTH = 200;
const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;
const VOICE_CHAT_TEXT_MODEL = process.env.VOICE_CHAT_TEXT_MODEL?.trim() || "gpt-4o-mini";

function parseIdParam(raw: string | string[]): number | null {
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return null;
  const id = Number.parseInt(str, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
function authenticatedUserId(req: Request): string {
  if (!req.user?.uid) throw new Error("Authenticated user missing after auth middleware");
  return req.user.uid;
}
async function pruneExpiredTranscripts(userId: string): Promise<void> {
  const cutoff = getVoiceChatTranscriptCutoff();
  if (!cutoff) throw new Error("Voice Chat transcript retention is not configured");
  await chatStorage.deleteExpiredMessagesForUser(userId, cutoff);
}

export function registerAudioRoutes(app: Express): void {
  app.get("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = authenticatedUserId(req);
      await pruneExpiredTranscripts(userId);
      const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit), 10) || 50, 1), 200);
      const offset = Math.max(Number.parseInt(String(req.query.offset), 10) || 0, 0);
      const conversations = await chatStorage.getAllConversations(userId);
      res.json({ data: conversations.slice(offset, offset + limit), total: conversations.length, limit, offset });
    } catch (error) { console.error("Error fetching conversations:", error); res.status(500).json({ error: "Failed to fetch conversations" }); }
  });

  app.get("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ error: "Invalid conversation ID" });
      const userId = authenticatedUserId(req);
      await pruneExpiredTranscripts(userId);
      const conversation = await chatStorage.getConversation(id, userId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      res.json({ ...conversation, messages: await chatStorage.getMessagesByConversation(id) });
    } catch (error) { console.error("Error fetching conversation:", error); res.status(500).json({ error: "Failed to fetch conversation" }); }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const userId = authenticatedUserId(req);
      await pruneExpiredTranscripts(userId);
      const { title } = req.body;
      const sanitizedTitle = typeof title === "string" ? title.trim().slice(0, MAX_TITLE_LENGTH) || "New Chat" : "New Chat";
      res.status(201).json(await chatStorage.createConversation(sanitizedTitle, userId));
    } catch (error) { console.error("Error creating conversation:", error); res.status(500).json({ error: "Failed to create conversation" }); }
  });

  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (id === null) return res.status(400).json({ error: "Invalid conversation ID" });
      await chatStorage.deleteConversation(id, authenticatedUserId(req));
      res.status(204).send();
    } catch (error) { console.error("Error deleting conversation:", error); res.status(500).json({ error: "Failed to delete conversation" }); }
  });

  app.post("/api/conversations/:id/messages", audioBodyParser, async (req: Request, res: Response) => {
    try {
      const conversationId = parseIdParam(req.params.id);
      if (conversationId === null) return res.status(400).json({ error: "Invalid conversation ID" });
      const userId = authenticatedUserId(req);
      await pruneExpiredTranscripts(userId);
      const conversation = await chatStorage.getConversation(conversationId, userId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      const { audio } = req.body;
      if (!audio || typeof audio !== "string") return res.status(400).json({ error: "Audio data (base64 string) is required" });
      if (Math.ceil(audio.length * 0.75) > MAX_AUDIO_SIZE_BYTES) return res.status(400).json({ error: "Audio data too large. Maximum 25MB." });
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);
      const userTranscript = sanitizeChatInput(await speechToText(audioBuffer, inputFormat));
      if (!userTranscript) return res.status(400).json({ error: "No usable speech was detected" });
      await chatStorage.createMessage(conversationId, "user", userTranscript);
      const chatHistory = buildChildSafeChatMessages(await chatStorage.getMessagesByConversation(conversationId));
      const completion = await openai.chat.completions.create({ model: VOICE_CHAT_TEXT_MODEL, messages: chatHistory, max_completion_tokens: 1_000 });
      const approved = approveChatResponse(completion.choices[0]?.message?.content ?? "");
      if (approved.outcome === "fallback") console.warn("Voice chat response blocked by output safety", { categories: approved.verdict.categories, conversationId });
      await chatStorage.createMessage(conversationId, "assistant", approved.text);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "transcript", data: approved.text })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "done", transcript: approved.text, safetyOutcome: approved.outcome })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing voice message:", error);
      if (res.headersSent) { res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice message" })}\n\n`); res.end(); }
      else res.status(500).json({ error: "Failed to process voice message" });
    }
  });
}
