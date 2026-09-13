import { Story, StoryMood } from '../types';

export interface MoodFilterItem {
  id: StoryMood | 'all';
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  pillClass: {
    base: string;
    active: string;
    badge: string;
  };
}

export const STORY_MOOD_CONFIGS: Record<StoryMood, {
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
  };
}> = {
  Peaceful: {
    label: 'Peaceful',
    emoji: '🌙',
    tagline: 'Calm & Soothing',
    description: 'Gentle lullabies, tranquil starlight, and soothing bedtime rest',
    colorClass: {
      bg: 'bg-indigo-950/60',
      border: 'border-indigo-500/40',
      text: 'text-indigo-200',
      badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
    },
  },
  Curious: {
    label: 'Curious',
    emoji: '🔍',
    tagline: 'Wonder & Discovery',
    description: 'Mysterious constellations, starry secrets, and magical discoveries',
    colorClass: {
      bg: 'bg-purple-950/60',
      border: 'border-purple-500/40',
      text: 'text-purple-200',
      badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    },
  },
  Energizing: {
    label: 'Energizing',
    emoji: '⚡',
    tagline: 'Playful & Bold',
    description: 'Heroic adventures, courageous missions, and playful giggles',
    colorClass: {
      bg: 'bg-amber-950/60',
      border: 'border-amber-500/40',
      text: 'text-amber-200',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    },
  },
  Dreamy: {
    label: 'Dreamy',
    emoji: '☁️',
    tagline: 'Soft & Drifting',
    description: 'Pastel cotton candy skies, soft clouds, and sweet daydreaming',
    colorClass: {
      bg: 'bg-rose-950/60',
      border: 'border-rose-500/40',
      text: 'text-rose-200',
      badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
    },
  },
};

export const MOOD_FILTER_ITEMS: MoodFilterItem[] = [
  {
    id: 'all',
    label: 'All Moods',
    emoji: '✨',
    tagline: 'Every bedtime feeling',
    description: 'Browse the entire starlight collection of chronicles',
    pillClass: {
      base: 'bg-slate-900/80 border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white',
      active: 'bg-slate-100 text-slate-950 border-white shadow-md font-bold',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
    },
  },
  {
    id: 'Peaceful',
    label: 'Peaceful',
    emoji: '🌙',
    tagline: 'Calm & Soothing',
    description: 'Gentle lullabies and quiet cosmic drift',
    pillClass: {
      base: 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300 hover:border-indigo-400 hover:text-white',
      active: 'bg-indigo-600 text-white border-indigo-300 shadow-md font-bold',
      badge: 'bg-indigo-900/60 text-indigo-200 border-indigo-700/50',
    },
  },
  {
    id: 'Curious',
    label: 'Curious',
    emoji: '🔍',
    tagline: 'Wonder & Discovery',
    description: 'Constellations, mysteries & secrets',
    pillClass: {
      base: 'bg-purple-950/40 border-purple-800/60 text-purple-300 hover:border-purple-400 hover:text-white',
      active: 'bg-purple-600 text-white border-purple-300 shadow-md font-bold',
      badge: 'bg-purple-900/60 text-purple-200 border-purple-700/50',
    },
  },
  {
    id: 'Energizing',
    label: 'Energizing',
    emoji: '⚡',
    tagline: 'Playful & Bold',
    description: 'Heroic quests and playful adventures',
    pillClass: {
      base: 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:border-amber-400 hover:text-white',
      active: 'bg-amber-600 text-white border-amber-300 shadow-md font-bold',
      badge: 'bg-amber-900/60 text-amber-200 border-amber-700/50',
    },
  },
  {
    id: 'Dreamy',
    label: 'Dreamy',
    emoji: '☁️',
    tagline: 'Soft & Drifting',
    description: 'Pastel clouds and sweet vanilla breezes',
    pillClass: {
      base: 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:border-rose-400 hover:text-white',
      active: 'bg-rose-600 text-white border-rose-300 shadow-md font-bold',
      badge: 'bg-rose-900/60 text-rose-200 border-rose-700/50',
    },
  },
];

/**
 * Determine a story's mood reliably from its metadata or explicit field.
 */
export function getStoryMood(story: Story): StoryMood {
  if (story.mood) return story.mood;

  const id = story.id.toLowerCase();
  const text = `${story.title} ${story.summary} ${story.category} ${story.badge || ''} ${(story.tags || []).join(' ')} ${story.theme}`.toLowerCase();

  // 1. Explicit ID mappings for curated library stories
  if (
    id.includes('starry-whales') ||
    id.includes('galactic-lullaby') ||
    id.includes('sleeping-forest') ||
    id.includes('crystal-river') ||
    id.includes('gentle-waves') ||
    id.includes('snowy-blanket') ||
    id.includes('coral-slumber') ||
    id.includes('whispering-wind') ||
    id.includes('cloud-cradle') ||
    id.includes('sleepy-valley')
  ) {
    return 'Peaceful';
  }

  if (
    id.includes('midnight-explorers') ||
    id.includes('stardust-dreams') ||
    id.includes('boy-caught-star') ||
    id.includes('constellation-quest') ||
    id.includes('moon-owl') ||
    id.includes('galaxy-book') ||
    id.includes('silver-moon-fox') ||
    id.includes('hollow-tree') ||
    id.includes('library-stars') ||
    id.includes('coral-lagoon')
  ) {
    return 'Curious';
  }

  if (
    id.includes('candy-cloud') ||
    id.includes('cotton-candy')
  ) {
    return 'Dreamy';
  }

  if (
    id.includes('journey-core') ||
    id.includes('astro-pups') ||
    id.includes('planet-giggles') ||
    id.includes('cloud-hopper')
  ) {
    return 'Energizing';
  }

  // 2. Keyword-based heuristics for user-created / AI-generated stories
  if (
    text.includes('lullaby') ||
    text.includes('soothe') ||
    text.includes('peaceful') ||
    text.includes('sleepy') ||
    text.includes('slumber') ||
    text.includes('calm') ||
    text.includes('tranquil')
  ) {
    return 'Peaceful';
  }

  if (
    text.includes('dreamy') ||
    text.includes('candy cloud') ||
    text.includes('vanilla') ||
    text.includes('strawberry') ||
    text.includes('marshmallow')
  ) {
    return 'Dreamy';
  }

  if (
    text.includes('energiz') ||
    text.includes('giggles') ||
    text.includes('pups') ||
    text.includes('courage') ||
    text.includes('quest to the core') ||
    text.includes('adventurous') ||
    text.includes('rocket')
  ) {
    return 'Energizing';
  }

  if (
    text.includes('curious') ||
    text.includes('wonder') ||
    text.includes('explor') ||
    text.includes('constellation') ||
    text.includes('mystery') ||
    text.includes('library of stars') ||
    text.includes('secret') ||
    text.includes('discovery') ||
    text.includes('lantern')
  ) {
    return 'Curious';
  }

  // Bedtime default
  return 'Peaceful';
}

/**
 * Helper to get display information for a given story mood.
 */
export function getMoodBadgeInfo(mood: StoryMood) {
  return STORY_MOOD_CONFIGS[mood] || STORY_MOOD_CONFIGS.Peaceful;
}
