import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Waves,
  CloudRain,
  Wind,
  Flame,
  Train,
  VolumeX,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface AmbientWaveVisualizerProps {
  ambientSound: string;
  ambientVolume: number;
  isPlayingNarration?: boolean;
  onOpenSoundControls?: () => void;
  onVolumeChange?: (volume: number) => void;
  className?: string;
  variant?: 'embedded' | 'floor' | 'compact';
}

interface SoundscapeTheme {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  accentColor: string;
  glowColor: string;
  primaryGradient: string;
  secondaryGradient: string;
  bgGlow: string;
  waveSpeedClass: string;
  secondarySpeedClass: string;
  barColor: string;
  particles?: 'bubbles' | 'rain' | 'breeze' | 'embers' | 'stars';
}

const SOUNDSCAPE_THEMES: Record<string, SoundscapeTheme> = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: Waves,
    subtitle: 'Gentle rhythmic surf',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    primaryGradient: 'linear-gradient(180deg, rgba(14, 165, 233, 0.45) 0%, rgba(3, 105, 161, 0.75) 60%, rgba(2, 44, 78, 0.95) 100%)',
    secondaryGradient: 'linear-gradient(180deg, rgba(20, 184, 166, 0.35) 0%, rgba(13, 148, 136, 0.6) 60%, rgba(4, 47, 46, 0.9) 100%)',
    bgGlow: 'radial-gradient(ellipse at bottom, rgba(14, 165, 233, 0.22) 0%, transparent 75%)',
    waveSpeedClass: 'animate-wave-drift-slow',
    secondarySpeedClass: 'animate-wave-drift-medium',
    barColor: 'bg-sky-400',
    particles: 'bubbles',
  },
  rain: {
    id: 'rain',
    name: 'Gentle Rain',
    icon: CloudRain,
    subtitle: 'Soothing bedtime patter',
    accentColor: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.4)',
    primaryGradient: 'linear-gradient(180deg, rgba(96, 165, 250, 0.4) 0%, rgba(59, 130, 246, 0.7) 60%, rgba(23, 37, 84, 0.95) 100%)',
    secondaryGradient: 'linear-gradient(180deg, rgba(147, 197, 253, 0.3) 0%, rgba(99, 102, 241, 0.55) 60%, rgba(15, 23, 42, 0.9) 100%)',
    bgGlow: 'radial-gradient(ellipse at bottom, rgba(96, 165, 250, 0.2) 0%, transparent 75%)',
    waveSpeedClass: 'animate-wave-drift-medium',
    secondarySpeedClass: 'animate-wave-drift-fast',
    barColor: 'bg-blue-400',
    particles: 'rain',
  },
  wind: {
    id: 'wind',
    name: 'Night Breeze',
    icon: Wind,
    subtitle: 'Calm starlight whisper',
    accentColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.4)',
    primaryGradient: 'linear-gradient(180deg, rgba(192, 132, 252, 0.35) 0%, rgba(168, 85, 247, 0.65) 60%, rgba(59, 7, 100, 0.95) 100%)',
    secondaryGradient: 'linear-gradient(180deg, rgba(129, 140, 248, 0.3) 0%, rgba(99, 102, 241, 0.5) 60%, rgba(30, 27, 75, 0.9) 100%)',
    bgGlow: 'radial-gradient(ellipse at bottom, rgba(192, 132, 252, 0.2) 0%, transparent 75%)',
    waveSpeedClass: 'animate-wave-drift-slow',
    secondarySpeedClass: 'animate-wave-drift-medium',
    barColor: 'bg-purple-400',
    particles: 'breeze',
  },
  fire: {
    id: 'fire',
    name: 'Cozy Fireplace',
    icon: Flame,
    subtitle: 'Warm crackling embers',
    accentColor: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.45)',
    primaryGradient: 'linear-gradient(180deg, rgba(251, 146, 60, 0.45) 0%, rgba(234, 88, 12, 0.75) 60%, rgba(67, 20, 7, 0.95) 100%)',
    secondaryGradient: 'linear-gradient(180deg, rgba(250, 204, 21, 0.35) 0%, rgba(217, 119, 6, 0.55) 60%, rgba(41, 15, 3, 0.9) 100%)',
    bgGlow: 'radial-gradient(ellipse at bottom, rgba(251, 146, 60, 0.25) 0%, transparent 75%)',
    waveSpeedClass: 'animate-wave-drift-medium',
    secondarySpeedClass: 'animate-wave-drift-fast',
    barColor: 'bg-amber-400',
    particles: 'embers',
  },
  train: {
    id: 'train',
    name: 'Dream Train',
    icon: Train,
    subtitle: 'Rhythmic midnight voyage',
    accentColor: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    primaryGradient: 'linear-gradient(180deg, rgba(167, 139, 250, 0.4) 0%, rgba(124, 58, 237, 0.7) 60%, rgba(46, 16, 101, 0.95) 100%)',
    secondaryGradient: 'linear-gradient(180deg, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.55) 60%, rgba(15, 23, 42, 0.9) 100%)',
    bgGlow: 'radial-gradient(ellipse at bottom, rgba(167, 139, 250, 0.2) 0%, transparent 75%)',
    waveSpeedClass: 'animate-wave-drift-slow',
    secondarySpeedClass: 'animate-wave-drift-medium',
    barColor: 'bg-indigo-400',
    particles: 'stars',
  },
  none: {
    id: 'none',
    name: 'Quiet Starlight',
    icon: VolumeX,
    subtitle: 'Silent bedtime atmosphere',
    accentColor: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.15)',
    primaryGradient: 'linear-gradient(180deg, rgba(49, 46, 129, 0.2) 0%, rgba(17, 24, 39, 0.5) 70%, rgba(5, 5, 26, 0.9) 100%)',
    secondaryGradient: 'linear-gradient(180deg, rgba(30, 27, 75, 0.15) 0%, rgba(15, 23, 42, 0.4) 70%, rgba(2, 6, 23, 0.85) 100%)',
    bgGlow: 'radial-gradient(ellipse at bottom, rgba(99, 102, 241, 0.08) 0%, transparent 75%)',
    waveSpeedClass: 'animate-wave-drift-slow',
    secondarySpeedClass: 'animate-wave-drift-slow',
    barColor: 'bg-slate-600',
  },
};

