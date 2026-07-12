import type { Express } from "express";
import path from "node:path";
import { getProviderStatuses, getBreakerStatuses } from "../ai";
import { getFeatureFlags } from "../feature-flags";
import { getMetrics } from "../metrics";
import { getActiveRequests } from "../load-shedding";
import { getLiveStatus } from "../health-checks";
import { pingElevenLabs } from "../elevenlabs";
import { pingAnthropic } from "../ai/providers/anthropic";

export function registerHealthRoutes(app: Express): void {
  app.get("/api/metrics", (_req, res) => {
    res.json(getMetrics());
  });

  // Note: `ttsLive`/`aiProvidersLive` reflect a background-refreshed, short-TTL
  // cache (see server/health-checks.ts) — never a synchronous network call, so
  // this route never slows down waiting on ElevenLabs/Anthropic. On serverless
  // cold starts the first read is honestly `null` (not yet checked).
  app.get("/api/health", (_req, res) => {
    const providers = getProviderStatuses();
    const aiAvailable = providers.some((p) => p.available && p.capabilities.text);
    const ttsAvailable = !!process.env.ELEVENLABS_API_KEY;
    res.json({
      status: "ok",
      timestamp: Date.now(),
      aiProvidersAvailable: aiAvailable,
      ttsAvailable,
      ttsLive: ttsAvailable ? getLiveStatus("elevenlabs", pingElevenLabs) : { reachable: null, checkedAt: null },
      aiProvidersLive: providers.find((p) => p.name === "anthropic")?.available
        ? getLiveStatus("anthropic", pingAnthropic)
        : { reachable: null, checkedAt: null },
      breakers: getBreakerStatuses(),
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
    res.json({ providers: getProviderStatuses(), breakers: getBreakerStatuses() });
  });
}
