import { VisualizerColorTheme } from '../types';

export interface VisualizerColorThemeOption {
  id: VisualizerColorTheme;
  name: string;
  emoji: string;
  description: string;
  colorName: string;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  bgGradient: string;
  badgeBg: string;
  swatchGradient: string;
}

export const VISUALIZER_COLOR_THEMES: VisualizerColorThemeOption[] = [
  {
    id: 'soundscape',
    name: 'Soundscape Aura',
    emoji: '✨',
    description: 'Natural harmony matching the chosen bedtime soundscape',
    colorName: 'Auto Adapt',
    primaryColor: '#38bdf8',
    secondaryColor: '#818cf8',
    accentGlow: 'rgba(56, 189, 248, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(14, 165, 233, 0.35) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-300',
    swatchGradient: 'from-sky-400 via-indigo-400 to-amber-300',
  },
  {
    id: 'starlight',
    name: 'Starlight Gold',
    emoji: '⭐',
    description: 'Warm, cozy golden nightlight glow for peaceful dreams',
    colorName: 'Golden Starlight',
    primaryColor: '#fbbf24',
    secondaryColor: '#fde047',
    accentGlow: 'rgba(251, 191, 36, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-amber-400',
    swatchGradient: 'from-amber-400 to-yellow-300',
  },
  {
    id: 'celestial',
    name: 'Cosmic Indigo',
    emoji: '🌌',
    description: 'Deep starlit galaxy violet and quiet midnight constellations',
    colorName: 'Starlit Indigo',
    primaryColor: '#818cf8',
    secondaryColor: '#c084fc',
    accentGlow: 'rgba(129, 140, 248, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(99, 102, 241, 0.35) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-indigo-400',
    swatchGradient: 'from-indigo-400 to-purple-400',
  },
  {
    id: 'ocean',
    name: 'Dreamy Cyan',
    emoji: '🐬',
    description: 'Calm ocean tides & gentle moonlight shimmering on water',
    colorName: 'Ocean Blue',
    primaryColor: '#38bdf8',
    secondaryColor: '#2dd4bf',
    accentGlow: 'rgba(56, 189, 248, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(14, 165, 233, 0.35) 0%, rgba(45, 212, 191, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-sky-400',
    swatchGradient: 'from-sky-400 to-teal-300',
  },
  {
    id: 'emerald',
    name: 'Magic Forest',
    emoji: '🍃',
    description: 'Peaceful green pine canopy, mossy glades, and cozy fireflies',
    colorName: 'Forest Emerald',
    primaryColor: '#34d399',
    secondaryColor: '#a7f3d0',
    accentGlow: 'rgba(52, 211, 153, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-emerald-400',
    swatchGradient: 'from-emerald-400 to-teal-300',
  },
  {
    id: 'rose',
    name: 'Rose Stardust',
    emoji: '💖',
    description: 'Sweet dreamy pink aura and soothing bedtime warmth',
    colorName: 'Rose Quartz',
    primaryColor: '#f472b6',
    secondaryColor: '#fda4af',
    accentGlow: 'rgba(244, 114, 182, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(236, 72, 153, 0.35) 0%, rgba(244, 63, 94, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-pink-400',
    swatchGradient: 'from-pink-400 to-rose-300',
  },
  {
    id: 'aurora',
    name: 'Violet Aurora',
    emoji: '🔮',
    description: 'Magical northern sky lights & enchanting twilight violet',
    colorName: 'Aurora Violet',
    primaryColor: '#c084fc',
    secondaryColor: '#e879f9',
    accentGlow: 'rgba(192, 132, 252, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(168, 85, 247, 0.35) 0%, rgba(232, 121, 249, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-purple-400',
    swatchGradient: 'from-purple-400 to-fuchsia-300',
  },
  {
    id: 'sunset',
    name: 'Cozy Sunset',
    emoji: '🌅',
    description: 'Comforting warm peach embers & evening sun slumbers',
    colorName: 'Peach Sunset',
    primaryColor: '#fb923c',
    secondaryColor: '#f87171',
    accentGlow: 'rgba(251, 146, 60, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(234, 88, 12, 0.35) 0%, rgba(239, 68, 68, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-orange-400',
    swatchGradient: 'from-orange-400 to-rose-400',
  },
  {
    id: 'mint',
    name: 'Moonlit Mint',
    emoji: '🌿',
    description: 'Refreshing seafoam whisper & gentle cool twilight meadow',
    colorName: 'Seafoam Mint',
    primaryColor: '#2dd4bf',
    secondaryColor: '#6ee7b7',
    accentGlow: 'rgba(45, 212, 191, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(20, 184, 166, 0.35) 0%, rgba(110, 231, 183, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    badgeBg: 'bg-teal-400',
    swatchGradient: 'from-teal-400 to-emerald-300',
  },
];

export function getVisualizerThemeById(themeId?: VisualizerColorTheme): VisualizerColorThemeOption {
  return (
    VISUALIZER_COLOR_THEMES.find((t) => t.id === themeId) ||
    VISUALIZER_COLOR_THEMES[0] // fallback to soundscape
  );
}
