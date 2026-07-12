import type { Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { generateSpeech, VOICE_MAP, MODE_DEFAULT_VOICES } from "../elevenlabs";
import { TtsPreviewRequestSchema, TtsRequestSchema } from "../validation";
import { recordTTS } from "../metrics";
import { TTS_CACHE_DIR } from "./context";
import { rateLimited, sendRouteError, ttsCachePathFor } from "./helpers";

// De-duplicates concurrent writes to the same cache file. Without this, two
// simultaneous requests for identical audio could both miss the existence
// check and race to write the same path, truncating each other's output.
const _ttsWriteLock = new Map<string, Promise<void>>();

async function writeWithLock(filePath: string, data: Buffer): Promise<void> {
  const inflight = _ttsWriteLock.get(filePath);
  if (inflight) return inflight;
  const p = fs.promises
    .writeFile(filePath, data)
    .finally(() => _ttsWriteLock.delete(filePath));
  _ttsWriteLock.set(filePath, p);
  return p;
}

async function fileExists(filePath: string): Promise<boolean> {
  return fs.promises.access(filePath).then(() => true).catch(() => false);
}

export function registerTtsRoutes(app: Express): void {
  app.post("/api/tts", rateLimited(), async (req, res) => {
    const parsed = TtsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { text, voice: voiceKey, mode: storyMode } = parsed.data;
    let cacheHit = false;

    try {
      const { fileName, filePath } = ttsCachePathFor(`${voiceKey}:${storyMode || ""}:${text}`);

      cacheHit = await fileExists(filePath);
      if (!cacheHit) {
        const audioBuffer = await generateSpeech(text, voiceKey, storyMode);
        await writeWithLock(filePath, audioBuffer);
      }

      recordTTS(cacheHit, true);
      res.json({ audioUrl: `/api/tts-audio/${fileName}` });
    } catch (error: unknown) {
      recordTTS(cacheHit, false);
      sendRouteError(req, res, error, 'TTS generation failed', 'Failed to generate speech');
    }
  });

  app.get("/api/tts-audio/:file", (req, res) => {
    const fileName = req.params.file;
    if (!fileName || !/^[a-f0-9]+\.mp3$/.test(fileName)) {
      return res.status(400).json({ error: "Invalid file name" });
    }

    const filePath = path.join(TTS_CACHE_DIR, fileName);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(TTS_CACHE_DIR)) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: "Audio not found" });
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(resolved);
  });

  app.post("/api/tts-preview", rateLimited("Too many requests"), async (req, res) => {
    const parsed = TtsPreviewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    let cacheHit = false;

    try {
      const voiceKey = parsed.data.voice;
      const voiceInfo = VOICE_MAP[voiceKey];
      if (!voiceInfo) {
        return res.status(400).json({ error: "Invalid voice" });
      }

      const previewText = voiceInfo.previewText;
      const { fileName, filePath } = ttsCachePathFor(`preview:${voiceKey}:${previewText}`);

      cacheHit = await fileExists(filePath);
      if (!cacheHit) {
        const audioBuffer = await generateSpeech(previewText, voiceKey);
        await writeWithLock(filePath, audioBuffer);
      }

      recordTTS(cacheHit, true);
      res.json({ audioUrl: `/api/tts-audio/${fileName}` });
    } catch (error: unknown) {
      recordTTS(cacheHit, false);
      sendRouteError(req, res, error, 'TTS preview failed', 'Failed to generate preview');
    }
  });

  app.get("/api/voices", (_req, res) => {
    const voices = Object.entries(VOICE_MAP).map(([key, val]) => ({
      id: key,
      name: val.name,
      characterName: val.characterName,
      description: val.description,
      accent: val.accent,
      personality: val.personality,
      category: val.category,
    }));
    res.json({ voices, defaults: MODE_DEFAULT_VOICES });
  });
}
