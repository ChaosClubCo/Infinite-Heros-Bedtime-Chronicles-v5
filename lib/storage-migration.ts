import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_VERSION = 3;
const STORAGE_VERSION_KEY = '@infinity_heroes_storage_version';
const STORIES_KEY = '@infinity_heroes_stories';
const APP_SETTINGS_KEY = '@infinity_heroes_app_settings';
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
  // v2 → v3: fold the duplicate `fontSize` text-size key into `textSize`.
  // The app shipped two competing text-size settings on two different settings
  // surfaces; `fontSize` ("normal" | "large") is removed in favour of `textSize`
  // ("small" | "medium" | "large"). Preserve an explicit `textSize` if one exists.
  3: async () => {
    const data = await AsyncStorage.getItem(APP_SETTINGS_KEY);
    if (!data) return;

    let settings: unknown;
    try {
      settings = JSON.parse(data);
    } catch {
      return;
    }
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return;

    const record = settings as Record<string, unknown>;
    if (!('fontSize' in record)) return;

    const legacyFontSize = record.fontSize;
    const { fontSize: _removed, ...rest } = record;
    void _removed;

    const migrated: Record<string, unknown> = { ...rest };
    if (typeof rest.textSize !== 'string') {
      migrated.textSize = legacyFontSize === 'large' ? 'large' : 'medium';
    }

    await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(migrated));
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
