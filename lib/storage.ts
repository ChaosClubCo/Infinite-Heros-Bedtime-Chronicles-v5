import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CachedStory,
  StoryFull,
  UserPreferences,
  DEFAULT_PREFERENCES,
  ChildProfile,
  EarnedBadge,
  StreakData,
  ParentControls,
  DEFAULT_PARENT_CONTROLS,
  ParentConsent,
  DEFAULT_PARENT_CONSENT,
  CONSENT_VERSION,
  BADGE_DEFINITIONS,
} from '@/constants/types';
import { HEROES } from '@/constants/heroes';
import { evaluateBadges } from './badges';
import { getCustomHeroes } from './customHeroStorage';

const FAVORITES_KEY = '@infinity_heroes_favorites';
const READ_STORIES_KEY = '@infinity_heroes_read';
const STORIES_KEY = '@infinity_heroes_stories';
const PREFERENCES_KEY = '@infinity_heroes_preferences';
const PROFILES_KEY = '@infinity_heroes_profiles';
const ACTIVE_PROFILE_KEY = '@infinity_heroes_active_profile';
const BADGES_KEY = '@infinity_heroes_badges';
const STREAKS_KEY = '@infinity_heroes_streaks';
const PARENT_CONTROLS_KEY = '@infinity_heroes_parent_controls';
const ONBOARDING_KEY = '@infinity_heroes_onboarding_complete';
const PARENT_CONSENT_KEY = '@infinity_heroes_parent_consent';
const DEFAULT_STORY_VOICE = 'moonbeam';
const DEFAULT_STORY_SPEED = 'medium';

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(ONBOARDING_KEY);
    return data === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

/**
 * Read the stored parental-consent record (COPPA). Returns the default
 * (un-consented) record if nothing is stored or parsing fails.
 */
export async function getParentConsent(): Promise<ParentConsent> {
  try {
    const data = await AsyncStorage.getItem(PARENT_CONSENT_KEY);
    return data ? JSON.parse(data) : DEFAULT_PARENT_CONSENT;
  } catch {
    return DEFAULT_PARENT_CONSENT;
  }
}

/**
 * True only when a parent has consented for the *current* CONSENT_VERSION.
 * Used by the root layout to gate the app behind `app/parental-consent.tsx`.
 */
export async function getConsentGiven(): Promise<boolean> {
  const consent = await getParentConsent();
  return consent.consented && consent.version >= CONSENT_VERSION;
}

/** Record verifiable parental consent for the current CONSENT_VERSION. */
export async function setParentConsent(): Promise<void> {
  const record: ParentConsent = {
    consented: true,
    consentedAt: Date.now(),
    version: CONSENT_VERSION,
  };
  await AsyncStorage.setItem(PARENT_CONSENT_KEY, JSON.stringify(record));
}

/**
 * COPPA parental-deletion-rights support: removes every AsyncStorage key this
 * app owns (profiles, stories, badges, streaks, settings, consent record,
 * custom heroes, etc.) so a parent can wipe all locally-stored data for their
 * child. Keys are discovered by prefix rather than hardcoded so newly added
 * storage helpers are covered automatically. Does not touch the Supabase
 * session — call `signOut()` separately for that.
 */
export async function clearAllData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const appKeys = keys.filter((k) => k.startsWith('@infinity_heroes_'));
  if (appKeys.length > 0) {
    await AsyncStorage.multiRemove(appKeys);
  }
}

