import type { Express } from "express";
import { StoryRequestSchema } from "../validation";
import { getStorySystemPrompt, getStoryUserPrompt, getPartCount, getWordCount, STORY_RESPONSE_SCHEMA } from "../prompts";
import { classifyError, createErrorResponse, parsePositiveIntEnv } from "../utils";
import { IdempotencyCache } from "../idempotency";
import { estimateCostUsd, reportCostAnomaly } from "../ai/cost";
import { aiRouter, idempotencyCache } from "./context";
import { rateLimited, sendRouteError } from "./helpers";

// Per-call token ceiling — configurable so a runaway generation can be capped
// without a code change (cost guard). Invalid env values fall back to the default.
const STORY_MAX_TOKENS = parsePositiveIntEnv(process.env.STORY_MAX_TOKENS, 8192);

export function registerStoryRoutes(app: Express): void {
  app.post("/api/generate-story", rateLimited(), async (req, res) => {
    const parsed = StoryRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, heroTitle, heroPower, heroDescription, duration, mode, madlibWords, soundscape, setting, tone, childName, sidekick, problem, customPrompt } = parsed.data;

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
      const userPrompt = getStoryUserPrompt(mode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords, soundscape, setting, tone, childName, sidekick, problem, customPrompt);

      const aiResponse = await aiRouter.generateText("story", {
        systemPrompt,
        userPrompt,
        temperature: mode === "sleep" ? 0.7 : 0.9,
        maxTokens: STORY_MAX_TOKENS,
        jsonMode: true,
        responseSchema: STORY_RESPONSE_SCHEMA,
        timeoutMs: 60_000,
        requestId: req.requestId,
      });

      if (!aiResponse.parsedJson) {
        throw new Error("Invalid story response");
      }

      // Cost signal: emit tokens + estimated USD per generation, and alert
      // Sentry when a single generation is anomalously expensive.
      const estCostUsd = estimateCostUsd(aiResponse.provider, aiResponse.usage);
      req.log?.info({
        provider: aiResponse.provider,
        model: aiResponse.model,
        inputTokens: aiResponse.usage?.inputTokens,
        outputTokens: aiResponse.usage?.outputTokens,
        estCostUsd,
      }, 'story generated');
      reportCostAnomaly(estCostUsd, { provider: aiResponse.provider, endpoint: '/api/generate-story' });

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
      sendRouteError(req, res, error, 'story generation failed', 'Failed to generate story');
    }
  });

  app.post("/api/generate-story-stream", rateLimited(), async (req, res) => {
    const parsed = StoryRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { heroName, heroTitle, heroPower, heroDescription, duration, mode, madlibWords, soundscape, setting, tone, childName, sidekick, problem, customPrompt } = parsed.data;

    try {
      const partCount = getPartCount(duration);
      const wordCount = getWordCount(duration);

      const systemPrompt = getStorySystemPrompt(mode, partCount);
      const userPrompt = getStoryUserPrompt(mode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords, soundscape, setting, tone, childName, sidekick, problem, customPrompt);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = aiRouter.generateTextStream("story", {
        systemPrompt,
        userPrompt,
        temperature: mode === "sleep" ? 0.7 : 0.9,
        maxTokens: STORY_MAX_TOKENS,
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
