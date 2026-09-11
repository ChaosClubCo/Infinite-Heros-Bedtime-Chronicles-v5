import type { Express } from "express";
import path from "node:path";
import { getProviderStatuses } from "../ai";
import { getFeatureFlags } from "../feature-flags";
import { getMetrics } from "../metrics";
import { getActiveRequests } from "../load-shedding";

const UNKNOWN_RELEASE_IDENTITY = "unknown";

function getReleaseIdentity() {
  return {
    releaseSha: process.env.RELEASE_SHA || UNKNOWN_RELEASE_IDENTITY,
    releaseRepo: process.env.RELEASE_REPO || UNKNOWN_RELEASE_IDENTITY,
    releaseRef: process.env.RELEASE_REF || UNKNOWN_RELEASE_IDENTITY,
    environment: process.env.DEPLOYMENT_ENV || process.env.NODE_ENV || UNKNOWN_RELEASE_IDENTITY,
    version: process.env.RELEASE_VERSION || process.env.npm_package_version || UNKNOWN_RELEASE_IDENTITY,
  };
}

export function registerHealthRoutes(app: Express): void {
  app.get("/api/metrics", (_req, res) => {
    res.json(getMetrics());
  });

  app.get("/api/health", (_req, res) => {
    const providers = getProviderStatuses();
    const aiAvailable = providers.some((p) => p.available && p.capabilities.text);
    const ttsAvailable = !!process.env.ELEVENLABS_API_KEY;
    res.setHeader("Cache-Control", "no-store");
    res.json({
      status: "ok",
      timestamp: Date.now(),
      ...getReleaseIdentity(),
      aiProvidersAvailable: aiAvailable,
      ttsAvailable,
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
    res.json({ providers: getProviderStatuses() });
  });
}
