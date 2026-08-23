import type { Express } from "express";
import path from "node:path";
import { getProviderStatuses } from "../ai";
import { getFeatureFlags } from "../feature-flags";
import { getMetrics } from "../metrics";
import { getActiveRequests } from "../load-shedding";

export function registerHealthRoutes(app: Express): void {
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
}
