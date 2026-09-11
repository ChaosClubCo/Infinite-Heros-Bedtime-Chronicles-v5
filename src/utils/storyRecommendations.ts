import { Story, AgeRange, ContentTheme } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';
import { DREAM_THEMES } from '../data/dreamThemes';
import { STORY_SEEDS } from '../data/storySeeds';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';

export interface SavedThemeMeta {
  id: string;
  title: string;
  category: string;
  subtitle?: string;
  keywords: string[];
  storyThemes: ContentTheme[];
  storyCategories: string[];
  emoji: string;
}

export interface RecommendedStoryItem {
  story: Story;
  score: number;
  matchedAge: boolean;
  ageRange: AgeRange;
  matchedThemeTitle?: string;
  matchedThemeId?: string;
  matchReasons: string[];
  isPerfectMatch: boolean;
}

const THEME_PRESETS: Record<string, Omit<SavedThemeMeta, 'id' | 'title' | 'category' | 'subtitle'>> = {
  'theme-cosmic-voyage': {
    storyCategories: ['Cosmic Adventures', 'Bedtime Calm'],
    storyThemes: ['wonder', 'imagination'],
    keywords: ['cosmic', 'star', 'stars', 'galaxy', 'moon', 'sky', 'stardust', 'voyage', 'nebula', 'space'],
    emoji: '✨',
  },
  'theme-ancient-forest': {
    storyCategories: ['Forest & Nature', 'Bedtime Calm'],
    storyThemes: ['friendship', 'comfort', 'kindness'],
    keywords: ['forest', 'pine', 'tree', 'oak', 'woods', 'owl', 'moss', 'woodland', 'nature', 'acorn'],
    emoji: '🌲',
  },
  'theme-abyssal-calm': {
    storyCategories: ['Ocean Wonders', 'Bedtime Calm'],
    storyThemes: ['wonder', 'comfort'],
    keywords: ['ocean', 'whale', 'sea', 'water', 'lagoon', 'tide', 'deep', 'coral', 'waves', 'anemone'],
    emoji: '🌊',
  },
  'theme-sky-citadel': {
    storyCategories: ['Cosmic Adventures', 'Bedtime Calm'],
    storyThemes: ['wonder', 'imagination', 'courage'],
    keywords: ['cloud', 'citadel', 'castle', 'floating', 'sunset', 'sky', 'feather', 'hop'],
    emoji: '☁️',
  },
  'theme-crystal-cave': {
    storyCategories: ['Cosmic Adventures', 'Heartwarming Fables'],
    storyThemes: ['wonder', 'courage'],
    keywords: ['crystal', 'cave', 'cavern', 'quartz', 'amethyst', 'singing', 'sparkle', 'glow'],
    emoji: '💎',
  },
  'theme-desert-echo': {
    storyCategories: ['Bedtime Calm', 'Forest & Nature'],
    storyThemes: ['comfort', 'wonder'],
    keywords: ['desert', 'dune', 'sand', 'silver', 'moon', 'lantern', 'quiet', 'stillness'],
    emoji: '🏜️',
  },
  'theme-aurora-glow': {
    storyCategories: ['Cosmic Adventures', 'Bedtime Calm'],
    storyThemes: ['wonder', 'imagination'],
    keywords: ['aurora', 'arctic', 'emerald', 'violet', 'light', 'celestial', 'dance', 'ribbon'],
    emoji: '🌌',
  },
  'theme-clockwork-dreams': {
    storyCategories: ['Cosmic Adventures', 'Heartwarming Fables'],
    storyThemes: ['imagination', 'comfort'],
    keywords: ['clockwork', 'gear', 'brass', 'observatory', 'train', 'pendulum', 'rhythm', 'express'],
    emoji: '⚙️',
  },
  'theme-moonlight-meadow': {
    storyCategories: ['Forest & Nature', 'Bedtime Calm'],
    storyThemes: ['comfort', 'friendship'],
    keywords: ['meadow', 'firefly', 'fireflies', 'flower', 'blossom', 'clover', 'breeze', 'bloom'],
    emoji: '🌸',
  },
  'theme-zenith-peak': {
    storyCategories: ['Cosmic Adventures', 'Forest & Nature'],
    storyThemes: ['wonder', 'courage'],
    keywords: ['peak', 'mountain', 'observatory', 'zenith', 'milky way', 'high', 'cloud', 'sanctuary'],
    emoji: '🏔️',
  },
};

const SEED_CATEGORY_COVERS: Record<string, string> = {
  'Cosmic Adventures': 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
  'Forest & Nature': 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop',
  'Ocean Wonders': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
  'Bedtime Calm': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
  'Heartwarming Fables': 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?q=80&w=800&auto=format&fit=crop',
};

export function getTargetAgeRange(age: number): AgeRange {
  if (age <= 4) return '2-4';
  if (age <= 6) return '4-6';
  if (age <= 8) return '6-8';
  return '8-10';
}

