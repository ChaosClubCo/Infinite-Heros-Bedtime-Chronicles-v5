import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger';

interface TtsCacheOptions {
  cacheDir: string;
  maxAgeMs: number;
  maxSizeBytes?: number;
}

interface CacheFileInfo {
  name: string;
  path: string;
  size: number;
  mtimeMs: number;
}

const DEFAULT_MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

// FOLLOW-UP (roadmap M1, TTS-cache half): this cache is filesystem-only
// (/tmp), which is lost across Vercel serverless cold starts/instances —
// unlike the idempotency cache (server/idempotency.ts), which now also
// checks Cloudflare KV for cross-invocation dedup. KV isn't a good fit for
// binary MP3 blobs (base64 inflation + ~25MB value limits), so this needs
// Cloudflare R2 (object storage) instead — a different Cloudflare product
// that requires provisioning a new bucket + API token before any code here
// changes. See docs/ROADMAP.md backlog and CLOUDFLARE_R2_* in .env.example.
export class TtsCacheManager {
  readonly cacheDir: string;
  private readonly maxAgeMs: number;
  private readonly maxSizeBytes: number;

  constructor(options: TtsCacheOptions) {
    this.cacheDir = options.cacheDir;
    this.maxAgeMs = options.maxAgeMs;
    this.maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  }

  getMaxSizeBytes(): number {
    return this.maxSizeBytes;
  }

  shouldEvict(currentSizeBytes: number): boolean {
    return currentSizeBytes > this.maxSizeBytes;
  }

  ensureDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async cleanup(): Promise<{ removedCount: number; freedBytes: number }> {
    let removedCount = 0;
    let freedBytes = 0;

    try {
      const files = await this.listFiles();
      const now = Date.now();

      // Phase 1: Remove expired files
      for (const file of files) {
        if (now - file.mtimeMs > this.maxAgeMs) {
          await fs.promises.unlink(file.path);
          freedBytes += file.size;
          removedCount++;
        }
      }

      // Phase 2: If still over size limit, remove oldest files
      const remaining = await this.listFiles();
      let totalSize = remaining.reduce((sum, f) => sum + f.size, 0);

      if (totalSize > this.maxSizeBytes) {
        remaining.sort((a, b) => a.mtimeMs - b.mtimeMs);
        for (const file of remaining) {
          if (totalSize <= this.maxSizeBytes) break;
          await fs.promises.unlink(file.path);
          totalSize -= file.size;
          freedBytes += file.size;
          removedCount++;
        }
      }
    } catch (err) {
      console.error('[TTS Cache] Cleanup error:', err);
    }

    return { removedCount, freedBytes };
  }

  private async listFiles(): Promise<CacheFileInfo[]> {
    try {
      const names = await fs.promises.readdir(this.cacheDir);
      const files: CacheFileInfo[] = [];
      for (const name of names) {
        const filePath = path.join(this.cacheDir, name);
        try {
          const stat = await fs.promises.stat(filePath);
          if (stat.isFile()) {
            files.push({ name, path: filePath, size: stat.size, mtimeMs: stat.mtimeMs });
          }
        } catch (err) {
          logger.warn({ err, file: name }, 'tts-cache: stat failed, skipping file');
        }
      }
      return files;
    } catch (err) {
      logger.error({ err }, 'tts-cache: readdir failed, returning empty list');
      return [];
    }
  }
}
