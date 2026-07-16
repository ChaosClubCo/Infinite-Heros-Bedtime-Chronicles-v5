import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { logProviderStatus } from "./ai";
import { requireAuth } from "./auth";
import { getVoiceChatComplianceStatus, isVoiceChatComplianceApproved } from "./compliance";
import { isFeatureEnabled } from "./feature-flags";
import { logger } from "./logger";
import { registerAccountRoutes } from "./routes/account";
import { registerHealthRoutes } from "./routes/health";
import { registerStoryRoutes } from "./routes/story";
import { registerImageGenRoutes } from "./routes/images";
import { registerTtsRoutes } from "./routes/tts";
import { registerMusicRoutes } from "./routes/music";
import { registerSuggestRoutes } from "./routes/suggest";
import { registerVideoRoutes } from "./routes/video";
import { registerGithubWebhookRoute } from "./routes/github-webhook";

/**
 * Auth-gate predicate for `/api/*` requests (paths are relative to the `/api` mount,
 * e.g. `/conversations/1`, not `/api/conversations/1`).
 *
 * GET requests skip auth by default since most GETs (health, voices, music, etc.)
 * serve public catalog data. GET /api/conversations* is the exception: it returns
 * per-user voice-chat history, so it must go through requireAuth like the writes do.
 *
 * /github/webhook is exempt: GitHub cannot supply a Supabase bearer token, and
 * the route authenticates the caller itself via HMAC (X-Hub-Signature-256).
 */
export function requiresAuthGate(method: string, path: string): boolean {
  if (path === '/github/webhook' || path === '/github/webhook/') return false;
  if (method === 'GET') return path.startsWith('/conversations');
  return true;
}

/** Route composer. */
export async function registerRoutes(app: Express): Promise<Server> {
  logProviderStatus();

  app.use('/api', async (req, res, next) => {
    if (!requiresAuthGate(req.method, req.path)) return next();
    return requireAuth(req, res, next);
  });

  registerHealthRoutes(app);
  registerAccountRoutes(app);
  registerStoryRoutes(app);
  registerImageGenRoutes(app);
  registerTtsRoutes(app);
  registerMusicRoutes(app);
  registerSuggestRoutes(app);
  registerVideoRoutes(app);
  registerGithubWebhookRoute(app);

  const voiceFeatureEnabled = isFeatureEnabled('voiceChatEnabled');
  const voiceComplianceApproved = isVoiceChatComplianceApproved();
  const voiceDependenciesConfigured = !!(
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.DATABASE_URL
  );

  if (voiceFeatureEnabled && voiceComplianceApproved && voiceDependenciesConfigured) {
    const { registerAudioRoutes } = await import("./replit_integrations/audio");
    registerAudioRoutes(app);
    logger.info('voice chat & conversation routes registered');
  } else if (voiceFeatureEnabled) {
    const compliance = getVoiceChatComplianceStatus();
    logger.warn({
      event: 'voice_chat_disabled',
      complianceApproved: voiceComplianceApproved,
      missingCompliance: compliance.missing,
      dependenciesConfigured: voiceDependenciesConfigured,
    }, 'voice chat requested but fail-closed release requirements were not met');
  }

  if (process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
    const { registerImageRoutes } = await import("./replit_integrations/image");
    registerImageRoutes(app);
    logger.info('Gemini image generation route registered');
  }

  return createServer(app);
}
