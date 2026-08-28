import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getQueuedInteractions,
  queueInteraction,
  clearQueuedInteractions,
  syncOfflineInteractions,
} from './sync-queue';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  },
}));

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/query-client', () => ({ apiRequest }));

describe('sync-queue', () => {
  beforeEach(() => {
    store.clear();
    apiRequest.mockReset();
  });

  it('starts with an empty queue', async () => {
    expect(await getQueuedInteractions()).toEqual([]);
  });

  it('queues an interaction', async () => {
    await queueInteraction('like', 'story-1');
    const queue = await getQueuedInteractions();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: 'like', storyId: 'story-1' });
  });

  it('de-duplicates the same type+storyId pair', async () => {
    await queueInteraction('like', 'story-1');
    await queueInteraction('like', 'story-1');
    expect(await getQueuedInteractions()).toHaveLength(1);
  });

  it('coalesces opposing toggles for the same story to the latest state', async () => {
    await queueInteraction('like', 'story-1');
    await queueInteraction('unlike', 'story-1');
    const queue = await getQueuedInteractions();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: 'unlike', storyId: 'story-1' });
  });

  it('resolves a like->unlike->like sequence to a single final like', async () => {
    await queueInteraction('like', 'story-1');
    await queueInteraction('unlike', 'story-1');
    await queueInteraction('like', 'story-1');
    const queue = await getQueuedInteractions();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: 'like', storyId: 'story-1' });
  });

  it('does not coalesce toggles across different stories', async () => {
    await queueInteraction('like', 'story-1');
    await queueInteraction('unlike', 'story-2');
    expect(await getQueuedInteractions()).toHaveLength(2);
  });

  it('returns an empty queue when stored data is not an array', async () => {
    store.set('@infinity_heroes_offline_queue', JSON.stringify({ not: 'an array' }));
    expect(await getQueuedInteractions()).toEqual([]);
  });

  it('clears the queue', async () => {
    await queueInteraction('story_completion', 'story-2');
    await clearQueuedInteractions();
    expect(await getQueuedInteractions()).toEqual([]);
  });

  it('syncOfflineInteractions is a no-op success when the queue is empty', async () => {
    const result = await syncOfflineInteractions();
    expect(result).toBe(true);
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('posts queued interactions and clears the queue on success', async () => {
    await queueInteraction('like', 'story-1');
    apiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, syncedCount: 1 }),
    });

    const result = await syncOfflineInteractions();

    expect(result).toBe(true);
    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      'api/sync/interactions',
      expect.objectContaining({ interactions: expect.any(Array) })
    );
    expect(await getQueuedInteractions()).toEqual([]);
  });

  it('keeps the queue when the server reports failure', async () => {
    await queueInteraction('like', 'story-1');
    apiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    });

    const result = await syncOfflineInteractions();

    expect(result).toBe(false);
    expect(await getQueuedInteractions()).toHaveLength(1);
  });

  it('keeps the queue when the request throws', async () => {
    await queueInteraction('like', 'story-1');
    apiRequest.mockRejectedValueOnce(new Error('network down'));

    const result = await syncOfflineInteractions();

    expect(result).toBe(false);
    expect(await getQueuedInteractions()).toHaveLength(1);
  });

  it('preserves an interaction queued while a sync request is in flight', async () => {
    await queueInteraction('like', 'story-1');
    let queuedDuringFlight: Promise<void> | undefined;
    apiRequest.mockImplementationOnce(async () => {
      // Simulate another part of the app queuing a new interaction while this
      // sync's network request is in flight (still holding the queue lock).
      queuedDuringFlight = queueInteraction('story_completion', 'story-2');
      return { ok: true, json: () => Promise.resolve({ success: true, syncedCount: 1 }) };
    });

    const result = await syncOfflineInteractions();
    await queuedDuringFlight;

    expect(result).toBe(true);
    const queue = await getQueuedInteractions();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: 'story_completion', storyId: 'story-2' });
  });
});
