import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { logProviderStatus } from "./ai";
import { requireAuth } from "./auth";
import { isFeatureEnabled } from "./feature-flags";
import { logger } from "./logger";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerHealthRoutes } from "./routes/health";
import { registerStoryRoutes } from "./routes/story";
import { registerImageGenRoutes } from "./routes/images";
import { registerTtsRoutes } from "./routes/tts";
import { registerMusicRoutes } from "./routes/music";
import { registerSuggestRoutes } from "./routes/suggest";
import { registerVideoRoutes } from "./routes/video";

/**
 * Route composer. Installs the auth gate, then registers each domain module.
 * Handlers live in server/routes/<domain>.ts; shared singletons in
 * server/routes/context.ts; per-route plumbing in server/routes/helpers.ts.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  logProviderStatus();

  // Auth gate for all /api/* endpoints. GETs are skipped here so public reads
  // (health, voices, music) stay open; data-bearing GETs (e.g. conversations)
  // apply requireAuth at the route level inside their own module.
  app.use('/api', async (req, res, next) => {
    if (req.method === 'GET') return next();
    return requireAuth(req, res, next);
  });

  registerHealthRoutes(app);
  registerStoryRoutes(app);
  registerImageGenRoutes(app);
  registerTtsRoutes(app);
  registerMusicRoutes(app);
  registerSuggestRoutes(app);
  registerVideoRoutes(app);

  // Voice chat & conversation routes (require OpenAI connector + database).
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.DATABASE_URL && isFeatureEnabled('voiceChatEnabled')) {
    registerAudioRoutes(app);
    logger.info('voice chat & conversation routes registered');
  }

  // Gemini direct image generation route.
  if (process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
    registerImageRoutes(app);
    logger.info('gemini image generation route registered');
  }

  return createServer(app);
}
