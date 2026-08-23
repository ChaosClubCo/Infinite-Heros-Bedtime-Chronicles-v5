import { CelestialBadge } from '../types';

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
    unlocked: true,
    unlockedAt: "2026-08-21",
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
