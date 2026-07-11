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
 * Verifiable parental consent (COPPA). Recorded once a parent passes the
 * parent gate and affirms consent on `app/parental-consent.tsx`. The app
 * blocks all data-collecting / AI features until `consented` is true for the
 * current `CONSENT_VERSION`; bumping the version re-prompts existing installs.
 */
export interface ParentConsent {
  consented: boolean;
  consentedAt: number;  // epoch ms when consent was given (0 = never)
  version: number;      // CONSENT_VERSION at the time consent was given
}

/** Bump when the privacy practices materially change to re-prompt for consent. */
export const CONSENT_VERSION = 1;

export const DEFAULT_PARENT_CONSENT: ParentConsent = {
  consented: false,
  consentedAt: 0,
  version: 0,
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
