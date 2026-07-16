/**
 * Narration URI resolver — bridges the server TTS endpoint and the on-device
 * cache (`lib/tts-cache.ts`). Callers get back a URI ready to hand to
 * `expo-av`'s `Audio.Sound`, without caring whether it came from disk or the
 * network.
 */

import { fetch } from 'expo/fetch';
import { getApiUrl } from '@/lib/query-client';
import { ttsCacheKey, getCachedNarrationUri, cacheNarration } from '@/lib/tts-cache';

export interface NarrationRequest {
  text: string;
  voice: string;
  mode: string;
}

/**
 * Resolve a playable URI for a narration clip:
 *  1. On-device cache hit → local `file://` URI (no network, works offline).
 *  2. Miss → POST `/api/tts`, download the MP3 into the cache, return its local URI.
 *  3. If hashing/caching is unavailable or fails → fall back to the remote
 *     streaming URL so playback still works.
 *
 * Throws only when the server request itself fails and nothing is cached.
 */
export async function resolveNarrationUri({ text, voice, mode }: NarrationRequest): Promise<string> {
  let key: string | null = null;
  try {
    key = await ttsCacheKey(voice, mode, text);
    const cached = getCachedNarrationUri(key);
    if (cached) return cached;
  } catch {
    // Hashing or filesystem unavailable — proceed without the cache.
    key = null;
  }

  const baseUrl = getApiUrl();
  const response = await fetch(new URL('/api/tts', baseUrl).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, mode }),
  });
  if (!response.ok) throw new Error('TTS request failed');

  const data = await response.json();
  if (!data.audioUrl) throw new Error('No audio URL returned');
  const remoteUrl = new URL(data.audioUrl, baseUrl).toString();

  if (key) {
    try {
      return await cacheNarration(key, remoteUrl);
    } catch {
      // Download-to-cache failed — stream from the server instead.
    }
  }
  return remoteUrl;
}

/**
 * Warm the on-device cache for an upcoming narration part without playing it.
 * Fire-and-forget: resolves once cached (or immediately on a hit) and never
 * throws. Wire this to the next story part to make "play next" instant.
 */
export async function prefetchNarration(req: NarrationRequest): Promise<void> {
  try {
    await resolveNarrationUri(req);
  } catch {
    // Best-effort warmup; a failure just means the next play fetches normally.
  }
}
