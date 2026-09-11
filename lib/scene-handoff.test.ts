import { describe, it, expect } from 'vitest';
import { setPendingScenes, takePendingScenes } from './scene-handoff';

describe('Scene In-Memory Handoff Utility', () => {
  it('stores and retrieves pending scenes via single-consumer handoff', () => {
    const scenes = { 0: 'data:image/png;base64,scene0', 1: 'data:image/png;base64,scene1' };
    setPendingScenes(scenes);

    const taken = takePendingScenes();
    expect(taken).toEqual(scenes);

    // Subsequent take must return null (single consumer handoff)
    const takenAgain = takePendingScenes();
    expect(takenAgain).toBeNull();
  });

  it('returns null when no pending scenes have been set', () => {
    takePendingScenes(); // ensure clean
    expect(takePendingScenes()).toBeNull();
  });
});
