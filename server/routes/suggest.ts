import type { Express } from "express";
import { VOICE_MAP, MODE_DEFAULT_VOICES, getVoicesForMode } from "../elevenlabs";
import { SuggestSettingsRequestSchema, VALID_MODES, VALID_DURATIONS, sanitizePromptInput } from "../validation";
import { estimateCostUsd, reportCostAnomaly } from "../ai/cost";
import { parsePositiveIntEnv } from "../utils";
import { aiRouter } from "./context";
import { rateLimited, sendRouteError } from "./helpers";

// Per-call token ceiling (cost guard) — env-configurable, invalid values fall back.
const SUGGEST_MAX_TOKENS = parsePositiveIntEnv(process.env.SUGGEST_MAX_TOKENS, 2048);

export function registerSuggestRoutes(app: Express): void {
  app.post("/api/suggest-settings", rateLimited("Too many requests"), async (req, res) => {
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

      // Sanitize user-provided strings before prompt inclusion (prompt-injection
      // defense) — schema truncation alone does not strip control chars / role markers.
      const safeHeroName = sanitizePromptInput(heroName, 500);
      const safeHeroPower = sanitizePromptInput(heroPower, 500);
      const safeChildName = childName ? sanitizePromptInput(childName, 500) : "";

      const ageContext = childAge ? ` Child age: ${childAge} years old.${childAge <= 5 ? " For younger kids, prefer shorter, gentler stories with sleep mode." : " For older kids, classic and madlibs modes with longer stories work great."}` : "";
      const nameContext = safeChildName ? ` Child name: ${safeChildName}.` : "";

      const userPrompt = `Suggest bedtime story settings as JSON. Time: ${timeOfDay}.${ageContext}${nameContext} Hero: ${safeHeroName} (${safeHeroPower}). Modes: classic, madlibs, sleep. Durations: short, medium-short, medium, long, epic. Speeds: gentle, medium, normal. Voice categories - Sleep voices: ${sleepVoices}. Classic voices: ${classicVoices}. Fun/madlibs voices: ${funVoices}. IMPORTANT: Match voice to mode (sleep voices for sleep, classic voices for classic, fun voices for madlibs). Night=sleep+gentle+short. Afternoon=classic/madlibs+medium/normal. Reply ONLY with: {"mode":"...","duration":"...","speed":"...","voice":"...","tip":"short parent-friendly reason"}`;

      const aiResponse = await aiRouter.generateText("suggestion", {
        systemPrompt: "You are a helpful assistant that suggests bedtime story settings. Respond with valid JSON only.",
        userPrompt,
        temperature: 0.7,
        maxTokens: SUGGEST_MAX_TOKENS,
        thinkingBudget: 0,
        jsonMode: true,
      });

      const estCostUsd = estimateCostUsd(aiResponse.provider, aiResponse.usage);
      req.log?.info({
        provider: aiResponse.provider,
        model: aiResponse.model,
        inputTokens: aiResponse.usage?.inputTokens,
        outputTokens: aiResponse.usage?.outputTokens,
        estCostUsd,
      }, 'suggestion generated');
      reportCostAnomaly(estCostUsd, { provider: aiResponse.provider, endpoint: '/api/suggest-settings' });

      // The router parses + validates JSON (via extractFirstJson) when jsonMode is set,
      // so consume parsedJson directly rather than re-parsing the raw text here.
      if (
        !aiResponse.parsedJson ||
        typeof aiResponse.parsedJson !== "object" ||
        Array.isArray(aiResponse.parsedJson)
      ) {
        req.log?.error('suggest-settings: no JSON object in AI response');
        return res.status(500).json({ error: "Invalid AI response" });
      }

      const raw = aiResponse.parsedJson as Record<string, unknown>;

      const mode = (VALID_MODES as readonly string[]).includes(raw.mode as string) ? (raw.mode as string) : "classic";
      const duration = (VALID_DURATIONS as readonly string[]).includes(raw.duration as string) ? (raw.duration as string) : "medium";
      const speed = ["gentle", "medium", "normal"].includes(raw.speed as string) ? (raw.speed as string) : "medium";
      const voice = voiceKeys.includes(raw.voice as string) ? (raw.voice as string) : (MODE_DEFAULT_VOICES[mode] || "moonbeam");
      const tip = (typeof raw.tip === "string" ? raw.tip : "A great story awaits!").slice(0, 120);

      const suggestion = { mode, duration, speed, voice, tip };

      res.json(suggestion);
    } catch (error: unknown) {
      sendRouteError(req, res, error, 'suggest settings failed', 'Failed to generate suggestion');
    }
  });
}
