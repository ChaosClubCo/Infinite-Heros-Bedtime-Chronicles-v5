import type { Express } from "express";
import { StoryRequestSchema } from "../validation";
import { getStorySystemPrompt, getStoryUserPrompt, getPartCount, getWordCount, STORY_RESPONSE_SCHEMA, buildStricterSystemPrompt } from "../prompts";
import { classifyError, createErrorResponse } from "../utils";
import { IdempotencyCache } from "../idempotency";
import { extractFirstJson } from "../ai/json";
import { isFeatureEnabled } from "../feature-flags";
import { guardStory } from "../safety/story-guard";
import { aiRouter, idempotencyCache } from "./context";
import { rateLimited, sendRouteError } from "./helpers";

/**
 * Normalize a parsed AI response into the wire story shape: coerce part text,
 * strip choices in sleep mode, drop the final part's choices otherwise, and
 * re-index parts. Throws if the response is not a usable story object.
 */
function mapStoryStructure(parsedJson: unknown, mode: string): Record<string, unknown> {
  if (!parsedJson || typeof parsedJson !== "object") {
    throw new Error("Invalid story response");
  }
  const story = parsedJson as Record<string, unknown>;
  if (!story.parts || !Array.isArray(story.parts)) {
    throw new Error("Invalid story structure");
  }
  story.parts = (story.parts as { text?: string; choices?: string[] }[]).map((part, i) => ({
    text: part.text || "",
    choices: mode === "sleep" ? undefined : (part.choices || undefined),
    partIndex: i,
  }));
  if ((story.parts as unknown[]).length > 0 && mode !== "sleep") {
    delete (story.parts as Record<string, unknown>[])[(story.parts as unknown[]).length - 1].choices;
  }
  return story;
}

/**
 * Run the freshly generated story through the safety guard: moderate, regenerate
 * once with a stricter prompt on a block, then fall back to a known-safe story.
 * A no-op passthrough when the content-safety flag is disabled.
 */
async function applySafetyGuard(
  story: Record<string, unknown>,
  params: { mode: string; partCount: number; userPrompt: string; requestId?: string; log?: { warn(o: object, m?: string): void; info(o: object, m?: string): void } },
): Promise<Record<string, unknown>> {
  if (!isFeatureEnabled("contentSafetyEnabled")) return story;
  const { mode, partCount, userPrompt, requestId, log } = params;

  const result = await guardStory({
    story,
    mode,
    strict: isFeatureEnabled("contentSafetyStrict"),
    regenerate: async (flaggedCategories) => {
      const strictSystem = buildStricterSystemPrompt(mode, partCount, flaggedCategories);
      const retry = await aiRouter.generateText("story", {
        systemPrompt: strictSystem,
        userPrompt,
        // Lower temperature on the retry to keep it firmly inside the rules.
        temperature: mode === "sleep" ? 0.5 : 0.6,
        maxTokens: 8192,
        jsonMode: true,
        responseSchema: STORY_RESPONSE_SCHEMA,
        timeoutMs: 60_000,
        requestId,
      });
      return mapStoryStructure(retry.parsedJson, mode);
    },
    log,
    requestId,
  });
  return result.story;
}

export function registerStoryRoutes(app: Express): void {
  app.post("/api/generate-story", rateLimited(), async (req, res) => {
    const parsed = StoryRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, heroTitle, heroPower, heroDescription, duration, mode, madlibWords, soundscape, setting, tone, childName, sidekick, problem } = parsed.data;

    // Bind the idempotency key to the caller so identical bodies from different
    // users never collide on a shared cached generation.
    const idempotencyKey = IdempotencyCache.keyFromBody({ ...parsed.data, _uid: req.user?.uid ?? 'anon' });
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

      const story = mapStoryStructure(aiResponse.parsedJson, mode);

      // Server-authoritative safety gate: moderate → regenerate once → fallback.
      // Runs inside this IIFE so the guarded (safe) story is what the
      // idempotency cache stores — an unsafe payload is never cached or served.
      return await applySafetyGuard(story, { mode, partCount, userPrompt, requestId: req.requestId, log: req.log });
    })();

    idempotencyCache.set(idempotencyKey, generationPromise);

    try {
      const story = await generationPromise;
      res.json(story);
    } catch (error: unknown) {
      idempotencyCache.delete(idempotencyKey);
      sendRouteError(req, res, error, 'story generation failed', 'Failed to generate story');
    }
  });

  app.post("/api/generate-story-stream", rateLimited(), async (req, res) => {
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

      // When content safety is on, the stream cannot be judged mid-flight, so we
      // buffer the tokens server-side and emit the story only after moderation
      // (a `complete` event instead of per-token `chunk`s). This defers — but
      // never forwards — unmoderated text. When safety is off, the legacy
      // token-by-token passthrough is preserved.
      const safetyOn = isFeatureEnabled("contentSafetyEnabled");
      let providerInfo = "";
      let buffered = "";
      for await (const chunk of stream) {
        if (!providerInfo) {
          providerInfo = `${chunk.provider}`;
          res.write(`data: ${JSON.stringify({ type: "provider", provider: chunk.provider, model: chunk.model })}\n\n`);
        }
        if (chunk.done) {
          if (!safetyOn) res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        } else if (safetyOn) {
          buffered += chunk.text;
        } else {
          res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk.text })}\n\n`);
        }
      }

      if (safetyOn) {
        const cleaned = buffered.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "");
        const jsonStr = extractFirstJson(cleaned);
        if (!jsonStr) throw new Error("Invalid story response");
        const story = mapStoryStructure(JSON.parse(jsonStr), mode);
        const safeStory = await applySafetyGuard(story, { mode, partCount, userPrompt, requestId: req.requestId, log: req.log });
        res.write(`data: ${JSON.stringify({ type: "complete", story: safeStory })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      }

      req.log?.info({ provider: providerInfo }, 'story stream completed');
      res.end();
    } catch (error: unknown) {
      // SSE: once headers are sent the error must go down the open stream,
      // so this handler cannot use sendRouteError.
      req.log?.error({ err: error }, 'story streaming failed');
      const kind = classifyError(error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to generate story", retryable: kind === 'transient' })}\n\n`);
        res.end();
      } else {
        // res.json() only sets Content-Type when unset, so the "text/event-stream"
        // header set above must be overridden or this JSON error body gets served
        // mislabeled as an SSE stream (see the same fix in routes/video.ts).
        res.status(kind === 'transient' ? 503 : 500).set("Content-Type", "application/json").json(createErrorResponse('Failed to generate story', kind));
      }
    }
  });
}
