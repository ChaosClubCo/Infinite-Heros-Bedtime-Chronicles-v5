import type { Express } from "express";
import path from "node:path";
import { getProviderStatuses, getBreakerStatuses } from "../ai";
import { getFeatureFlags } from "../feature-flags";
import { getMetrics } from "../metrics";
import { getActiveRequests } from "../load-shedding";
import { getLiveStatus } from "../health-checks";
import { pingElevenLabs } from "../elevenlabs";
import { pingGemini } from "../ai/providers/gemini";
import { pingAnthropic } from "../ai/providers/anthropic";
import { pingOpenAI } from "../ai/providers/openai";
import { pingOpenRouter } from "../ai/providers/openrouter";
import { getReleaseSha } from "../release-identity";

// Anthropic first, matching DEFAULT_CHAINS's "story" fallback order in
// server/ai/router.ts (Anthropic → Gemini → ...) — probing whichever
// provider the story chain actually prefers means an Anthropic-specific
// outage still surfaces here even when Gemini (this repo's documented
// minimum-required provider) is also configured and healthy. Falls through
// to Gemini when Anthropic isn't configured, so a Gemini-only deployment
// still gets a live probe instead of aiProvidersLive being stuck at null.
const LIVE_PROBE_PROVIDERS: { name: string; ping: () => Promise<boolean> }[] = [
  { name: "anthropic", ping: pingAnthropic },
  { name: "gemini", ping: pingGemini },
  { name: "openai", ping: pingOpenAI },
  { name: "xai", ping: pingOpenRouter },
  { name: "mistral", ping: pingOpenRouter },
  { name: "cohere", ping: pingOpenRouter },
  { name: "meta-llama", ping: pingOpenRouter },
];

export function registerHealthRoutes(app: Express): void {
  app.get("/api/metrics", (_req, res) => {
    res.json(getMetrics());
  });

  // Note: `ttsLive`/`aiProvidersLive` reflect a background-refreshed, short-TTL
  // cache (see server/health-checks.ts) — never a synchronous network call, so
  // this route never slows down waiting on ElevenLabs/Gemini/Anthropic. On
  // serverless cold starts the first read is honestly `null` (not yet checked).
  app.get("/api/health", (_req, res) => {
    const providers = getProviderStatuses();
    const aiAvailable = providers.some((p) => p.available && p.capabilities.text);
    const ttsAvailable = !!process.env.ELEVENLABS_API_KEY;
    const liveProbeProvider = LIVE_PROBE_PROVIDERS.find(
      (p) => providers.find((status) => status.name === p.name)?.available,
    );
    res.setHeader("Cache-Control", "no-store");
    res.json({
      status: "ok",
      timestamp: Date.now(),
      releaseSha: getReleaseSha(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      aiProvidersAvailable: aiAvailable,
      ttsAvailable,
      ttsLive: ttsAvailable ? getLiveStatus("elevenlabs", pingElevenLabs) : { reachable: null, checkedAt: null },
      aiProvidersLive: liveProbeProvider
        ? getLiveStatus(liveProbeProvider.name, liveProbeProvider.ping)
        : { reachable: null, checkedAt: null },
      breakers: getBreakerStatuses(),
      features: getFeatureFlags(),
      activeRequests: getActiveRequests(),
    });
  });

  app.get("/privacy", (_req, res) => {
    const privacyPath = path.resolve(process.cwd(), "server", "templates", "privacy-policy.html");
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(privacyPath, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: "Privacy policy not found" });
      }
    });
  });

  app.get("/api/ai-providers", (_req, res) => {
    res.json({ providers: getProviderStatuses(), breakers: getBreakerStatuses() });
  });
}
