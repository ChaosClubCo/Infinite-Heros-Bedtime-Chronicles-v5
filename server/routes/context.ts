import path from "node:path";
import { getAIRouter } from "../ai";
import { cleanupExpiredEntries } from "../rate-limit";
import { IdempotencyCache } from "../idempotency";
import { TtsCacheManager } from "../tts-cache";
import { logger } from "../logger";

export const ttsCacheManager = new TtsCacheManager({
  cacheDir: path.resolve("/tmp/tts-cache"),
  maxAgeMs: parseInt(process.env.TTS_CACHE_MAX_AGE_MS || String(24 * 60 * 60 * 1000), 10),
  maxSizeBytes: parseInt(process.env.TTS_CACHE_MAX_SIZE_BYTES || String(500 * 1024 * 1024), 10),
});
ttsCacheManager.ensureDir();

export const TTS_CACHE_DIR = ttsCacheManager.cacheDir;

setInterval(async () => {
  const { removedCount, freedBytes } = await ttsCacheManager.cleanup();
  if (removedCount > 0) {
    logger.info({ removedCount, freedBytes }, 'TTS cache cleanup');
  }
}, 60 * 60 * 1000);
ttsCacheManager.cleanup();

// Rate limit cleanup runs every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

export const aiRouter = getAIRouter();
export const idempotencyCache = new IdempotencyCache({ ttlMs: 5 * 60 * 1000, maxEntries: 200 });
