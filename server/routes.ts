import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { generateSpeech, VOICE_MAP, MODE_DEFAULT_VOICES, getVoicesForMode } from "./elevenlabs";
import { getMusicFilePath, getMusicTrackCount } from "./suno";
import { createVideoJob, getVideoJob, getVideoFilePath, isVideoAvailable } from "./video";
import { getAIRouter, getProviderStatuses, logProviderStatus } from "./ai";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { requireAuth } from "./auth";
import { sanitizeString, StoryRequestSchema, AvatarRequestSchema, SceneRequestSchema, TtsRequestSchema, VideoRequestSchema, SuggestSettingsRequestSchema, VALID_MODES, VALID_DURATIONS } from "./validation";
import { getStorySystemPrompt, getStoryUserPrompt, getPartCount, getWordCount, getRandomStyle, STORY_RESPONSE_SCHEMA } from "./prompts";
import { checkRateLimit, cleanupExpiredEntries } from "./rate-limit";
import { toErrorMessage, classifyError, createErrorResponse } from "./utils";
import { getFeatureFlags, isFeatureEnabled } from "./feature-flags";
import { logger } from "./logger";
import { getMetrics } from "./metrics";
import { getActiveRequests } from "./load-shedding";
import { IdempotencyCache } from "./idempotency";
import { TtsCacheManager } from "./tts-cache";
import { registerImageRoutes } from "./replit_integrations/image";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ttsCacheManager = new TtsCacheManager({
  cacheDir: path.resolve("/tmp/tts-cache"),
  maxAgeMs: parseInt(process.env.TTS_CACHE_MAX_AGE_MS || String(24 * 60 * 60 * 1000), 10),
  maxSizeBytes: parseInt(process.env.TTS_CACHE_MAX_SIZE_BYTES || String(500 * 1024 * 1024), 10),
});
ttsCacheManager.ensureDir();

const TTS_CACHE_DIR = ttsCacheManager.cacheDir;

setInterval(async () => {
  const { removedCount, freedBytes } = await ttsCacheManager.cleanup();
  if (removedCount > 0) {
    logger.info({ removedCount, freedBytes }, 'TTS cache cleanup');
  }
}, 60 * 60 * 1000);
ttsCacheManager.cleanup();

// Rate limit cleanup runs every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

const aiRouter = getAIRouter();
const idempotencyCache = new IdempotencyCache({ ttlMs: 5 * 60 * 1000, maxEntries: 200 });

