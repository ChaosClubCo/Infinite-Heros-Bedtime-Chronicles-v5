/**
 * On-device narration (TTS) audio cache.
 *
 * Narration MP3s are generated server-side (ElevenLabs) and, until now, the
 * client re-fetched the audio from the server on every play (`lib/useStoryAudio`),
 * so replays cost bandwidth and offline playback was impossible. This module
 * persists each narration clip to the app cache directory keyed by a hash of the
 * exact inputs (`voice:mode:text`) — mirroring the server's cache key scheme
 * (`server/routes/helpers.ts` `ttsCachePathFor`) — so a repeat play is served
 * instantly from disk, works offline, and never re-hits the network.
 *
 * Uses the modern `expo-file-system` API (File/Directory/Paths, SDK 54+). All
 * filesystem access is best-effort: any failure degrades gracefully to network
 * streaming (see `lib/narration.ts`) rather than breaking playback.
 */

import { File, Directory, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const TTS_DIR_NAME = 'tts-cache';

/**
 * Soft size ceiling for the on-device cache. When exceeded, the least-recently
 * written clips are evicted. 50 MB is roughly a few hundred narration parts —
 * generous for a bedtime session, safe for low-end devices.
 */
export const TTS_CACHE_MAX_BYTES = 50 * 1024 * 1024;

function ttsDir(): Directory {
  return new Directory(Paths.cache, TTS_DIR_NAME);
}

function clipFile(key: string): File {
  return new File(ttsDir(), `${key}.mp3`);
}

/**
 * Stable cache key for a narration clip: md5 of `voice:mode:text`, matching the
 * server's key scheme so the same inputs always map to the same clip. Async
 * because `expo-crypto` hashing is async.
 */
export function ttsCacheKey(voice: string, mode: string, text: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, `${voice}:${mode}:${text}`);
}

/**
 * Return the local `file://` URI for a cached clip, or null if not cached.
 * Never throws — a filesystem error is treated as a cache miss.
 */
export function getCachedNarrationUri(key: string): string | null {
  try {
    const file = clipFile(key);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/**
 * Download a narration clip from `remoteUrl` into the on-device cache and return
 * its local URI. If another play already cached it, the existing file is reused.
 * Fires a best-effort eviction pass afterward. Throws only if the download
 * itself fails (callers fall back to streaming the remote URL).
 */
export async function cacheNarration(key: string, remoteUrl: string): Promise<string> {
  const dir = ttsDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

  const existing = clipFile(key);
  if (existing.exists) return existing.uri;

  const file = await File.downloadFileAsync(remoteUrl, new File(dir, `${key}.mp3`));
  // Eviction is a housekeeping concern — never let it fail a successful cache.
  try { evictIfOverBudget(); } catch { /* ignore */ }
  return file.uri;
}

/**
 * Evict least-recently-written clips until the cache is under `maxBytes`.
 * Best-effort: individual delete failures are ignored. Uses modification time
 * (last write) rather than access time, matching the server-side TTS cache.
 */
export function evictIfOverBudget(maxBytes: number = TTS_CACHE_MAX_BYTES): void {
  const dir = ttsDir();
  if (!dir.exists) return;

  const files = dir.list().filter((entry): entry is File => entry instanceof File);
  let total = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
  if (total <= maxBytes) return;

  files.sort((a, b) => (a.modificationTime ?? 0) - (b.modificationTime ?? 0));
  for (const f of files) {
    if (total <= maxBytes) break;
    total -= f.size ?? 0;
    try { f.delete(); } catch { /* ignore */ }
  }
}

/** Remove the entire on-device narration cache (e.g. on a "clear data" action). */
export function clearNarrationCache(): void {
  try {
    const dir = ttsDir();
    if (dir.exists) dir.delete();
  } catch { /* ignore */ }
}
