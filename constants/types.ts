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
