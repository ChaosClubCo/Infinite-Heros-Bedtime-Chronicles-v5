import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Waves,
  CloudRain,
  Wind,
  Flame,
  Train,
  VolumeX,
  Sparkles,
  TreePine,
  Music2,
  Radio,
  Play,
  Square,
  Activity,
  Disc,
} from 'lucide-react';
import { AmbientSoundTrack, VisualizerColorTheme } from '../types';
import { ambientSoundEngine } from '../services/audioNarration';
import { getVisualizerThemeById } from '../data/visualizerThemes';

export type VisualizerDisplayMode = 'wave' | 'bars' | 'nebula';

interface WindDownAudioVisualizerProps {
  ambientSound: AmbientSoundTrack;
  ambientVolume: number;
  colorTheme?: VisualizerColorTheme;
  isPreviewPlaying: boolean;
  onTogglePreview: () => void;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

interface SoundscapeVisualConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  bgGradient: string;
  particleType: 'bubbles' | 'rain' | 'breeze' | 'embers' | 'stars' | 'fireflies' | 'notes';
  waveFormStyle: 'fluid' | 'sharp' | 'gentle' | 'pulse' | 'shimmer';
  barCount: number;
}

const SOUNDSCAPE_CONFIGS: Record<string, SoundscapeVisualConfig> = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: Waves,
    tagline: 'Gentle shore rhythm',
    primaryColor: '#38bdf8', // sky-400
    secondaryColor: '#2dd4bf', // teal-400
    accentGlow: 'rgba(56, 189, 248, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(14, 165, 233, 0.35) 0%, rgba(3, 105, 161, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'bubbles',
    waveFormStyle: 'fluid',
    barCount: 24,
  },
  rain: {
    id: 'rain',
    name: 'Gentle Rain',
    icon: CloudRain,
    tagline: 'Soft bedtime drizzle',
    primaryColor: '#60a5fa', // blue-400
    secondaryColor: '#818cf8', // indigo-400
    accentGlow: 'rgba(96, 165, 250, 0.4)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'rain',
    waveFormStyle: 'sharp',
    barCount: 28,
  },
  forest: {
    id: 'forest',
    name: 'Night Forest',
    icon: TreePine,
    tagline: 'Whispering pine breeze',
    primaryColor: '#34d399', // emerald-400
    secondaryColor: '#a7f3d0', // emerald-200
    accentGlow: 'rgba(52, 211, 153, 0.4)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'fireflies',
    waveFormStyle: 'gentle',
    barCount: 22,
  },
  wind: {
    id: 'wind',
    name: 'Starry Wind',
    icon: Wind,
    tagline: 'Quiet celestial breeze',
    primaryColor: '#c084fc', // purple-400
    secondaryColor: '#e879f9', // fuchsia-400
    accentGlow: 'rgba(192, 132, 252, 0.4)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(168, 85, 247, 0.3) 0%, rgba(192, 132, 252, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'breeze',
    waveFormStyle: 'fluid',
    barCount: 20,
  },
  lullaby: {
    id: 'lullaby',
    name: 'Lullaby Chimes',
    icon: Music2,
    tagline: 'Harmonic starlight chimes',
    primaryColor: '#fcd34d', // amber-300
    secondaryColor: '#f472b6', // pink-400
    accentGlow: 'rgba(252, 211, 77, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(245, 158, 11, 0.3) 0%, rgba(244, 114, 182, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'notes',
    waveFormStyle: 'shimmer',
    barCount: 26,
  },
  whitenoise: {
    id: 'whitenoise',
    name: 'Cosmic Drift',
    icon: Radio,
    tagline: 'Soothing warm pink blanket',
    primaryColor: '#f43f5e', // rose-500
    secondaryColor: '#fb7185', // rose-400
    accentGlow: 'rgba(244, 63, 94, 0.35)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(225, 29, 72, 0.25) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'stars',
    waveFormStyle: 'pulse',
    barCount: 30,
  },
  crickets: {
    id: 'crickets',
    name: 'Night Crickets',
    icon: Sparkles,
    tagline: 'Meadow starlight chorus',
    primaryColor: '#a3e635', // lime-400
    secondaryColor: '#4ade80', // green-400
    accentGlow: 'rgba(163, 230, 53, 0.4)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(132, 204, 22, 0.25) 0%, rgba(34, 197, 94, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'fireflies',
    waveFormStyle: 'shimmer',
    barCount: 24,
  },
  fire: {
    id: 'fire',
    name: 'Cozy Hearth',
    icon: Flame,
    tagline: 'Crackling warm embers',
    primaryColor: '#fb923c', // orange-400
    secondaryColor: '#f87171', // red-400
    accentGlow: 'rgba(251, 146, 60, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(234, 88, 12, 0.35) 0%, rgba(220, 38, 38, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'embers',
    waveFormStyle: 'pulse',
    barCount: 22,
  },
  train: {
    id: 'train',
    name: 'Starlight Express',
    icon: Train,
    tagline: 'Rhythmic sleep journey',
    primaryColor: '#818cf8', // indigo-400
    secondaryColor: '#c084fc', // purple-400
    accentGlow: 'rgba(129, 140, 248, 0.4)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(99, 102, 241, 0.3) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'stars',
    waveFormStyle: 'pulse',
    barCount: 24,
  },
  none: {
    id: 'none',
    name: 'Silent Night',
    icon: VolumeX,
    tagline: 'Peaceful resting silence',
    primaryColor: '#94a3b8', // slate-400
    secondaryColor: '#64748b', // slate-500
    accentGlow: 'rgba(148, 163, 184, 0.15)',
    bgGradient: 'radial-gradient(ellipse at 50% 120%, rgba(51, 65, 85, 0.2) 0%, rgba(15, 23, 42, 0.1) 50%, rgba(10, 8, 30, 0.95) 100%)',
    particleType: 'stars',
    waveFormStyle: 'gentle',
    barCount: 16,
  },
};

