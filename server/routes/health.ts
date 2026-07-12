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

// Gemini first: it's this repo's documented minimum-required provider, so
// probing only Anthropic would leave aiProvidersLive stuck at null forever
// on the common Gemini-only deployment. Falls through to the next configured
// provider with a ping implemented.
const LIVE_PROBE_PROVIDERS: { name: string; ping: () => Promise<boolean> }[] = [
  { name: "gemini", ping: pingGemini },
  { name: "anthropic", ping: pingAnthropic },
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
    res.json({
      status: "ok",
      timestamp: Date.now(),
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
