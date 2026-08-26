import { CelestialBadge, Story, UserStats } from '../types';

export const INITIAL_BADGES: CelestialBadge[] = [
  {
    id: "badge-first-star",
    name: "First Star",
    description: "Completed your very first bedtime adventure!",
    icon: "Sparkles",
    color: "#F59E0B",
    unlocked: true,
    unlockedAt: "2026-08-20",
    category: "starter"
  },
  {
    id: "badge-courage",
    name: "Shield of Courage",
    description: "Ventured through a courage story with Nova or Nimbus",
    icon: "Shield",
    color: "#6366F1",
    unlocked: true,
    unlockedAt: "2026-08-20",
    category: "theme"
  },
  {
    id: "badge-kindness",
    name: "Ocean of Kindness",
    description: "Shared kindness across a story with Coral or Bloom",
    icon: "Heart",
    color: "#EC4899",
    unlocked: false,
    category: "theme"
  },
  {
    id: "badge-dream-weaver",
    name: "Master Dream Weaver",
    description: "Listened to 3 soothing sleep journeys with Luna",
    icon: "Moon",
    color: "#A855F7",
    unlocked: false,
    category: "explorer"
  },
  {
    id: "badge-night-conductor",
    name: "Night Train Pass",
    description: "Rode the Star Mountain Express with Whistle",
    icon: "Train",
    color: "#38BDF8",
    unlocked: false,
    category: "explorer"
  },
  {
    id: "badge-streak-3",
    name: "Starlight Streak (3 Days)",
    description: "Enjoyed bedtime reading 3 nights in a row",
    icon: "Flame",
    color: "#FB923C",
    unlocked: false,
    category: "streak"
  },
  {
    id: "badge-madlibs-master",
    name: "Giggle Alchemist",
    description: "Crafted a hilarious Mad Libs bedtime story",
    icon: "Laugh",
    color: "#10B981",
    unlocked: false,
    category: "explorer"
  },
  {
    id: "badge-constellation",
    name: "Celestial Map",
    description: "Explored stories from all 8 bedtime heroes",
    icon: "Compass",
    color: "#8B5CF6",
    unlocked: false,
    category: "explorer"
  }
];

/**
 * Evaluates whether completing the given story satisfies any locked celestial badges.
 * Returns updated badge list and any newly unlocked badges.
 */
export function evaluateBadgeUnlocks(
  story: Story,
  currentBadges: CelestialBadge[],
  stats: UserStats
): { updatedBadges: CelestialBadge[]; newlyUnlockedBadges: CelestialBadge[] } {
  const updatedBadges = [...currentBadges];
  const newlyUnlocked: CelestialBadge[] = [];

  const unlockBadge = (badgeId: string) => {
    const idx = updatedBadges.findIndex((b) => b.id === badgeId);
    if (idx !== -1 && !updatedBadges[idx].unlocked) {
      const today = new Date().toISOString().split('T')[0];
      const unlockedBadge: CelestialBadge = {
        ...updatedBadges[idx],
        unlocked: true,
        unlockedAt: today,
      };
      updatedBadges[idx] = unlockedBadge;
      newlyUnlocked.push(unlockedBadge);
    }
  };

  const newCompletedCount = stats.storiesCompleted + 1;

  // 1. First Star Badge
  if (newCompletedCount >= 1) {
    unlockBadge('badge-first-star');
  }

  // 2. Shield of Courage (courage theme or Nova / Nimbus)
  if (story.theme === 'courage' || story.heroId === 'hero-1' || story.heroId === 'hero-5') {
    unlockBadge('badge-courage');
  }

  // 3. Ocean of Kindness (kindness theme or Coral / Bloom)
  if (story.theme === 'kindness' || story.heroId === 'hero-3' || story.heroId === 'hero-8') {
    unlockBadge('badge-kindness');
  }

  // 4. Master Dream Weaver (sleep mode or Luna)
  if (story.mode === 'sleep' || story.heroId === 'hero-2' || (story.category && story.category.toLowerCase().includes('sleep'))) {
    unlockBadge('badge-dream-weaver');
  }

  // 5. Night Train Pass (Whistle or train tale)
  if (
    story.heroId === 'hero-4' ||
    (story.title && story.title.toLowerCase().includes('train')) ||
    (story.category && story.category.toLowerCase().includes('train')) ||
    (story.category && story.category.toLowerCase().includes('express'))
  ) {
    unlockBadge('badge-night-conductor');
  }

  // 6. Giggle Alchemist (Mad Libs mode)
  if (story.mode === 'madlibs' || story.isMadlibs) {
    unlockBadge('badge-madlibs-master');
  }

  // 7. Starlight Streak (3 stories completed or streak >= 3)
  if (newCompletedCount >= 3 || stats.currentStreak >= 3) {
    unlockBadge('badge-streak-3');
  }

  // 8. Celestial Map (5+ stories completed)
  if (newCompletedCount >= 5) {
    unlockBadge('badge-constellation');
  }

  return { updatedBadges, newlyUnlockedBadges: newlyUnlocked };
}
