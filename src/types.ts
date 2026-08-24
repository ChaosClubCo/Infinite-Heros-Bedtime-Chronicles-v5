export type StoryMode = "classic" | "madlibs" | "sleep";
export type ContentTheme = "courage" | "kindness" | "friendship" | "wonder" | "imagination" | "comfort";
export type AgeRange = "2-4" | "4-6" | "6-8" | "8-10";

export interface Hero {
  id: string;
  name: string;
  title: string;
  power: string;
  description: string;
  icon: string;
  color: string;
  gradient: [string, string];
  constellation: string;
  avatarBg: string;
}

export interface StoryChoice {
  id: string;
  text: string;
  action: string;
  nextSceneId: string;
}

export interface StoryScene {
  id: string;
  sceneNumber: number;
  totalScenes?: number;
  text: string;
  sleepAffirmation?: string;
  illustrationPrompt?: string;
  soundEffect?: string;
  choices?: StoryChoice[];
  isFinal?: boolean;
}

export interface Story {
  id: string;
  title: string;
  category: string;
  theme: ContentTheme;
  mode: StoryMode;
  ageRange: AgeRange;
  heroId: string;
  heroName: string;
  summary: string;
  coverImage?: string;
  badge?: string;
  scenes: StoryScene[];
  createdAt?: string;
  isCustom?: boolean;
  isSaved?: boolean;
  completedAt?: string;
  audioDurationMinutes?: number;
}

export interface StorySeed {
  id: string;
  title: string;
  blurb: string;
  theme: ContentTheme;
  ageRange: AgeRange;
  mode: StoryMode;
  suggestedHeroId: string;
  setting?: string;
  tone?: string;
  sidekick?: string;
  problem?: string;
  emoji: string;
}

export interface CelestialBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: "starter" | "theme" | "streak" | "explorer";
}

export interface CompletedStoryRecord {
  id: string;
  title: string;
  heroName?: string;
  category?: string;
  completedAt?: string;
}

export interface UserStats {
  storiesCompleted: number;
  totalReadingMinutes: number;
  currentStreak: number;
  lastReadDate?: string;
  favoriteHeroId: string;
  completedStoriesList?: CompletedStoryRecord[];
}

export interface AppSettings {
  narratorVoice: string;
  readingSpeed: "gentle" | "medium" | "normal";
  ambientSound: "none" | "rain" | "ocean" | "crickets" | "wind" | "fire" | "train";
  ambientVolume: number;
  autoAdvance: boolean;
  sleepTimerMinutes: number;
  parentPin: string;
  childName: string;
  childAge: number;
  childAvatar?: string;
  themeMode: "dark" | "starlight";
}

export interface DreamJournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: "peaceful" | "magical" | "adventurous" | "cozy" | "funny";
  tags: string[];
  bedtimeStoryTitle?: string;
  sleepRating: number; // 1 to 5 stars
}
