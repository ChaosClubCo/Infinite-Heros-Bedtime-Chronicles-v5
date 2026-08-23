import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory AsyncStorage mock
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

import { runStorageMigrations, STORAGE_VERSION } from './storage-migration';

describe('runStorageMigrations', () => {
  beforeEach(() => {
    store.clear();
  });

  it('sets version to STORAGE_VERSION on fresh install', async () => {
    await runStorageMigrations();
    expect(store.get('@infinity_heroes_storage_version')).toBe(String(STORAGE_VERSION));
  });

  it('skips migrations when already at current version', async () => {
    store.set('@infinity_heroes_storage_version', String(STORAGE_VERSION));
    await runStorageMigrations();
    // Should still be at same version, no error
    expect(store.get('@infinity_heroes_storage_version')).toBe(String(STORAGE_VERSION));
  });

  it('runs migrations sequentially from old version', async () => {
    store.set('@infinity_heroes_storage_version', '0');
    await runStorageMigrations();
    expect(store.get('@infinity_heroes_storage_version')).toBe(String(STORAGE_VERSION));
  });

  it('backfills voice/speed on existing cached stories', async () => {
    store.set('@infinity_heroes_storage_version', '1');
    store.set(
      '@infinity_heroes_stories',
      JSON.stringify([
        { id: 's1', heroId: 'nova', mode: 'classic', timestamp: 1, story: { title: 'One' } },
        { id: 's2', heroId: 'luna', mode: 'sleep', timestamp: 2, voice: 'aurora', speed: 'gentle', story: { title: 'Two' } },
      ]),
    );

    await runStorageMigrations();

    const migratedRaw = store.get('@infinity_heroes_stories');
    expect(migratedRaw).toBeTruthy();
    const migrated = JSON.parse(migratedRaw!);
    expect(migrated[0].voice).toBe('moonbeam');
    expect(migrated[0].speed).toBe('medium');
    expect(migrated[1].voice).toBe('aurora');
    expect(migrated[1].speed).toBe('gentle');
  });

  it('STORAGE_VERSION is at least 2', () => {
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(2);
  });
});
