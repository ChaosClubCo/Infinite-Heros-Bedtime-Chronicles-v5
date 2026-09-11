import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { logProviderStatus } from "./ai";
import { requireAuth } from "./auth";
import {
  getAiProviderComplianceStatus,
  getVoiceChatComplianceStatus,
  getRealtimeMediaComplianceStatus,
  isAiProviderProcessingApproved,
  isVoiceChatComplianceApproved,
  isRealtimeMediaComplianceApproved,
} from "./compliance";
import { isFeatureEnabled } from "./feature-flags";
import { logger } from "./logger";
import { registerAudioRoutes } from "./integrations/audio";
import { registerImageRoutes } from "./integrations/image";
import { registerAccountRoutes } from "./routes/account";
import { registerHealthRoutes } from "./routes/health";
import { registerStoryRoutes } from "./routes/story";
import { registerImageGenRoutes } from "./routes/images";
import { registerTtsRoutes } from "./routes/tts";
import { registerMusicRoutes } from "./routes/music";
import { registerSuggestRoutes } from "./routes/suggest";
import { registerVideoRoutes } from "./routes/video";
import { registerGithubWebhookRoute } from "./routes/github-webhook";
import { registerRealtimeMediaRoutes } from "./routes/realtime-media";

/**
 * Auth-gate predicate for `/api/*` requests (paths are relative to the `/api` mount,
 * e.g. `/conversations/1`, not `/api/conversations/1`).
 */
export function requiresAuthGate(method: string, path: string): boolean {
  if (path === '/github/webhook' || path === '/github/webhook/') return false;
  if (method === 'GET') {
    // Both carry per-user private state (voice-chat history; realtime media
    // session ownership) that the route layer enforces against req.user.uid —
    // without this gate req.user would be unset and ownership checks there
    // would silently 404 everyone instead of ever matching, or (worse, if a
    // route forgot the check) leak across users.
    return path.startsWith('/conversations') || path.startsWith('/v1/realtime-media-sessions');
  }
  return true;
}

/**
 * Child-directed routes that send content to an AI, transcription, image, video,
 * or speech provider. Static health/catalog routes and account deletion remain
 * available even while provider processing is fail-closed.
 */
export function requiresAiProviderCompliance(path: string): boolean {
  return path.startsWith('/generate-')
    || path.startsWith('/suggest-settings')
    || path.startsWith('/tts')
    || path.startsWith('/conversations')
    || path.startsWith('/v1/realtime-media-sessions');
}

export async function registerRoutes(app: Express): Promise<Server> {
  logProviderStatus();

  app.use('/api', async (req, res, next) => {
    if (!requiresAuthGate(req.method, req.path)) return next();
    return requireAuth(req, res, next);
  });

  app.use('/api', (req, res, next) => {
    if (!requiresAiProviderCompliance(req.path) || isAiProviderProcessingApproved()) {
      return next();
    }

    const compliance = getAiProviderComplianceStatus();
    logger.warn({
      event: 'ai_provider_processing_blocked',
      path: req.path,
      missingCompliance: compliance.missing,
    }, 'production AI processing blocked by compliance gate');
    return res.status(503).json({
      error: 'AI features are temporarily unavailable pending required privacy and provider approvals',
    });
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

  const realtimeMediaFeatureEnabled = isFeatureEnabled('realtimeMediaEnabled');
  const realtimeMediaComplianceApproved = isRealtimeMediaComplianceApproved();
  const realtimeMediaDependenciesConfigured = !!process.env.ELEVENLABS_API_KEY;

  if (realtimeMediaFeatureEnabled && realtimeMediaComplianceApproved && realtimeMediaDependenciesConfigured) {
    registerRealtimeMediaRoutes(app);
    logger.info('realtime media session routes registered');
  } else if (realtimeMediaFeatureEnabled) {
    const compliance = getRealtimeMediaComplianceStatus();
    logger.warn({
      event: 'realtime_media_disabled',
      complianceApproved: realtimeMediaComplianceApproved,
      missingCompliance: compliance.missing,
      dependenciesConfigured: realtimeMediaDependenciesConfigured,
    }, 'realtime media requested but fail-closed release requirements were not met');
  }

  const voiceFeatureEnabled = isFeatureEnabled('voiceChatEnabled');
  const voiceComplianceApproved = isVoiceChatComplianceApproved();
  const voiceDependenciesConfigured = !!(
    process.env.OPENAI_API_KEY && process.env.DATABASE_URL
  );

  if (voiceFeatureEnabled && voiceComplianceApproved && voiceDependenciesConfigured) {
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

  if (process.env.GEMINI_API_KEY) {
    registerImageRoutes(app);
    logger.info('Gemini image generation route registered');
  }

  return createServer(app);
}