export async function getFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(storyId: string): Promise<string[]> {
  const favorites = await getFavorites();
  const index = favorites.indexOf(storyId);
  const removed = index > -1;
  if (removed) {
    favorites.splice(index, 1);
  } else {
    favorites.push(storyId);
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  await touchSyncMeta('favorites', storyId, removed);
  return favorites;
}

export async function getReadStories(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(READ_STORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function markStoryRead(storyId: string): Promise<void> {
  const readStories = await getReadStories();
  if (!readStories.includes(storyId)) {
    readStories.push(storyId);
    await AsyncStorage.setItem(READ_STORIES_KEY, JSON.stringify(readStories));
    await touchSyncMeta('read', storyId, false);
  }
}

export async function getAllStories(): Promise<CachedStory[]> {
  try {
    const data = await AsyncStorage.getItem(STORIES_KEY);
    const stories: CachedStory[] = data ? JSON.parse(data) : [];
    return stories.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export async function saveStory(
  story: StoryFull,
  heroId: string,
  mode: string,
  avatar?: string,
  voice = DEFAULT_STORY_VOICE,
  speed = DEFAULT_STORY_SPEED,
): Promise<string> {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const cached: CachedStory = {
    id,
    timestamp: Date.now(),
    story,
    heroId,
    mode,
    voice,
    speed,
    ...(avatar ? { avatar } : {}),
  };
  const stories = await getAllStories();
  stories.push(cached);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  return id;
}

export async function deleteStory(id: string): Promise<void> {
  const stories = await getAllStories();
  const filtered = stories.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(filtered));
}

/**
 * Bulk-merge stories pulled from cloud sync (M3). Upserts by id and removes the
 * given ids (tombstones). Synced stories arrive WITHOUT base64 blobs
 * (`avatar`/`scenes` are stripped before sync), so when an incoming story lacks
 * them we preserve any blobs already on the local copy — the newer metadata
 * shouldn't wipe locally-generated images.
 */
export async function mergeSyncedStories(
  upserts: CachedStory[],
  deletedIds: string[],
): Promise<void> {
  const existing = await getAllStories();
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const incoming of upserts) {
    const prev = byId.get(incoming.id);
    byId.set(incoming.id, {
      ...incoming,
      avatar: incoming.avatar ?? prev?.avatar,
      scenes: incoming.scenes ?? prev?.scenes,
    });
  }
  for (const id of deletedIds) byId.delete(id);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify([...byId.values()]));
}

export async function saveStoryScene(
  id: string,
  partIndex: number,
  imageDataUri: string
): Promise<void> {
  const stories = await getAllStories();
  const story = stories.find((s) => s.id === id);
  if (!story) return;
  if (!story.scenes) story.scenes = {};
  story.scenes[partIndex] = imageDataUri;
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export async function updateFeedback(
  id: string,
  rating: number,
  text: string
): Promise<void> {
  const stories = await getAllStories();
  const story = stories.find((s) => s.id === id);
  if (!story) return;
  story.feedback = { rating, text, timestamp: Date.now() };
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(PREFERENCES_KEY);
    return data ? JSON.parse(data) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function getProfiles(): Promise<ChildProfile[]> {
  try {
    const data = await AsyncStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveProfile(profile: ChildProfile): Promise<void> {
  const profiles = await getProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx > -1) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function deleteProfile(id: string): Promise<void> {
  const profiles = await getProfiles();
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.filter((p) => p.id !== id)));
}

export async function getActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveProfileId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } else {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

export async function saveStoryWithProfile(
  story: StoryFull,
  heroId: string,
  mode: string,
  profileId?: string,
  avatar?: string,
  voice = DEFAULT_STORY_VOICE,
  speed = DEFAULT_STORY_SPEED,
): Promise<string> {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const cached: CachedStory = {
    id,
    timestamp: Date.now(),
    story,
    heroId,
    mode,
    voice,
    speed,
    profileId,
    ...(avatar ? { avatar } : {}),
  };
  const stories = await getAllStories();
  stories.push(cached);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  return id;
}

export async function getStoriesForProfile(profileId: string): Promise<CachedStory[]> {
  const all = await getAllStories();
  return all.filter((s) => s.profileId === profileId);
}

export async function getBadges(profileId: string): Promise<EarnedBadge[]> {
  try {
    const data = await AsyncStorage.getItem(BADGES_KEY);
    const all: EarnedBadge[] = data ? JSON.parse(data) : [];
    return all.filter((b) => b.profileId === profileId);
  } catch {
    return [];
  }
}

export async function getAllBadges(): Promise<EarnedBadge[]> {
  try {
    const data = await AsyncStorage.getItem(BADGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function awardBadge(badge: EarnedBadge): Promise<boolean> {
  const all = await getAllBadges();
  if (all.some((b) => b.id === badge.id && b.profileId === badge.profileId)) {
    return false;
  }
  all.push(badge);
  await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(all));
  return true;
}

/**
 * Bulk-merge badges pulled from cloud sync (M3). Upserts by badge id and removes
 * tombstoned ids. Badges carry all their fields, so no blob-preservation needed.
 */
export async function mergeSyncedBadges(
  upserts: EarnedBadge[],
  deletedIds: string[],
): Promise<void> {
  const existing = await getAllBadges();
  const byId = new Map(existing.map((b) => [b.id, b]));
  for (const badge of upserts) byId.set(badge.id, badge);
  for (const id of deletedIds) byId.delete(id);
  await AsyncStorage.setItem(BADGES_KEY, JSON.stringify([...byId.values()]));
}

/**
 * Bulk-merge streaks pulled from cloud sync (M3). Streaks are keyed by
 * profileId (one per profile), so that is the record/merge key.
 */
export async function mergeSyncedStreaks(
  upserts: StreakData[],
  deletedProfileIds: string[],
): Promise<void> {
  const data = await AsyncStorage.getItem(STREAKS_KEY);
  const existing: StreakData[] = data ? JSON.parse(data) : [];
  const byProfile = new Map(existing.map((s) => [s.profileId, s]));
  for (const streak of upserts) byProfile.set(streak.profileId, streak);
  for (const pid of deletedProfileIds) byProfile.delete(pid);
  await AsyncStorage.setItem(STREAKS_KEY, JSON.stringify([...byProfile.values()]));
}

export async function getAllStreaks(): Promise<StreakData[]> {
  try {
    const data = await AsyncStorage.getItem(STREAKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ---- Cloud sync: change-time sidecar for timestamp-less set entities --------
// `favorites` and `read` are plain string[] sets with no per-item timestamps,
// which last-write-wins sync needs. This sidecar records an { updatedAt, deleted }
// entry per (entity, id) whenever the set changes, so a toggle on one device can
// win/lose against another. Covered by the @infinity_heroes_ prefix wipe in
// clearAllData.

const SYNC_META_KEY = '@infinity_heroes_sync_meta';

interface SyncMetaEntry {
  updatedAt: number;
  deleted: boolean;
}
type SyncSetEntity = 'favorites' | 'read';

async function getSyncMetaStore(): Promise<Record<string, Record<string, SyncMetaEntry>>> {
  try {
    const data = await AsyncStorage.getItem(SYNC_META_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

const setKeyForSyncEntity = (entity: SyncSetEntity) =>
  entity === 'favorites' ? FAVORITES_KEY : READ_STORIES_KEY;

/** Stamp a change to a set item so cloud sync can resolve it by last-write-wins. */
async function touchSyncMeta(entity: SyncSetEntity, id: string, deleted: boolean): Promise<void> {
  const store = await getSyncMetaStore();
  const meta = store[entity] ?? {};
  meta[id] = { updatedAt: Date.now(), deleted };
  store[entity] = meta;
  await AsyncStorage.setItem(SYNC_META_KEY, JSON.stringify(store));
}

/** Build sync records for a set entity from its ids + the change-time sidecar. */
export async function getSyncSetRecords(
  entity: SyncSetEntity,
): Promise<{ id: string; updatedAt: number; deleted: boolean }[]> {
  const raw = await AsyncStorage.getItem(setKeyForSyncEntity(entity));
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const meta = (await getSyncMetaStore())[entity] ?? {};
  const present = new Set(ids);
  const records = ids.map((id) => ({ id, updatedAt: meta[id]?.updatedAt ?? 0, deleted: false }));
  // Tombstones: removed items still tracked in the sidecar.
  for (const [id, m] of Object.entries(meta)) {
    if (!present.has(id) && m.deleted) records.push({ id, updatedAt: m.updatedAt, deleted: true });
  }
  return records;
}

/** Apply reconciled set records — update both the membership set and the sidecar. */
export async function applySyncedSet(
  entity: SyncSetEntity,
  records: { id: string; updatedAt: number; deleted: boolean }[],
): Promise<void> {
  const raw = await AsyncStorage.getItem(setKeyForSyncEntity(entity));
  const set = new Set<string>(raw ? JSON.parse(raw) : []);
  const store = await getSyncMetaStore();
  const meta = store[entity] ?? {};
  for (const r of records) {
    meta[r.id] = { updatedAt: r.updatedAt, deleted: r.deleted };
    if (r.deleted) set.delete(r.id);
    else set.add(r.id);
  }
  store[entity] = meta;
  await AsyncStorage.setItem(setKeyForSyncEntity(entity), JSON.stringify([...set]));
  await AsyncStorage.setItem(SYNC_META_KEY, JSON.stringify(store));
}

/**
 * Merge synced profile stubs (id + createdAt ONLY — no PII). For an unknown id,
 * create an editable placeholder profile so synced badges/streaks for it have a
 * local anchor; the parent renames it (name/age never sync). Existing profiles
 * are never overwritten (their local PII is preserved).
 */
export async function mergeSyncedProfileStubs(
  stubs: { id: string; createdAt: number }[],
  deletedIds: string[],
): Promise<void> {
  const profiles = await getProfiles();
  const byId = new Map(profiles.map((p) => [p.id, p]));
  for (const stub of stubs) {
    const existing = byId.get(stub.id);
    if (existing) {
      byId.set(stub.id, { ...existing, createdAt: stub.createdAt });
    } else {
      byId.set(stub.id, {
        id: stub.id,
        name: 'New Profile',
        age: 6,
        favoriteHeroId: HEROES[0]?.id ?? '',
        avatarEmoji: '🌟',
        createdAt: stub.createdAt,
      });
    }
  }
  for (const id of deletedIds) byId.delete(id);
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify([...byId.values()]));
}

export async function getStreak(profileId: string): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STREAKS_KEY);
    const all: StreakData[] = data ? JSON.parse(data) : [];
    return all.find((s) => s.profileId === profileId) || {
      profileId,
      currentStreak: 0,
      longestStreak: 0,
      lastStoryDate: '',
    };
  } catch {
    return { profileId, currentStreak: 0, longestStreak: 0, lastStoryDate: '' };
  }
}

export async function updateStreak(profileId: string): Promise<StreakData> {
  const data = await AsyncStorage.getItem(STREAKS_KEY);
  const all: StreakData[] = data ? JSON.parse(data) : [];
  let streak = all.find((s) => s.profileId === profileId);

  const today = new Date().toISOString().split('T')[0];

  if (!streak) {
    streak = { profileId, currentStreak: 1, longestStreak: 1, lastStoryDate: today };
    all.push(streak);
  } else if (streak.lastStoryDate === today) {
    return streak;
  } else {
    const lastDate = new Date(streak.lastStoryDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastStoryDate = today;
  }

  await AsyncStorage.setItem(STREAKS_KEY, JSON.stringify(all));
  return streak;
}

export async function checkAndAwardBadges(
  profileId: string,
  storyId: string,
  mode: string,
  heroId: string,
): Promise<EarnedBadge[]> {
  const stories = await getStoriesForProfile(profileId);
  const streak = await getStreak(profileId);
  const customHeroes = await getCustomHeroes();
  const existing = await getBadges(profileId);
  const existingIds = new Set(existing.map((b) => b.id));

  const earned = evaluateBadges({
    profileId,
    stories,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    customHeroIds: customHeroes.map(h => h.id),
    currentStoryHour: new Date().getHours(),
    storyId,
  });

  const newBadges: EarnedBadge[] = [];
  for (const badge of earned) {
    if (existingIds.has(badge.id)) continue;
    const wasNew = await awardBadge(badge);
    if (wasNew) {
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Hash a PIN with a salt using SHA-256 via expo-crypto.
 * Returns the hex digest.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const { digestStringAsync, CryptoDigestAlgorithm } = await import('expo-crypto');
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, salt + pin);
}

/**
 * Generate a random salt for PIN hashing.
 */
export async function generatePinSalt(): Promise<string> {
  const { getRandomBytes } = await import('expo-crypto');
  const bytes = getRandomBytes(16);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Check if parent controls are currently locked out due to failed attempts.
 */
export function isPinLockedOut(controls: ParentControls): boolean {
  if (controls.lockoutUntil === 0) return false;
  return Date.now() < controls.lockoutUntil;
}

/**
 * Record a failed PIN attempt. Returns updated controls.
 */
export async function recordFailedPinAttempt(controls: ParentControls): Promise<ParentControls> {
  const updated = { ...controls };
  updated.failedAttempts = (updated.failedAttempts || 0) + 1;
  if (updated.failedAttempts >= MAX_PIN_ATTEMPTS) {
    updated.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    updated.failedAttempts = 0; // Reset counter after lockout
  }
  await saveParentControls(updated);
  return updated;
}

/**
 * Reset failed attempts on successful unlock.
 */
export async function resetPinAttempts(controls: ParentControls): Promise<ParentControls> {
  const updated = { ...controls, failedAttempts: 0, lockoutUntil: 0 };
  await saveParentControls(updated);
  return updated;
}

export async function getParentControls(): Promise<ParentControls> {
  try {
    const data = await AsyncStorage.getItem(PARENT_CONTROLS_KEY);
    return data ? JSON.parse(data) : DEFAULT_PARENT_CONTROLS;
  } catch {
    return DEFAULT_PARENT_CONTROLS;
  }
}

export async function saveParentControls(controls: ParentControls): Promise<void> {
  await AsyncStorage.setItem(PARENT_CONTROLS_KEY, JSON.stringify(controls));
}
