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

export async function registerRoutes(app: Express): Promise<Server> {
  logProviderStatus();

  // Apply auth middleware to all POST /api/* endpoints.
  // Must be registered before any domain routes.
  app.use('/api', async (req, res, next) => {
    // Skip auth for GET endpoints (health, voices, etc.)
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

  // Register voice chat & conversation routes (replit_integrations)
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.DATABASE_URL && isFeatureEnabled('voiceChatEnabled')) {
    registerAudioRoutes(app);
    logger.info('voice chat & conversation routes registered');
  }

  // Register Gemini direct image generation route (replit_integrations)
  if (process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
    registerImageRoutes(app);
    console.log("[Routes] Gemini image generation route registered");
  }

  const httpServer = createServer(app);
  return httpServer;
}