export async function registerRoutes(app: Express): Promise<Server> {
  logProviderStatus();

  // Apply auth middleware to all POST /api/* endpoints
  app.use('/api', async (req, res, next) => {
    // Skip auth for GET endpoints (health, voices, etc.)
    if (req.method === 'GET') return next();
    return requireAuth(req, res, next);
  });

  app.get("/api/metrics", (_req, res) => {
    res.json(getMetrics());
  });

  app.get("/api/health", (_req, res) => {
    const providers = getProviderStatuses();
    const aiAvailable = providers.some((p) => p.available && p.capabilities.text);
    const ttsAvailable = !!process.env.ELEVENLABS_API_KEY;
    res.json({
      status: "ok",
      timestamp: Date.now(),
      aiProvidersAvailable: aiAvailable,
      ttsAvailable,
      features: getFeatureFlags(),
      activeRequests: getActiveRequests(),
    });
  });

  app.get("/privacy", (_req, res) => {
    const privacyPath = path.resolve(process.cwd(), "server", "templates", "privacy-policy.html");
    res.sendFile(privacyPath, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: "Privacy policy not found" });
      }
    });
  });

  app.get("/api/ai-providers", (_req, res) => {
    res.json({ providers: getProviderStatuses() });
  });

  app.post("/api/generate-story", async (req, res) => {
    const clientIp = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    const parsed = StoryRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, heroTitle, heroPower, heroDescription, duration, mode, madlibWords, soundscape, setting, tone, childName, sidekick, problem } = parsed.data;

    const idempotencyKey = IdempotencyCache.keyFromBody(parsed.data);
    const cached = idempotencyCache.get(idempotencyKey);
    if (cached) {
      req.log?.info('story request deduplicated (idempotency hit)');
      const result = await cached;
      return res.json(result);
    }

    const generationPromise = (async () => {
      const partCount = getPartCount(duration);
      const wordCount = getWordCount(duration);

      const systemPrompt = getStorySystemPrompt(mode, partCount);
      const userPrompt = getStoryUserPrompt(mode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords, soundscape, setting, tone, childName, sidekick, problem);

      const aiResponse = await aiRouter.generateText("story", {
        systemPrompt,
        userPrompt,
        temperature: mode === "sleep" ? 0.7 : 0.9,
        maxTokens: 8192,
        jsonMode: true,
        responseSchema: STORY_RESPONSE_SCHEMA,
        timeoutMs: 60_000,
        requestId: req.requestId,
      });

      if (!aiResponse.parsedJson) {
        throw new Error("Invalid story response");
      }

      req.log?.info({ provider: aiResponse.provider, model: aiResponse.model }, 'story generated');

      const story = aiResponse.parsedJson as Record<string, unknown>;

      if (!story.parts || !Array.isArray(story.parts)) {
        throw new Error("Invalid story structure");
      }

      story.parts = (story.parts as Array<{ text?: string; choices?: string[] }>).map((part, i) => ({
        text: part.text || "",
        choices: mode === "sleep" ? undefined : (part.choices || undefined),
        partIndex: i,
      }));

      if ((story.parts as unknown[]).length > 0 && mode !== "sleep") {
        delete (story.parts as Record<string, unknown>[])[(story.parts as unknown[]).length - 1].choices;
      }

      return story;
    })();

    idempotencyCache.set(idempotencyKey, generationPromise);

    try {
      const story = await generationPromise;
      res.json(story);
    } catch (error: unknown) {
      idempotencyCache.delete(idempotencyKey);
      req.log?.error({ err: error }, 'story generation failed');
      const kind = classifyError(error);
      res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to generate story', kind));
    }
  });

  app.post("/api/generate-story-stream", async (req, res) => {
    const clientIp = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    const parsed = StoryRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, heroTitle, heroPower, heroDescription, duration, mode, madlibWords, soundscape, setting, tone, childName, sidekick, problem } = parsed.data;

    try {
      const partCount = getPartCount(duration);
      const wordCount = getWordCount(duration);

      const systemPrompt = getStorySystemPrompt(mode, partCount);
      const userPrompt = getStoryUserPrompt(mode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords, soundscape, setting, tone, childName, sidekick, problem);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = aiRouter.generateTextStream("story", {
        systemPrompt,
        userPrompt,
        temperature: mode === "sleep" ? 0.7 : 0.9,
        maxTokens: 8192,
      });

      let providerInfo = "";
      for await (const chunk of stream) {
        if (!providerInfo) {
          providerInfo = `${chunk.provider}`;
          res.write(`data: ${JSON.stringify({ type: "provider", provider: chunk.provider, model: chunk.model })}\n\n`);
        }
        if (chunk.done) {
          res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk.text })}\n\n`);
        }
      }

      req.log?.info({ provider: providerInfo }, 'story stream completed');
      res.end();
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'story streaming failed');
      const kind = classifyError(error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to generate story", retryable: kind === 'transient' })}\n\n`);
        res.end();
      } else {
        res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to generate story', kind));
      }
    }
  });

  app.post("/api/generate-avatar", async (req, res) => {
    const clientIp = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    const parsed = AvatarRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, heroTitle, heroPower, heroDescription } = parsed.data;

    try {
      const artStyle = getRandomStyle();
      const prompt = `A children's book illustration portrait of a superhero named "${heroName}" who is "${heroTitle}" with the power of "${heroPower}". ${heroDescription}.
Style: ${artStyle}. Close-up friendly portrait, expressive eyes, child-safe content, suitable for ages 3-9. No scary elements, no weapons. Circular portrait composition with a cosmic/starry background.`;

      const result = await aiRouter.generateImage("avatar", { prompt });
      req.log?.info({ provider: result.provider, model: result.model }, 'avatar generated');
      return res.json({ image: result.imageDataUri });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'avatar generation failed');
      const kind = classifyError(error);
      res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to generate avatar', kind));
    }
  });

  app.post("/api/generate-scene", async (req, res) => {
    const clientIp = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    const parsed = SceneRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, sceneText, heroDescription } = parsed.data;

    try {
      const summary = sceneText.substring(0, 300);
      const sceneStyle = getRandomStyle();
      const prompt = `Children's storybook scene illustration for a bedtime story. The hero is "${heroName}": ${heroDescription?.substring(0, 100) || ""}.
Scene: ${summary}
Style: ${sceneStyle}. Wide landscape composition, magical atmosphere, child-safe content, suitable for ages 3-9. No scary elements. Warm, cozy, wonder-filled.`;

      const result = await aiRouter.generateImage("scene", { prompt });
      req.log?.info({ provider: result.provider, model: result.model }, 'scene generated');
      return res.json({ image: result.imageDataUri });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'scene generation failed');
      const kind = classifyError(error);
      res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to generate scene', kind));
    }
  });

  app.post("/api/tts", async (req, res) => {
    const clientIp = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    const parsed = TtsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { text, voice: voiceKey, mode: storyMode } = parsed.data;

    try {
      const hash = crypto.createHash("md5").update(`${voiceKey}:${storyMode || ""}:${text}`).digest("hex");
      const fileName = `${hash}.mp3`;
      const filePath = path.join(TTS_CACHE_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        const audioBuffer = await generateSpeech(text, voiceKey, storyMode);
        fs.writeFileSync(filePath, audioBuffer);
      }

      res.json({ audioUrl: `/api/tts-audio/${fileName}` });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'TTS generation failed');
      const kind = classifyError(error);
      res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to generate speech', kind));
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

  app.get("/api/music/:mode", (req, res) => {
    const mode = sanitizeString(req.params.mode, 20);
    if (!(VALID_MODES as readonly string[]).includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    // Parse optional track index from query param (for cycling through multiple tracks)
    const trackParam = req.query.track;
    const trackIndex = trackParam !== undefined ? parseInt(String(trackParam), 10) : undefined;
    const resolvedTrackIndex = trackIndex !== undefined && !isNaN(trackIndex) ? trackIndex : undefined;
    const filePath = getMusicFilePath(mode, resolvedTrackIndex);
    // Use a short cache so different sessions can receive different random tracks
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.sendFile(filePath, (err) => {
      if (err) {
        logger.error({ err }, 'music file error');
        if (!res.headersSent) {
          res.status(404).json({ error: "Music file not found" });
        }
      }
    });
  });

  app.get("/api/music-info/:mode", (req, res) => {
    const mode = sanitizeString(req.params.mode, 20);
    if (!(VALID_MODES as readonly string[]).includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    res.json({ trackCount: getMusicTrackCount(mode) });
  });

  app.post("/api/suggest-settings", async (req, res) => {
    const clientIp = req.user?.uid || req.ip || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const parsed = SuggestSettingsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, heroPower, heroDescription, hour, childAge, childName } = parsed.data;

    try {
      const timeOfDay = hour >= 19 || hour < 6 ? "nighttime/bedtime" : hour >= 17 ? "evening" : hour >= 12 ? "afternoon" : "morning";

      const voiceKeys = Object.keys(VOICE_MAP);
      const sleepVoices = getVoicesForMode("sleep").join(", ");
      const classicVoices = getVoicesForMode("classic").join(", ");
      const funVoices = getVoicesForMode("madlibs").join(", ");

      const ageContext = childAge ? ` Child age: ${childAge} years old.${childAge <= 5 ? " For younger kids, prefer shorter, gentler stories with sleep mode." : " For older kids, classic and madlibs modes with longer stories work great."}` : "";
      const nameContext = childName ? ` Child name: ${childName}.` : "";

      const userPrompt = `Suggest bedtime story settings as JSON. Time: ${timeOfDay}.${ageContext}${nameContext} Hero: ${heroName} (${heroPower}). Modes: classic, madlibs, sleep. Durations: short, medium-short, medium, long, epic. Speeds: gentle, medium, normal. Voice categories - Sleep voices: ${sleepVoices}. Classic voices: ${classicVoices}. Fun/madlibs voices: ${funVoices}. IMPORTANT: Match voice to mode (sleep voices for sleep, classic voices for classic, fun voices for madlibs). Night=sleep+gentle+short. Afternoon=classic/madlibs+medium/normal. Reply ONLY with: {"mode":"...","duration":"...","speed":"...","voice":"...","tip":"short parent-friendly reason"}`;

      const aiResponse = await aiRouter.generateText("suggestion", {
        systemPrompt: "You are a helpful assistant that suggests bedtime story settings. Respond with valid JSON only.",
        userPrompt,
        temperature: 0.7,
        maxTokens: 2048,
        thinkingBudget: 0,
      });

      req.log?.info({ provider: aiResponse.provider, model: aiResponse.model }, 'suggestion generated');

      let text = aiResponse.text?.trim() || "";
      text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        req.log?.error('suggest-settings: no JSON in AI response');
        return res.status(500).json({ error: "Invalid AI response" });
      }

      const suggestion = JSON.parse(jsonMatch[0]);

      if (!(VALID_MODES as readonly string[]).includes(suggestion.mode)) suggestion.mode = "classic";
      if (!(VALID_DURATIONS as readonly string[]).includes(suggestion.duration)) suggestion.duration = "medium";
      if (!["gentle", "medium", "normal"].includes(suggestion.speed)) suggestion.speed = "medium";
      if (!voiceKeys.includes(suggestion.voice)) suggestion.voice = MODE_DEFAULT_VOICES[suggestion.mode] || "moonbeam";
      if (typeof suggestion.tip !== "string") suggestion.tip = "A great story awaits!";
      suggestion.tip = suggestion.tip.slice(0, 120);

      res.json(suggestion);
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'suggest settings failed');
      const kind = classifyError(error);
      res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to generate suggestion', kind));
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

  app.get("/api/video-available", (_req, res) => {
    if (!isFeatureEnabled('videoEnabled')) {
      return res.json({ available: false });
    }
    res.json({ available: isVideoAvailable() });
  });

  app.post("/api/generate-video", async (req, res) => {
    if (!isFeatureEnabled('videoEnabled')) {
      return res.status(404).json({ error: "Video generation is not available" });
    }
    const clientIp = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    const parsed = VideoRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { sceneText, heroName, heroDescription } = parsed.data;

    try {
      const result = await createVideoJob(sceneText, heroName, heroDescription);
      if ("error" in result) {
        return res.status(503).json({ error: result.error });
      }

      res.json({ jobId: result.jobId });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'video generation failed');
      const kind = classifyError(error);
      res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to start video generation', kind));
    }
  });

  app.get("/api/video-status/:id", (req, res) => {
    const jobId = sanitizeString(req.params.id, 32);
    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    const job = getVideoJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Video job not found" });
    }

    res.json({
      status: job.status,
      progress: job.progress,
      error: job.error,
      videoUrl: job.status === "completed" ? `/api/video/${jobId}` : undefined,
    });
  });

  app.get("/api/video/:id", (req, res) => {
    const jobId = req.params.id;
    if (!jobId || !/^[a-f0-9]+$/.test(jobId)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const filePath = getVideoFilePath(jobId);
    if (!filePath) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: "Failed to serve video" });
      }
    });
  });

  app.post("/api/tts-preview", async (req, res) => {
    const clientIp = req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests" });
    }

    try {
      const voiceKey = sanitizeString(req.body.voice || "moonbeam", 20).toLowerCase();
      const voiceInfo = VOICE_MAP[voiceKey];
      if (!voiceInfo) {
        return res.status(400).json({ error: "Invalid voice" });
      }

      const previewText = voiceInfo.previewText;
      const hash = crypto.createHash("md5").update(`preview:${voiceKey}:${previewText}`).digest("hex");
      const fileName = `${hash}.mp3`;
      const filePath = path.join(TTS_CACHE_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        const audioBuffer = await generateSpeech(previewText, voiceKey);
        fs.writeFileSync(filePath, audioBuffer);
      }

      res.json({ audioUrl: `/api/tts-audio/${fileName}` });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'TTS preview failed');
      const kind = classifyError(error);
      res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse('Failed to generate preview', kind));
    }
  });

  // Register voice chat & conversation routes (replit_integrations)
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.DATABASE_URL && isFeatureEnabled('voiceChatEnabled')) {
    registerAudioRoutes(app);
    logger.info('voice chat & conversation routes registered');
  }

  // Register Gemini direct image generation route (replit_integrations)
  if (process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
    registerImageRoutes(app);
    console.log("[Routes] Gemini image generation route registered");
  }

  const httpServer = createServer(app);
  return httpServer;
}