export function isAgeInRange(storyAgeRange: AgeRange, age: number): boolean {
  switch (storyAgeRange) {
    case '2-4':
      return age >= 2 && age <= 4;
    case '4-6':
      return age >= 4 && age <= 6;
    case '6-8':
      return age >= 6 && age <= 8;
    case '8-10':
      return age >= 8 && age <= 10;
    default:
      return false;
  }
}

export function getAgeDistance(storyAgeRange: AgeRange, age: number): number {
  let min = 4;
  let max = 6;
  if (storyAgeRange === '2-4') { min = 2; max = 4; }
  else if (storyAgeRange === '4-6') { min = 4; max = 6; }
  else if (storyAgeRange === '6-8') { min = 6; max = 8; }
  else if (storyAgeRange === '8-10') { min = 8; max = 10; }

  if (age >= min && age <= max) return 0;
  if (age < min) return min - age;
  return age - max;
}

export function resolveSavedThemes(savedThemeIds: string[] = []): SavedThemeMeta[] {
  const result: SavedThemeMeta[] = [];
  const handledIds = new Set<string>();

  // Resolve matching dream themes from saved IDs
  for (const id of savedThemeIds) {
    const dt = DREAM_THEMES.find((t) => t.id === id);
    if (dt && !handledIds.has(dt.id)) {
      handledIds.add(dt.id);
      const preset = THEME_PRESETS[dt.id] || {
        storyCategories: [
          dt.category === 'cosmic'
            ? 'Cosmic Adventures'
            : dt.category === 'nature'
            ? 'Forest & Nature'
            : 'Bedtime Calm',
        ],
        storyThemes: ['wonder', 'comfort'] as ContentTheme[],
        keywords: dt.title.toLowerCase().split(' '),
        emoji: '🌙',
      };

      result.push({
        id: dt.id,
        title: dt.title,
        category: dt.category,
        subtitle: dt.subtitle,
        keywords: preset.keywords,
        storyThemes: preset.storyThemes,
        storyCategories: preset.storyCategories,
        emoji: preset.emoji,
      });
    }
  }

  // If no saved themes or empty array, provide default saved themes
  if (result.length === 0) {
    const defaultThemes = ['theme-cosmic-voyage', 'theme-ancient-forest'];
    for (const id of defaultThemes) {
      const dt = DREAM_THEMES.find((t) => t.id === id);
      if (dt && !handledIds.has(dt.id)) {
        handledIds.add(dt.id);
        const preset = THEME_PRESETS[dt.id];
        if (preset) {
          result.push({
            id: dt.id,
            title: dt.title,
            category: dt.category,
            subtitle: dt.subtitle,
            keywords: preset.keywords,
            storyThemes: preset.storyThemes,
            storyCategories: preset.storyCategories,
            emoji: preset.emoji,
          });
        }
      }
    }
  }

  return result;
}

function computeThemeMatch(
  story: Story,
  themeMeta: SavedThemeMeta
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Direct Category Match
  if (themeMeta.storyCategories.includes(story.category)) {
    score += 12;
    reasons.push(`${themeMeta.title} theme`);
  }

  // 2. Content Theme Match
  if (themeMeta.storyThemes.includes(story.theme)) {
    score += 8;
    if (!reasons.length) {
      reasons.push(`${story.theme.charAt(0).toUpperCase() + story.theme.slice(1)} mood`);
    }
  }

  // 3. Keyword Match in Title, Summary
  const textCorpus = `${story.title} ${story.summary || ''} ${story.category}`.toLowerCase();
  let keywordMatches = 0;
  for (const kw of themeMeta.keywords) {
    if (textCorpus.includes(kw.toLowerCase())) {
      keywordMatches++;
    }
  }

  if (keywordMatches > 0) {
    score += Math.min(keywordMatches * 3, 9);
    if (!reasons.length) {
      reasons.push(themeMeta.title);
    }
  }

  return { score, reasons };
}