export const AmbientWaveVisualizer: React.FC<AmbientWaveVisualizerProps> = ({
  ambientSound,
  ambientVolume,
  isPlayingNarration = false,
  onOpenSoundControls,
  onVolumeChange,
  className = '',
  variant = 'floor',
}) => {
  const currentTheme = SOUNDSCAPE_THEMES[ambientSound] || SOUNDSCAPE_THEMES.none;
  const isSoundActive = ambientSound !== 'none' && ambientVolume > 0;
  const SoundIcon = currentTheme.icon;

  // Calculate dynamic wave amplitude scale from volume
  const waveScaleY = useMemo(() => {
    if (!isSoundActive) return 0.45;
    // Maps volume (0.1 to 1.0) into comfortable wave height scale (0.65 to 1.35)
    return Math.min(Math.max(0.65 + ambientVolume * 0.7, 0.65), 1.35);
  }, [isSoundActive, ambientVolume]);

  const volumePercentage = Math.round(ambientVolume * 100);

  // Seamless SVG wave paths repeating twice horizontally across 2880 width for smooth 100% css translation loop
  const primaryWavePath =
    'M 0,45 C 240,15 480,75 720,45 C 960,15 1200,75 1440,45 C 1680,15 1920,75 2160,45 C 2400,15 2640,75 2880,45 L 2880,120 L 0,120 Z';

  const secondaryWavePath =
    'M 0,60 C 320,85 580,25 860,60 C 1140,95 1400,35 1680,60 C 1960,85 2220,25 2500,60 C 2780,95 2880,50 2880,60 L 2880,120 L 0,120 Z';

  const crestLinePath =
    'M 0,45 C 240,15 480,75 720,45 C 960,15 1200,75 1440,45 C 1680,15 1920,75 2160,45 C 2400,15 2640,75 2880,45';

  return (
    <div
      aria-label={`Ambient audio visualizer: ${currentTheme.name}`}
      className={`relative w-full overflow-hidden transition-all duration-700 pointer-events-none select-none ${
        variant === 'floor'
          ? 'h-24 sm:h-28 -mt-6'
          : variant === 'embedded'
          ? 'h-20 sm:h-24 rounded-2xl border border-indigo-950/60'
          : 'h-14 sm:h-16'
      } ${className}`}
    >
      {/* Background Radial Glow Reactive to Current Soundscape */}
      <div
        className="absolute inset-0 transition-all duration-1000 opacity-90"
        style={{ background: currentTheme.bgGlow }}
      />

      {/* Wave Layers Stage */}
      <div
        className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-end animate-wave-swell"
        style={{
          transform: `scaleY(${waveScaleY})`,
          transformOrigin: 'bottom center',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Layer 1: Background Secondary Ambient Wave (Offset Drift) */}
        <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden opacity-60">
          <div
            className={`w-[200%] h-full flex ${
              isSoundActive ? currentTheme.secondarySpeedClass : 'opacity-40'
            }`}
          >
            <svg
              viewBox="0 0 2880 120"
              preserveAspectRatio="none"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`grad-secondary-${ambientSound}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={currentTheme.accentColor} stopOpacity="0.4" />
                  <stop offset="60%" stopColor={currentTheme.accentColor} stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#05051a" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <path d={secondaryWavePath} fill={`url(#grad-secondary-${ambientSound})`} />
            </svg>
          </div>
        </div>

        {/* Layer 2: Foreground Primary Ambient Wave */}
        <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden opacity-85">
          <div
            className={`w-[200%] h-full flex ${
              isSoundActive ? currentTheme.waveSpeedClass : 'opacity-40'
            }`}
          >
            <svg
              viewBox="0 0 2880 120"
              preserveAspectRatio="none"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`grad-primary-${ambientSound}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={currentTheme.accentColor} stopOpacity="0.6" />
                  <stop offset="40%" stopColor={currentTheme.accentColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#05051a" stopOpacity="0.95" />
                </linearGradient>
                <filter id="waveGlow" x="-10%" y="-20%" width="120%" height="150%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path d={primaryWavePath} fill={`url(#grad-primary-${ambientSound})`} />
              {/* Illuminated Wave Crest Line */}
              <path
                d={crestLinePath}
                fill="none"
                stroke={currentTheme.accentColor}
                strokeWidth="1.8"
                strokeOpacity={isSoundActive ? 0.75 : 0.25}
                filter="url(#waveGlow)"
              />
            </svg>
          </div>
        </div>

        {/* Layer 3: Floating Sound Particles (Embers / Bubbles / Stardust) */}
        {isSoundActive && currentTheme.particles === 'embers' && (
          <div className="absolute inset-x-0 bottom-2 h-16 pointer-events-none overflow-hidden flex justify-around">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-sm shadow-amber-400"
                style={{
                  animation: `ambientFloatingEmber ${2 + (i % 3) * 0.8}s ease-in-out infinite ${i * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}

        {isSoundActive && currentTheme.particles === 'bubbles' && (
          <div className="absolute inset-x-0 bottom-2 h-16 pointer-events-none overflow-hidden flex justify-around">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full border border-sky-300/70 bg-sky-400/20"
                style={{
                  animation: `ambientFloatingEmber ${3 + (i % 2) * 1.2}s ease-out infinite ${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interactive Overlay Badge: Shows Ambient Soundscape Status & Quick Adjust Button */}
      <div className="absolute inset-x-4 bottom-2.5 z-20 flex items-center justify-between pointer-events-auto">
        {/* Left Status Pill */}
        <button
          type="button"
          id="ambient-wave-status-pill"
          onClick={onOpenSoundControls}
          className="group/pill flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 shadow-lg backdrop-blur-md transition-all text-left focus:outline-none focus:ring-1 focus:ring-indigo-400"
          title="Adjust ambient sleep sounds and volume"
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: `${currentTheme.accentColor}25`,
              color: currentTheme.accentColor,
            }}
          >
            <SoundIcon className="w-3 h-3" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-200 group-hover/pill:text-white transition-colors">
              {currentTheme.name}
            </span>
            {isSoundActive && (
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                • {volumePercentage}% Vol
              </span>
            )}
          </div>

          {/* Harmonic Wave Frequency Audio Bars (Reacting with CSS keyframes) */}
          <div
            className="flex items-end gap-0.5 h-3 px-1"
            aria-hidden="true"
            title="Audio frequency visualizer"
          >
            <span
              className={`w-0.5 h-3 rounded-full transition-all ${
                isSoundActive ? `${currentTheme.barColor} animate-audio-bar-1` : 'bg-slate-700 h-1'
              }`}
            />
            <span
              className={`w-0.5 h-3 rounded-full transition-all ${
                isSoundActive ? `${currentTheme.barColor} animate-audio-bar-2` : 'bg-slate-700 h-1'
              }`}
            />
            <span
              className={`w-0.5 h-3 rounded-full transition-all ${
                isSoundActive ? `${currentTheme.barColor} animate-audio-bar-3` : 'bg-slate-700 h-1'
              }`}
            />
            <span
              className={`w-0.5 h-3 rounded-full transition-all ${
                isSoundActive ? `${currentTheme.barColor} animate-audio-bar-4` : 'bg-slate-700 h-1'
              }`}
            />
            <span
              className={`w-0.5 h-3 rounded-full transition-all ${
                isSoundActive ? `${currentTheme.barColor} animate-audio-bar-5` : 'bg-slate-700 h-1'
              }`}
            />
          </div>

          <Sliders className="w-3 h-3 text-slate-500 group-hover/pill:text-slate-300 ml-0.5 transition-colors" />
        </button>

        {/* Right Voice Narration Sync Indicator (if reading aloud) */}
        {isPlayingNarration && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-[10px] font-bold text-amber-300 shadow-sm backdrop-blur-md"
          >
            <Sparkles className="w-3 h-3 fill-current animate-pulse" />
            <span>Voice Narration Active</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};
