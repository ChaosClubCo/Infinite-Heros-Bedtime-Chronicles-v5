import { HEROES } from '@/constants/heroes';
import type { EarnedBadge, CachedStory } from '@/constants/types';

export type BadgeId =
  | 'first-adventure'
  | 'night-owl'
  | 'early-bird'
  | 'all-heroes'
  | 'mad-libs-master'
  | 'dream-weaver'
  | 'classic-champion'
  | 'story-streak-3'
  | 'story-streak-7'
  | 'bookworm'
  | 'legend'
  | 'vocabulary-star';

export interface BadgeDefinition {
  id: BadgeId;
  emoji: string;
  title: string;
  description: string;
  condition: string;
  target: number;
  hint: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-adventure',
    emoji: '🌟',
    title: 'First Adventure',
    description: 'Completed your very first story!',
    condition: 'first_story',
    target: 1,
    hint: 'Complete your first bedtime story!',
  },
  {
    id: 'night-owl',
    emoji: '🦉',
    title: 'Night Owl',
    description: 'Listened to a story after 8 PM',
    condition: 'night_story',
    target: 1,
    hint: 'Listen to a story after 8 PM.',
  },
  {
    id: 'early-bird',
    emoji: '🐦',
    title: 'Early Bird',
    description: 'Started a story in the morning',
    condition: 'morning_story',
    target: 1,
    hint: 'Start a story in the morning (5 AM - 10 AM).',
  },
  {
    id: 'all-heroes',
    emoji: '🏆',
    title: 'Hero Collector',
    description: 'Played with all heroes!',
    condition: 'all_heroes',
    target: 8,
    hint: 'Play with all stock and custom heroes!',
  },
  {
    id: 'mad-libs-master',
    emoji: '🤪',
    title: 'Silly Storyteller',
    description: 'Completed 3 Mad Libs stories',
    condition: 'madlibs_3',
    target: 3,
    hint: 'Complete 3 Mad Libs stories.',
  },
  {
    id: 'dream-weaver',
    emoji: '🌙',
    title: 'Dream Weaver',
    description: 'Completed 3 Sleep mode stories',
    condition: 'sleep_3',
    target: 3,
    hint: 'Complete 3 Sleep mode stories.',
  },
  {
    id: 'classic-champion',
    emoji: '⚔️',
    title: 'Classic Champion',
    description: 'Completed 5 Classic stories',
    condition: 'classic_5',
    target: 5,
    hint: 'Complete 5 Classic stories.',
  },
  {
    id: 'story-streak-3',
    emoji: '🔥',
    title: 'On Fire!',
    description: '3-day story streak',
    condition: 'streak_3',
    target: 3,
    hint: 'Reach a 3-day story streak.',
  },
  {
    id: 'story-streak-7',
    emoji: '💎',
    title: 'Diamond Reader',
    description: '7-day story streak',
    condition: 'streak_7',
    target: 7,
    hint: 'Reach a 7-day story streak.',
  },
  {
    id: 'bookworm',
    emoji: '📚',
    title: 'Bookworm',
    description: 'Completed 10 stories total',
    condition: 'total_10',
    target: 10,
    hint: 'Complete 10 stories total.',
  },
  {
    id: 'legend',
    emoji: '👑',
    title: 'Story Legend',
    description: 'Completed 25 stories total',
    condition: 'total_25',
    target: 25,
    hint: 'Complete 25 stories total.',
  },
  {
    id: 'vocabulary-star',
    emoji: '📖',
    title: 'Word Wizard',
    description: 'Learned 5 vocabulary words on your adventures!',
    condition: 'vocab_5',
    target: 5,
    hint: 'Learn 5 vocabulary words on your adventures!',
  },
];

export interface BadgeState {
  profileId: string;
  stories: CachedStory[];
  currentStreak: number;
  longestStreak: number;
  currentStoryHour?: number;
  customHeroIds?: string[];
  storyId?: string;
}

export function evaluateBadges(state: BadgeState): EarnedBadge[] {
  const earned: EarnedBadge[] = [];
  for (const def of BADGE_DEFINITIONS) {
    const { current, target } = getBadgeProgress(def.id, state);
    if (current >= target) {
      earned.push({
        id: def.id,
        emoji: def.emoji,
        title: def.title,
        description: def.description,
        earnedAt: Date.now(),
        profileId: state.profileId,
        storyId: state.storyId,
      });
    }
  }
  return earned;
}

export function getBadgeProgress(badgeId: string, state: BadgeState): { current: number; target: number } {
  const totalStories = state.stories.length;
  
  switch (badgeId) {
    case 'first-adventure': {
      return { current: totalStories >= 1 ? 1 : 0, target: 1 };
    }
    case 'night-owl': {
      const hasNight = state.stories.some(s => {
        const hr = new Date(s.timestamp).getHours();
        return hr >= 20;
      }) || (state.currentStoryHour !== undefined && state.currentStoryHour >= 20);
      return { current: hasNight ? 1 : 0, target: 1 };
    }
    case 'early-bird': {
      const hasMorning = state.stories.some(s => {
        const hr = new Date(s.timestamp).getHours();
        return hr >= 5 && hr < 10;
      }) || (state.currentStoryHour !== undefined && state.currentStoryHour >= 5 && state.currentStoryHour < 10);
      return { current: hasMorning ? 1 : 0, target: 1 };
    }
    case 'all-heroes': {
      const uniqueHeroesUsed = new Set(state.stories.map(s => s.heroId));
      return { current: Math.min(uniqueHeroesUsed.size, 8), target: 8 };
    }
    case 'mad-libs-master': {
      const count = state.stories.filter(s => s.mode === 'madlibs').length;
      return { current: Math.min(count, 3), target: 3 };
    }
    case 'dream-weaver': {
      const count = state.stories.filter(s => s.mode === 'sleep').length;
      return { current: Math.min(count, 3), target: 3 };
    }
    case 'classic-champion': {
      const count = state.stories.filter(s => s.mode === 'classic').length;
      return { current: Math.min(count, 5), target: 5 };
    }
    case 'story-streak-3': {
      return { current: Math.min(state.currentStreak, 3), target: 3 };
    }
    case 'story-streak-7': {
      return { current: Math.min(state.currentStreak, 7), target: 7 };
    }
    case 'bookworm': {
      return { current: Math.min(totalStories, 10), target: 10 };
    }
    case 'legend': {
      return { current: Math.min(totalStories, 25), target: 25 };
    }
    case 'vocabulary-star': {
      const uniqueVocab = new Set(
        state.stories
          .map(s => s.story?.vocabWord?.word)
          .filter((word): word is string => typeof word === 'string' && word.trim() !== '')
      );
      return { current: Math.min(uniqueVocab.size, 5), target: 5 };
    }
    default:
      return { current: 0, target: 1 };
  }
}