export function getRecommendedStories({
  stories = FEATURED_STORIES,
  childAge = 5,
  savedThemeIds = [],
  savedStories = [],
  storyPreference = '',
  selectedThemeFilter = 'all',
  limit = 4,
}: {
  stories?: Story[];
  childAge?: number;
  savedThemeIds?: string[];
  savedStories?: Story[];
  storyPreference?: string;
  selectedThemeFilter?: string;
  limit?: number;
}): RecommendedStoryItem[] {
  const activeSavedThemes = resolveSavedThemes(savedThemeIds);

  // Combine FEATURED_STORIES and savedStories (deduped by ID)
  const candidateMap = new Map<string, Story>();
  for (const s of stories) {
    candidateMap.set(s.id, s);
  }
  for (const s of savedStories) {
    if (s && s.id && !candidateMap.has(s.id)) {
      candidateMap.set(s.id, s);
    }
  }

  const allCandidates = Array.from(candidateMap.values());
  const scoredItems: RecommendedStoryItem[] = [];

  for (const story of allCandidates) {
    // Check age match
    const ageDistance = getAgeDistance(story.ageRange, childAge);
    const matchedAge = ageDistance === 0;
    let ageScore = 0;
    if (ageDistance === 0) ageScore = 15;
    else if (ageDistance === 1) ageScore = 7;
    else ageScore = 2;

    // Check theme matches
    let bestThemeScore = 0;
    let bestThemeName: string | undefined;
    let bestThemeId: string | undefined;
    const allReasons: string[] = [];

    if (matchedAge) {
      allReasons.push(`Ages ${story.ageRange}`);
    }

    for (const themeMeta of activeSavedThemes) {
      const match = computeThemeMatch(story, themeMeta);
      if (match.score > bestThemeScore) {
        bestThemeScore = match.score;
        bestThemeName = themeMeta.title;
        bestThemeId = themeMeta.id;
      }
      if (match.reasons.length > 0 && !allReasons.includes(themeMeta.title)) {
        allReasons.push(themeMeta.title);
      }
    }

    // Story preference bonus
    if (storyPreference) {
      const prefLower = storyPreference.toLowerCase();
      if (
        (prefLower.includes('gentle') && story.mode === 'sleep') ||
        (prefLower.includes('animals') && (story.title.includes('Fox') || story.title.includes('Whale') || story.title.includes('Bear'))) ||
        (prefLower.includes('constellation') && story.category === 'Cosmic Adventures')
      ) {
        bestThemeScore += 4;
      }
    }

    // If a specific saved theme filter is selected
    if (selectedThemeFilter !== 'all') {
      const targetTheme = activeSavedThemes.find((t) => t.id === selectedThemeFilter);
      if (targetTheme) {
        const directMatch = computeThemeMatch(story, targetTheme);
        if (directMatch.score <= 0) {
          // If strictly filtered and does not match the chosen theme, skip candidate
          continue;
        }
        bestThemeScore += 30; // Prioritize strongly
        bestThemeName = targetTheme.title;
        bestThemeId = targetTheme.id;
      }
    }

    const totalScore = ageScore + bestThemeScore;
    const isPerfectMatch = matchedAge && bestThemeScore > 0;

    scoredItems.push({
      story,
      score: totalScore,
      matchedAge,
      ageRange: story.ageRange,
      matchedThemeTitle: bestThemeName,
      matchedThemeId: bestThemeId,
      matchReasons: allReasons,
      isPerfectMatch,
    });
  }

  // Sort by score descending
  scoredItems.sort((a, b) => b.score - a.score);

  // If we have at least 'limit' stories, return top ones
  if (scoredItems.length >= limit) {
    return scoredItems.slice(0, limit);
  }

  // If fewer than limit, augment with matching seeds from STORY_SEEDS
  const existingIds = new Set(scoredItems.map((item) => item.story.id));
  const candidateSeeds = STORY_SEEDS.filter(
    (seed) => !existingIds.has(seed.id) && !existingIds.has(`seed-${seed.id}`)
  );

  for (const seed of candidateSeeds) {
    if (scoredItems.length >= limit) break;

    const ageDistance = getAgeDistance(seed.ageRange, childAge);
    const matchedAge = ageDistance === 0;

    // Filter by selected theme if active
    let matchesSelectedFilter = true;
    let matchingThemeName: string | undefined;
    let matchingThemeId: string | undefined;
    let themeScore = 0;

    for (const themeMeta of activeSavedThemes) {
      if (selectedThemeFilter !== 'all' && themeMeta.id !== selectedThemeFilter) {
        continue;
      }
      if (themeMeta.storyThemes.includes(seed.theme)) {
        themeScore += 10;
        matchingThemeName = themeMeta.title;
        matchingThemeId = themeMeta.id;
      }
    }

    if (selectedThemeFilter !== 'all' && themeScore === 0) {
      matchesSelectedFilter = false;
    }

    if (!matchesSelectedFilter) continue;

    // Generate full Story object for this seed
    const generated = generateCustomBedtimeStory({
      heroId: seed.suggestedHeroId,
      theme: seed.theme,
      mode: seed.mode,
      ageRange: seed.ageRange,
      customPrompt: seed.title,
      setting: seed.setting,
      sidekick: seed.sidekick,
      problem: seed.problem,
    });

    const category =
      seed.theme === 'wonder'
        ? 'Cosmic Adventures'
        : seed.theme === 'friendship' || seed.theme === 'comfort'
        ? 'Forest & Nature'
        : 'Bedtime Calm';

    generated.id = `seed-${seed.id}`;
    generated.title = seed.title;
    generated.summary = seed.blurb;
    generated.category = category;
    generated.coverImage =
      SEED_CATEGORY_COVERS[category] || SEED_CATEGORY_COVERS['Bedtime Calm'];
    generated.audioDurationMinutes = 6 + (seed.title.length % 5);

    const reasons = [`Ages ${seed.ageRange}`];
    if (matchingThemeName) {
      reasons.push(matchingThemeName);
    }

    scoredItems.push({
      story: generated,
      score: (matchedAge ? 12 : 5) + themeScore,
      matchedAge,
      ageRange: seed.ageRange,
      matchedThemeTitle: matchingThemeName || 'Bedtime Tale',
      matchedThemeId: matchingThemeId,
      matchReasons: reasons,
      isPerfectMatch: matchedAge && themeScore > 0,
    });
  }

  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.slice(0, limit);
}