interface RipplePoint {
  id: number;
  x: number;
  y: number;
  color: string;
}

export const WindDownAudioVisualizer: React.FC<WindDownAudioVisualizerProps> = ({
  ambientSound,
  ambientVolume,
  colorTheme = 'soundscape',
  isPreviewPlaying,
  onTogglePreview,
  onVolumeChange,
  className = '',
}) => {
  const [displayMode, setDisplayMode] = useState<VisualizerDisplayMode>('wave');
  const [ripples, setRipples] = useState<RipplePoint[]>([]);
  const [animationTick, setAnimationTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const soundConfig = SOUNDSCAPE_CONFIGS[ambientSound] || SOUNDSCAPE_CONFIGS.none;
  const isSoundActive = ambientSound !== 'none' && ambientVolume > 0;
  const IconComponent = soundConfig.icon;

  // Resolve custom color theme if selected by the child
  const customTheme = colorTheme && colorTheme !== 'soundscape' ? getVisualizerThemeById(colorTheme) : null;
  const primaryColor = customTheme ? customTheme.primaryColor : soundConfig.primaryColor;
  const secondaryColor = customTheme ? customTheme.secondaryColor : soundConfig.secondaryColor;
  const accentGlow = customTheme ? customTheme.accentGlow : soundConfig.accentGlow;
  const bgGradient = customTheme ? customTheme.bgGradient : soundConfig.bgGradient;

  // Animation frame loop to generate harmonic wave oscillations
  useEffect(() => {
    let animationFrameId: number;
    const updateTick = () => {
      setAnimationTick((prev) => (prev + 1) % 360);
      animationFrameId = requestAnimationFrame(updateTick);
    };
    animationFrameId = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Intensity score computed from volume and playback state
  const intensity = useMemo(() => {
    if (!isSoundActive) return 0.05;
    const base = Math.min(Math.max(ambientVolume, 0), 1);
    return isPreviewPlaying ? base : base * 0.75;
  }, [isSoundActive, ambientVolume, isPreviewPlaying]);

  // Handle interactive touch/click to generate starlight ripples & playful interaction
  const handleInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Trigger subtle playful chime on touch
    try {
      ambientSoundEngine.playStarTwinkle(0.85);
    } catch {
      // safe fallback
    }

    const newRipple: RipplePoint = {
      id: Date.now() + Math.random(),
      x,
      y,
      color: primaryColor,
    };

    setRipples((prev) => [...prev.slice(-4), newRipple]);

    // If volume is 0 or sound is muted, gently nudge to friendly whisper volume
    if (ambientVolume === 0) {
      onVolumeChange(0.25);
    }
  };

  // Remove ripples after animation completes
  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Generate dynamic frequency bar heights matching the soundscape harmonic profile
  const frequencyBars = useMemo(() => {
    const bars: number[] = [];
    const count = soundConfig.barCount;
    for (let i = 0; i < count; i++) {
      const centerDist = Math.abs(i - count / 2) / (count / 2);
      const bellCurve = 1 - centerDist * 0.45;
      const phaseOffset = (i * 18 + animationTick * (isPreviewPlaying ? 4 : 2)) * (Math.PI / 180);
      const harmonic1 = Math.sin(phaseOffset) * 0.4;
      const harmonic2 = Math.cos(phaseOffset * 1.8) * 0.25;

      const rawHeight = (0.35 + harmonic1 + harmonic2) * bellCurve;
      const scaledHeight = isSoundActive
        ? Math.max(12, Math.min(95, rawHeight * intensity * 100 + (isPreviewPlaying ? 25 : 15)))
        : 6 + Math.sin(phaseOffset * 0.5) * 4;

      bars.push(Math.round(scaledHeight));
    }
    return bars;
  }, [soundConfig.barCount, animationTick, isPreviewPlaying, isSoundActive, intensity]);

  // Compute smooth SVG wave curves based on soundscape style and volume intensity
  const waveSvgPath = useMemo(() => {
    const points: [number, number][] = [];
    const width = 400;
    const height = 110;
    const baseY = height - 25;
    const segments = 16;
    const step = width / segments;

    for (let i = 0; i <= segments; i++) {
      const x = i * step;
      const angle = (i * 24 + animationTick * (isPreviewPlaying ? 3.5 : 1.5)) * (Math.PI / 180);
      let waveAmp = 0;

      if (isSoundActive) {
        if (soundConfig.waveFormStyle === 'fluid') {
          waveAmp = Math.sin(angle) * (14 + intensity * 26);
        } else if (soundConfig.waveFormStyle === 'sharp') {
          waveAmp = (Math.sin(angle) + Math.sin(angle * 2.5) * 0.4) * (12 + intensity * 22);
        } else if (soundConfig.waveFormStyle === 'pulse') {
          waveAmp = Math.cos(angle * 1.5) * (10 + intensity * 28);
        } else {
          waveAmp = Math.sin(angle * 0.8) * (8 + intensity * 20);
        }
      } else {
        waveAmp = Math.sin(angle * 0.5) * 3;
      }

      const y = Math.max(10, Math.min(height - 5, baseY - waveAmp));
      points.push([x, y]);
    }

    if (points.length < 2) return '';

    // Convert points into smooth cubic Bezier path
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const mx = (prev[0] + curr[0]) / 2;
      const my = (prev[1] + curr[1]) / 2;
      d += ` Q ${prev[0]},${prev[1]} ${mx},${my}`;
    }
    d += ` L ${width},${height} L 0,${height} Z`;
    return d;
  }, [animationTick, isPreviewPlaying, isSoundActive, soundConfig.waveFormStyle, intensity]);

  return (
    <div
      id="winddown-audio-visualizer-container"
      className={`relative w-full rounded-2xl border border-indigo-900/70 overflow-hidden bg-[#070518] shadow-lg shadow-indigo-950/50 select-none ${className}`}
    >
      {/* Background Reactive Ambience & Glow */}
      <div
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{
          background: bgGradient,
          opacity: isSoundActive ? 0.95 : 0.4,
        }}
      />

      {/* Outer Radial Light Bloom that scales with volume */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          boxShadow: isSoundActive ? `inset 0 0 45px ${accentGlow}` : 'none',
        }}
      />

      {/* Header Bar: Status & Mode Selector */}
      <div className="relative z-20 flex items-center justify-between px-3.5 pt-3 pb-1">
        {/* Soundscape Identifier */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center border transition-all duration-500 shadow-sm"
            style={{
              backgroundColor: `${primaryColor}20`,
              borderColor: `${primaryColor}50`,
              color: primaryColor,
              boxShadow: isSoundActive ? `0 0 10px ${accentGlow}` : 'none',
            }}
          >
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{soundConfig.name}</span>
              {customTheme && (
                <span
                  className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold border flex items-center gap-1"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    borderColor: `${primaryColor}50`,
                    color: primaryColor,
                  }}
                  title={`Personalized Color: ${customTheme.name}`}
                >
                  <span>{customTheme.emoji}</span>
                  <span className="hidden sm:inline">{customTheme.name}</span>
                </span>
              )}
              {isPreviewPlaying && (
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] font-mono text-amber-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  LIVE
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">{soundConfig.tagline}</div>
          </div>
        </div>

        {/* Visualizer Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-indigo-900/60 text-[10px]">
          <button
            type="button"
            id="visualizer-mode-wave"
            onClick={() => setDisplayMode('wave')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              displayMode === 'wave'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Dream Wave mode"
          >
            <Waves className="w-3 h-3" />
            <span className="hidden sm:inline">Wave</span>
          </button>

          <button
            type="button"
            id="visualizer-mode-bars"
            onClick={() => setDisplayMode('bars')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              displayMode === 'bars'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Frequency Spectrum Bars"
          >
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">Bars</span>
          </button>

          <button
            type="button"
            id="visualizer-mode-nebula"
            onClick={() => setDisplayMode('nebula')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              displayMode === 'nebula'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Celestial Nebula Ring"
          >
            <Disc className="w-3 h-3" />
            <span className="hidden sm:inline">Nebula</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        ref={containerRef}
        id="visualizer-interactive-stage"
        onClick={handleInteraction}
        onTouchStart={handleInteraction}
        className="relative w-full h-32 sm:h-36 flex items-end justify-center cursor-pointer overflow-hidden px-4 pb-2"
        role="button"
        tabIndex={0}
        aria-label={`Interactive soundscape visualizer for ${soundConfig.name}. Tap to generate starlight ripples.`}
      >
        {/* Floating Particles (Embers / Bubbles / Fireflies / Rain) */}
        {isSoundActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {soundConfig.particleType === 'bubbles' && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`bubble-${i}`}
                    className="absolute rounded-full border border-sky-300/60 bg-sky-400/20"
                    style={{
                      width: 6 + (i % 4) * 3,
                      height: 6 + (i % 4) * 3,
                      left: `${10 + (i * 12) % 85}%`,
                      bottom: '5%',
                    }}
                    animate={{
                      y: [-10, -110],
                      x: [0, Math.sin(i + animationTick * 0.05) * 15],
                      opacity: [0, 0.85, 0],
                      scale: [0.8, 1.2],
                    }}
                    transition={{
                      duration: 3 + (i % 3) * 1.2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </>
            )}

            {soundConfig.particleType === 'rain' && (
              <>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={`rain-${i}`}
                    className="absolute w-0.5 rounded-full bg-gradient-to-b from-blue-300/80 to-indigo-500/20"
                    style={{
                      height: 12 + (i % 3) * 6,
                      left: `${5 + (i * 8.5) % 90}%`,
                      top: '0%',
                    }}
                    animate={{
                      y: [0, 140],
                      opacity: [0.1, 0.9, 0],
                    }}
                    transition={{
                      duration: 1 + (i % 4) * 0.25,
                      repeat: Infinity,
                      delay: (i * 0.15) % 1.5,
                      ease: 'linear',
                    }}
                  />
                ))}
              </>
            )}

            {soundConfig.particleType === 'embers' && (
              <>
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={`ember-${i}`}
                    className="absolute rounded-full shadow-sm"
                    style={{
                      width: 3 + (i % 3) * 2,
                      height: 3 + (i % 3) * 2,
                      left: `${15 + (i * 8) % 75}%`,
                      bottom: '10%',
                      backgroundColor: primaryColor,
                      boxShadow: `0 0 8px ${accentGlow}`,
                    }}
                    animate={{
                      y: [0, -100 - (i % 4) * 15],
                      x: [0, (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 8)],
                      opacity: [0, 0.9, 0],
                      scale: [1, 0.4],
                    }}
                    transition={{
                      duration: 2.2 + (i % 3) * 0.8,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </>
            )}

            {soundConfig.particleType === 'fireflies' && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`firefly-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: 4,
                      height: 4,
                      left: `${12 + (i * 11) % 80}%`,
                      top: `${20 + (i * 15) % 65}%`,
                      backgroundColor: primaryColor,
                      boxShadow: `0 0 10px ${primaryColor}`,
                    }}
                    animate={{
                      x: [0, Math.sin(i * 2 + animationTick * 0.05) * 20, 0],
                      y: [0, Math.cos(i + animationTick * 0.05) * 15, 0],
                      opacity: [0.2, 0.9, 0.2],
                      scale: [0.8, 1.4, 0.8],
                    }}
                    transition={{
                      duration: 3 + (i % 3),
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </>
            )}

            {soundConfig.particleType === 'notes' && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`note-${i}`}
                    className="absolute text-[11px] font-bold"
                    style={{
                      color: primaryColor,
                      left: `${15 + (i * 14) % 75}%`,
                      bottom: '15%',
                      textShadow: `0 0 8px ${accentGlow}`,
                    }}
                    animate={{
                      y: [-5, -95],
                      x: [0, (i % 2 === 0 ? 1 : -1) * 18],
                      opacity: [0, 0.9, 0],
                      rotate: [-15, 20],
                    }}
                    transition={{
                      duration: 3.5 + (i % 3) * 0.8,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: 'easeOut',
                    }}
                  >
                    ♪
                  </motion.div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Interactive Ripple Effects Triggered on Click */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 3.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              onAnimationComplete={() => removeRipple(ripple.id)}
              className="absolute rounded-full border-2 pointer-events-none"
              style={{
                left: ripple.x - 20,
                top: ripple.y - 20,
                width: 40,
                height: 40,
                borderColor: ripple.color,
                boxShadow: `0 0 15px ${ripple.color}`,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Mode 1: Dream Wave SVG */}
        {displayMode === 'wave' && (
          <div className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none flex items-end">
            <svg
              viewBox="0 0 400 110"
              preserveAspectRatio="none"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`viz-grad-wave-${ambientSound}-${colorTheme}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={isSoundActive ? 0.7 : 0.25} />
                  <stop offset="50%" stopColor={secondaryColor} stopOpacity={isSoundActive ? 0.35 : 0.1} />
                  <stop offset="100%" stopColor="#070518" stopOpacity="0.95" />
                </linearGradient>
                <filter id={`viz-glow-${colorTheme}`} x="-10%" y="-20%" width="120%" height="150%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Underlying Gradient Wave Area */}
              <path d={waveSvgPath} fill={`url(#viz-grad-wave-${ambientSound}-${colorTheme})`} />

              {/* Glowing Crest Highlight Line */}
              <path
                d={waveSvgPath}
                fill="none"
                stroke={primaryColor}
                strokeWidth={isSoundActive ? 2 : 1}
                strokeOpacity={isSoundActive ? 0.9 : 0.3}
                filter={`url(#viz-glow-${colorTheme})`}
              />
            </svg>
          </div>
        )}

        {/* Mode 2: Multi-band Spectrum Bars */}
        {displayMode === 'bars' && (
          <div className="relative z-10 w-full flex items-end justify-center gap-1 sm:gap-1.5 h-24 px-2">
            {frequencyBars.map((height, idx) => {
              const isCenter = Math.abs(idx - frequencyBars.length / 2) < 4;
              return (
                <div
                  key={`bar-${idx}`}
                  className="flex-1 max-w-[10px] rounded-t-full transition-all duration-150 relative overflow-hidden"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isCenter ? primaryColor : secondaryColor,
                    opacity: isSoundActive ? 0.85 : 0.3,
                    boxShadow:
                      isSoundActive && height > 40
                        ? `0 0 8px ${accentGlow}`
                        : 'none',
                  }}
                >
                  {/* Top glowing cap */}
                  <div
                    className="w-full h-1 rounded-full bg-white/70 absolute top-0 inset-x-0"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Mode 3: Celestial Nebula Resonance Ring */}
        {displayMode === 'nebula' && (
          <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
            {/* Outer Orbit Ring */}
            <motion.div
              className="absolute rounded-full border border-dashed transition-all"
              style={{
                width: 90 + intensity * 40,
                height: 90 + intensity * 40,
                borderColor: `${secondaryColor}60`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />

            {/* Inner Glowing Resonance Core */}
            <motion.div
              className="rounded-full flex items-center justify-center transition-all"
              style={{
                width: 45 + intensity * 35,
                height: 45 + intensity * 35,
                background: `radial-gradient(circle, ${primaryColor}80 0%, ${secondaryColor}30 70%, transparent 100%)`,
                boxShadow: isSoundActive ? `0 0 30px ${accentGlow}` : 'none',
              }}
              animate={{
                scale: isSoundActive ? [1, 1.08, 1] : 1,
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 0 12px ${primaryColor}`,
                }}
              />
            </motion.div>
          </div>
        )}

        {/* Center Quick Test Preview Trigger Pill */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <button
            type="button"
            id="visualizer-stage-preview-btn"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePreview();
            }}
            title={isPreviewPlaying ? 'Pause soundscape preview' : 'Play soundscape preview'}
            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all active:scale-95 shadow-xl ${
              isPreviewPlaying
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/40'
                : 'bg-slate-950/80 text-white border-indigo-700/60 hover:border-amber-400/70 hover:bg-slate-900'
            }`}
          >
            {isPreviewPlaying ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span className="text-[11px] font-bold tracking-wide">Playing</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-amber-400" />
                <span className="text-[11px] font-bold tracking-wide">
                  {ambientSound === 'none' ? 'Silent Night' : 'Listen'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Tap helper hint label */}
        <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-center text-[9px] text-slate-400/80 pointer-events-none">
          <span>✨ Tap canvas for starlight waves & ripples</span>
        </div>
      </div>

      {/* Real-time Intensity & Decibel Meter Bar */}
      <div className="relative z-20 px-3.5 py-2 bg-slate-950/90 border-t border-indigo-950/80 flex items-center justify-between gap-3 text-xs">
        {/* Left: Sound Intensity Label */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isSoundActive ? primaryColor : '#64748b',
              boxShadow: isSoundActive ? `0 0 6px ${primaryColor}` : 'none',
            }}
          />
          <span className="text-[11px] text-slate-300 font-medium">Intensity:</span>
          <span
            className="text-[11px] font-bold font-mono"
            style={{ color: isSoundActive ? primaryColor : '#94a3b8' }}
          >
            {ambientSound === 'none' || ambientVolume === 0
              ? 'Muted (0%)'
              : ambientVolume <= 0.2
              ? `Whisper (${Math.round(ambientVolume * 100)}%)`
              : ambientVolume <= 0.5
              ? `Cozy (${Math.round(ambientVolume * 100)}%)`
              : ambientVolume <= 0.8
              ? `Balanced (${Math.round(ambientVolume * 100)}%)`
              : `Deep Sleep (${Math.round(ambientVolume * 100)}%)`}
          </span>
        </div>

        {/* Right: Real-time Audio Level Decibel Meter */}
        <div className="flex items-center gap-0.5">
          {[0.1, 0.25, 0.45, 0.65, 0.85, 1.0].map((threshold, idx) => {
            const isLit = isSoundActive && ambientVolume >= threshold - 0.05;
            const barColor =
              idx < 3
                ? primaryColor
                : idx < 5
                ? secondaryColor
                : '#fbbf24'; // amber peak

            return (
              <div
                key={`meter-seg-${idx}`}
                className="w-1.5 h-3.5 rounded-sm transition-all duration-200"
                style={{
                  backgroundColor: isLit ? barColor : '#1e1b4b',
                  opacity: isLit ? 1 : 0.4,
                  boxShadow: isLit ? `0 0 4px ${barColor}` : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
