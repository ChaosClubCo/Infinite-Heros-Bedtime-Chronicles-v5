import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_VERSION = 1;
const STORAGE_VERSION_KEY = '@infinity_heroes_storage_version';

type MigrationFn = () => Promise<void>;

/**
 * Migration registry. Each key is the target version.
 * Migration N runs when upgrading from version N-1 to N.
 */
const MIGRATIONS: Record<number, MigrationFn> = {
  // v0 → v1: baseline — existing data is compatible, no changes needed
  1: async () => {},
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
