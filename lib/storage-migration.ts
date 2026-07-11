import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_VERSION = 2;
const STORAGE_VERSION_KEY = '@infinity_heroes_storage_version';
const STORIES_KEY = '@infinity_heroes_stories';
const DEFAULT_STORY_VOICE = 'moonbeam';
const DEFAULT_STORY_SPEED = 'medium';

type MigrationFn = () => Promise<void>;

/**
 * Migration registry. Each key is the target version.
 * Migration N runs when upgrading from version N-1 to N.
 */
const MIGRATIONS: Record<number, MigrationFn> = {
  // v0 → v1: baseline — existing data is compatible, no changes needed
  1: async () => {},
  // v1 → v2: backfill cached story voice/speed for replay fidelity
  2: async () => {
    const data = await AsyncStorage.getItem(STORIES_KEY);
    if (!data) return;

    let stories: unknown;
    try {
      stories = JSON.parse(data);
    } catch {
      return;
    }
    if (!Array.isArray(stories)) return;

    const migratedStories = stories.map((story) => {
      if (!story || typeof story !== 'object') return story;
      const voice = typeof story.voice === 'string' && story.voice.length > 0 ? story.voice : DEFAULT_STORY_VOICE;
      const speed = typeof story.speed === 'string' && story.speed.length > 0 ? story.speed : DEFAULT_STORY_SPEED;
      return { ...story, voice, speed };
    });

    await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(migratedStories));
  },
};

/**
 * Run pending storage migrations sequentially.
 * Call this once at app startup (e.g., in the root layout).
 */
export async function runStorageMigrations(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
  const currentVersion = raw ? parseInt(raw, 10) : 0;

  if (currentVersion >= STORAGE_VERSION) return;

  for (let v = currentVersion + 1; v <= STORAGE_VERSION; v++) {
    const migration = MIGRATIONS[v];
    if (migration) {
      await migration();
    }
  }

  await AsyncStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
}
