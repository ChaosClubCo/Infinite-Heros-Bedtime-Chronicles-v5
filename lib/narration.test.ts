import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveNarrationUri, prefetchNarration } from './narration';
import { fetch } from 'expo/fetch';
import { ttsCacheKey, getCachedNarrationUri, cacheNarration } from '@/lib/tts-cache';

// vi.mock is hoisted above the imports above by vitest.
vi.mock('@/lib/query-client', () => ({ getApiUrl: vi.fn(() => 'http://localhost:5000') }));
vi.mock('expo/fetch', () => ({ fetch: vi.fn() }));
vi.mock('@/lib/tts-cache', () => ({
  ttsCacheKey: vi.fn(),
  getCachedNarrationUri: vi.fn(),
  cacheNarration: vi.fn(),
}));

const fetchMock = vi.mocked(fetch);
const req = { text: 'Once upon a time', voice: 'moonbeam', mode: 'sleep' };

function okResponse(audioUrl: unknown = '/api/tts-audio/h.mp3') {
  return { ok: true, json: async () => ({ audioUrl }) } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ttsCacheKey).mockResolvedValue('key1');
});

describe('resolveNarrationUri', () => {
  it('returns the local URI on a cache hit without hitting the network', async () => {
    vi.mocked(getCachedNarrationUri).mockReturnValue('file:///cache/tts-cache/key1.mp3');
    const uri = await resolveNarrationUri(req);
    expect(uri).toBe('file:///cache/tts-cache/key1.mp3');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches, caches, and returns the local URI on a miss', async () => {
    vi.mocked(getCachedNarrationUri).mockReturnValue(null);
    fetchMock.mockResolvedValue(okResponse());
    vi.mocked(cacheNarration).mockResolvedValue('file:///cache/tts-cache/key1.mp3');

    const uri = await resolveNarrationUri(req);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/tts', expect.objectContaining({ method: 'POST' }));
    expect(cacheNarration).toHaveBeenCalledWith('key1', 'http://localhost:5000/api/tts-audio/h.mp3');
    expect(uri).toBe('file:///cache/tts-cache/key1.mp3');
  });

  it('falls back to the remote URL when caching to disk fails', async () => {
    vi.mocked(getCachedNarrationUri).mockReturnValue(null);
    fetchMock.mockResolvedValue(okResponse());
    vi.mocked(cacheNarration).mockRejectedValue(new Error('disk full'));

    const uri = await resolveNarrationUri(req);
    expect(uri).toBe('http://localhost:5000/api/tts-audio/h.mp3');
  });

  it('proceeds without the cache when hashing is unavailable', async () => {
    vi.mocked(ttsCacheKey).mockRejectedValue(new Error('no crypto'));
    fetchMock.mockResolvedValue(okResponse());

    const uri = await resolveNarrationUri(req);
    expect(getCachedNarrationUri).not.toHaveBeenCalled();
    expect(cacheNarration).not.toHaveBeenCalled();
    expect(uri).toBe('http://localhost:5000/api/tts-audio/h.mp3');
  });

  it('throws when the server request fails', async () => {
    vi.mocked(getCachedNarrationUri).mockReturnValue(null);
    fetchMock.mockResolvedValue({ ok: false } as unknown as Response);
    await expect(resolveNarrationUri(req)).rejects.toThrow('TTS request failed');
  });

  it('throws when the server returns no audioUrl', async () => {
    vi.mocked(getCachedNarrationUri).mockReturnValue(null);
    fetchMock.mockResolvedValue(okResponse(undefined));
    await expect(resolveNarrationUri(req)).rejects.toThrow('No audio URL returned');
  });
});

describe('prefetchNarration', () => {
  it('never throws even when resolution fails', async () => {
    vi.mocked(getCachedNarrationUri).mockReturnValue(null);
    fetchMock.mockResolvedValue({ ok: false } as unknown as Response);
    await expect(prefetchNarration(req)).resolves.toBeUndefined();
  });

  it('warms the cache on a miss', async () => {
    vi.mocked(getCachedNarrationUri).mockReturnValue(null);
    fetchMock.mockResolvedValue(okResponse());
    vi.mocked(cacheNarration).mockResolvedValue('file:///cache/tts-cache/key1.mp3');
    await prefetchNarration(req);
    expect(cacheNarration).toHaveBeenCalled();
  });
});
