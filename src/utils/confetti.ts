import confetti from 'canvas-confetti';
import { StreakMilestone } from '../types';
import { ambientSoundEngine } from '../services/audioNarration';

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 3,
    title: '3-Day Starlight Spark',
    badgeName: 'Starlight Spark',
    icon: 'Sparkles',
    rewardTitle: 'Cosmic Ember',
    description: '3 peaceful bedtime stories in a row! You are building a sparkling nighttime habit.',
    affirmation: 'Every night is a new peaceful journey under the stars.',
  },
  {
    days: 5,
    title: '5-Day Cosmic Voyager',
    badgeName: 'Cosmic Voyager',
    icon: 'Flame',
    rewardTitle: 'Starry Compass',
    description: '5 nights of bedtime tales! Your celestial constellation is growing brighter.',
    affirmation: 'Consistency brings calm thoughts and serene dreams.',
  },
  {
    days: 7,
    title: '7-Day Constellation Hero',
    badgeName: 'Constellation Hero',
    icon: 'Award',
    rewardTitle: 'Golden Horizon Pass',
    description: '1 full week of bedtime reading! You have mastered the calm starlight routine.',
    affirmation: 'A full week of peaceful evenings fills your heart with gentle wonder.',
  },
  {
    days: 10,
    title: '10-Day Galaxy Dreamer',
    badgeName: 'Galaxy Dreamer',
    icon: 'Moon',
    rewardTitle: 'Lunar Beacon',
    description: '10 consecutive bedtime adventures. The heroes of the night sky salute your focus.',
    affirmation: 'Rest comes easily when your mind is filled with kind stories.',
  },
  {
    days: 14,
    title: '14-Day Nebula Luminary',
    badgeName: 'Nebula Luminary',
    icon: 'Shield',
    rewardTitle: 'Nebula Crown',
    description: '2 full weeks of bedtime consistency! Your bedtime sky radiates pure starlight.',
    affirmation: 'Two weeks of quiet rest makes every morning brighter.',
  },
  {
    days: 21,
    title: '21-Day Habit Guardian',
    badgeName: 'Habit Guardian',
    icon: 'Heart',
    rewardTitle: 'Celestial Orb',
    description: '3 weeks of steady evening routines. A true champion of restful sleep.',
    affirmation: 'Gentle habits create a sanctuary of peaceful slumber.',
  },
  {
    days: 30,
    title: '30-Day Infinite Master',
    badgeName: 'Infinite Master',
    icon: 'Zap',
    rewardTitle: 'Supernova Scepter',
    description: '1 full month of magical bedtime reading! A legendary milestone across the cosmos.',
    affirmation: 'You have filled an entire month with imagination, kindness, and restful dreams.',
  },
];

/**
 * Finds the highest milestone achieved for a given streak count.
 */
export function getAchievedMilestone(streak: number): StreakMilestone | null {
  const matching = STREAK_MILESTONES.filter((m) => streak >= m.days);
  return matching.length > 0 ? matching[matching.length - 1] : null;
}

/**
 * Finds the upcoming milestone for a given streak count.
 */
export function getNextMilestone(streak: number): StreakMilestone {
  const next = STREAK_MILESTONES.find((m) => m.days > streak);
  return next || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
}

/**
 * Checks if a specific streak count matches an exact milestone threshold.
 */
export function isExactMilestone(streak: number): boolean {
  return STREAK_MILESTONES.some((m) => m.days === streak);
}

export interface ConfettiShowerOptions {
  particleCount?: number;
  playSound?: boolean;
  originY?: number;
  themeColors?: string[];
  intensity?: 'gentle' | 'medium' | 'festive';
}

let mainThreadConfetti: ReturnType<typeof confetti.create> | null = null;

/**
 * Safely fires confetti on the main thread (useWorker: false) after verifying
 * valid DOM viewport dimensions. Prevents OffscreenCanvas Web Worker crashes
 * (`canvas.getBoundingClientRect is not a function`) when the viewport is 0x0
 * or inside restricted iframe environments.
 */
export function safeConfetti(options?: confetti.Options): Promise<null> | null {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.body) {
    return null;
  }

  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return null;
  }

  const width = document.documentElement?.clientWidth || window.innerWidth || 0;
  const height = document.documentElement?.clientHeight || window.innerHeight || 0;
  if (width <= 0 || height <= 0) {
    return null;
  }

  try {
    if (!mainThreadConfetti) {
      mainThreadConfetti = confetti.create(undefined, {
        resize: true,
        useWorker: false,
      });
    }
    return mainThreadConfetti(options);
  } catch (err) {
    console.warn('Confetti synthesis deferred:', err);
    return null;
  }
}

/**
 * Triggers a subtle, refined, starlight confetti shower designed specifically
 * for soothing bedtime aesthetics (soft gold, amber, celestial violet, cyan, pearl).
 * Uses multi-staged gentle drifting physics that respects reduced motion preferences.
 */
export function triggerSubtleConfettiShower(options: ConfettiShowerOptions = {}): void {
  // Respect user accessibility preference for reduced motion
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (options.playSound !== false) {
      ambientSoundEngine.playStarTwinkle();
    }
    return;
  }

  const {
    particleCount = 50,
    playSound = true,
    originY = 0.35,
    themeColors,
    intensity = 'gentle',
  } = options;

  // Celestial Bedtime Starlight Palette
  const celestialColors = themeColors || [
    '#FBBF24', // Warm Amber
    '#F59E0B', // Golden Star
    '#FEF08A', // Pale Starlight
    '#C084FC', // Soft Lavender
    '#38BDF8', // Starlight Sky Cyan
    '#FFFFFF', // Pearl Stardust
    '#F472B6', // Gentle Rose
  ];

  // Play audio chime if requested
  if (playSound) {
    ambientSoundEngine.playCelebrationChime();
  }

  const baseCount = intensity === 'gentle' ? particleCount : intensity === 'medium' ? particleCount * 1.3 : particleCount * 1.6;

  try {
    // Stage 1: Soft central stardust burst
    safeConfetti({
      particleCount: Math.round(baseCount * 0.55),
      spread: 75,
      startVelocity: 28,
      origin: { y: originY, x: 0.5 },
      colors: celestialColors,
      gravity: 0.65,
      decay: 0.93,
      drift: 0,
      scalar: 1.15,
      ticks: 260,
    });

    // Stage 2: Left sky gentle drift wave
    setTimeout(() => {
      safeConfetti({
        particleCount: Math.round(baseCount * 0.25),
        angle: 60,
        spread: 55,
        startVelocity: 32,
        origin: { y: originY - 0.05, x: 0.2 },
        colors: celestialColors,
        gravity: 0.6,
        decay: 0.94,
        drift: 0.15,
        scalar: 1.05,
        ticks: 300,
      });
    }, 160);

    // Stage 3: Right sky gentle drift wave
    setTimeout(() => {
      safeConfetti({
        particleCount: Math.round(baseCount * 0.25),
        angle: 120,
        spread: 55,
        startVelocity: 32,
        origin: { y: originY - 0.05, x: 0.8 },
        colors: celestialColors,
        gravity: 0.6,
        decay: 0.94,
        drift: -0.15,
        scalar: 1.05,
        ticks: 300,
      });
    }, 320);
  } catch (err) {
    console.warn('Subtle confetti shower synthesis deferred:', err);
  }
}
