export interface StoryPart {
  text: string;
  choices?: string[];
  partIndex: number;
}

export interface StoryFull {
  title: string;
  parts: StoryPart[];
  vocabWord: { word: string; definition: string };
  joke: string;
  lesson: string;
  tomorrowHook: string;
  rewardBadge: { emoji: string; title: string; description: string };
}

export interface CachedStory {
  id: string;
  timestamp: number;
  story: StoryFull;
  avatar?: string;
  scenes?: Record<number, string>;
  heroId: string;
  mode: string;
  voice: string;
  speed: string;
  profileId?: string;
  feedback?: {
    rating: number;
    text: string;
    timestamp: number;
  };
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  favoriteHeroId: string;
  avatarEmoji: string;
  createdAt: number;
}

export interface EarnedBadge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earnedAt: number;
  storyId?: string;
  profileId: string;
}

export interface StreakData {
  profileId: string;
  currentStreak: number;
  longestStreak: number;
  lastStoryDate: string;
  /**
   * ms-epoch of the last streak mutation. Stamped by `updateStreak` so cloud
   * sync (M3) can resolve two same-calendar-day updates by last-write-wins —
   * `lastStoryDate` alone has only day granularity and would tie. Optional so
   * legacy records (pre-sync) still parse; `streakToRecord` falls back to
   * `Date.parse(lastStoryDate)` when absent.
   */
  lastUpdatedAt?: number;
}

export interface ParentControls {
  maxStoryLength: string;
  bedtimeHour: number;
  bedtimeMinute: number;
  bedtimeEnabled: boolean;
  allowedThemes: string[];
  pinCode: string;        // Now stores SHA-256 hash, not plaintext
  pinSalt: string;        // Random salt for PIN hashing
  failedAttempts: number;  // Brute-force counter
  lockoutUntil: number;    // Timestamp when lockout expires (0 = not locked)
  videoEnabled: boolean;
}

export const DEFAULT_PARENT_CONTROLS: ParentControls = {
  maxStoryLength: 'epic',
  bedtimeHour: 20,
  bedtimeMinute: 0,
  bedtimeEnabled: false,
  allowedThemes: ['courage', 'kindness', 'friendship', 'wonder', 'imagination', 'comfort'],
  pinCode: '',
  pinSalt: '',
  failedAttempts: 0,
  lockoutUntil: 0,
  videoEnabled: false,
};

/**
 * Verifiable parental consent (COPPA). Legacy records may omit the attestation
 * fields; the active consent gate rejects any record that does not contain all
 * current values.
 */
export type ConsentVerificationMethod = 'parent-gate-arithmetic-v1';

export interface ParentConsent {
  consented: boolean;
  consentedAt: number;  // epoch ms when consent was given (0 = never)
  version: number;      // CONSENT_VERSION at the time consent was given
  contentHash?: string; // SHA-256 of CONSENT_CONTENT_HASH_SOURCE
  locale?: string;      // BCP-47 locale observed at acceptance
  verificationMethod?: ConsentVerificationMethod;
}

/**
 * Version 3 makes first-release voice containment explicit and adds a content
 * hash, locale, and parent-gate method to every accepted record. Existing
 * version-2 records must be collected again.
 */
export const CONSENT_VERSION = 3;
export const CONSENT_VERIFICATION_METHOD: ConsentVerificationMethod = 'parent-gate-arithmetic-v1';

export const CONSENT_DISCLOSURES = [
  {
    id: 'local-profile',
    text: 'Child profile name and age stay on this device. The server accepts older client fields for compatibility but discards those values before story or suggestion prompts are built for AI providers.',
  },
  {
    id: 'cloud-backup',
    text: 'A parent account and cloud backup are optional. When enabled, Supabase stores the parent account plus stories and progress; the cloud profile stub excludes the child’s name and age.',
  },
  {
    id: 'voice-disabled',
    text: 'Voice Chat and audio recording are disabled in this release. The app does not request microphone access or send audio while disabled. Any future audio feature requires a new consent version and separate privacy, safety, and device approval.',
  },
  {
    id: 'child-safety',
    text: 'Child-facing AI text is generated under a child-safety policy and checked before it is displayed or narrated. There are no ads, public child profiles, stranger chat, or behavioral advertising.',
  },
  {
    id: 'deletion',
    text: 'Delete All Data removes the parent account, cloud backup records, retained chat history, and local device data.',
  },
] as const;

export const CONSENT_CONTENT_HASH_SOURCE = JSON.stringify({
  version: CONSENT_VERSION,
  disclosures: CONSENT_DISCLOSURES,
  privacyPath: '/privacy',
});

export const DEFAULT_PARENT_CONSENT: ParentConsent = {
  consented: false,
  consentedAt: 0,
  version: 0,
  contentHash: '',
  locale: '',
};

export interface UserPreferences {
  narratorVoice: string;
  storyLength: string;
  sleepTheme: string;
  fontSize: 'normal' | 'large';
  isMuted: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  narratorVoice: 'Kore',
  storyLength: 'medium',
  sleepTheme: 'Cloud Kingdom',
  fontSize: 'normal',
  isMuted: false,
  reducedMotion: false,
};

export const AVATAR_EMOJIS = ['🦸', '🧙', '🦊', '🐱', '🦄', '🌟', '🚀', '🦋', '🐼', '🦁', '🐸', '🌈'];

import { BADGE_DEFINITIONS } from '@/lib/badges';
export { BADGE_DEFINITIONS };


export const CONTENT_THEMES = [
  { id: 'courage', label: 'Courage', emoji: '🦁' },
  { id: 'kindness', label: 'Kindness', emoji: '💗' },
  { id: 'friendship', label: 'Friendship', emoji: '🤝' },
  { id: 'wonder', label: 'Wonder', emoji: '✨' },
  { id: 'imagination', label: 'Imagination', emoji: '🌈' },
  { id: 'comfort', label: 'Comfort', emoji: '🧸' },
];
