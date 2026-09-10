import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Moon,
  Wind,
  Heart,
  BookOpen,
  ChevronDown,
  CheckCircle2,
  Music,
  Bell,
  BellOff,
  TreePine,
  Waves,
  Sunrise,
} from 'lucide-react';
import {
  guidedBreathingAudio,
  BreathingSoundscape,
} from '../services/guidedBreathingAudio';

export type BreathingVisualization =
  | 'forest-stars'
  | 'deep-ocean'
  | 'cosmic-starlight'
  | 'aurora-glow';

export interface VisualizationTheme {
  id: BreathingVisualization;
  name: string;
  shortLabel: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestedSoundscape: BreathingSoundscape;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  headerBg: string;
  activePillBg: string;
  accentBadge: string;
  accentText: string;
  phaseConfig: {
    inhale: {
      innerColor: string;
      glowColor: string;
      title: string;
      subtitle: string;
      statusBadge: string;
    };
    hold: {
      innerColor: string;
      glowColor: string;
      title: string;
      subtitle: string;
      statusBadge: string;
    };
    exhale: {
      innerColor: string;
      glowColor: string;
      title: string;
      subtitle: string;
      statusBadge: string;
    };
    rest: {
      innerColor: string;
      glowColor: string;
      title: string;
      subtitle: string;
      statusBadge: string;
    };
  };
}

export const VISUALIZATION_THEMES: VisualizationTheme[] = [
  {
    id: 'forest-stars',
    name: 'Forest Stars',
    shortLabel: 'Forest Stars',
    tagline: 'Enchanted pine canopy & dancing fireflies',
    icon: TreePine,
    suggestedSoundscape: 'night-breeze',
    cardBg: 'bg-gradient-to-b from-[#071d15]/98 via-[#04140e]/98 to-[#020b08]/98',
    cardBorder: 'border-emerald-800/50',
    cardShadow: 'shadow-emerald-950/90',
    headerBg: 'bg-emerald-950/30 border-emerald-900/40',
    activePillBg: 'bg-emerald-600/90 text-white shadow-emerald-600/30 border-emerald-400',
    accentBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    accentText: 'text-emerald-400',
    phaseConfig: {
      inhale: {
        innerColor: 'from-emerald-300 via-teal-400 to-green-600',
        glowColor: 'rgba(52, 211, 153, 0.45)',
        title: 'Breathe In Fresh Pine Air...',
        subtitle: 'Fill your chest with cool forest breeze and quiet starlight',
        statusBadge: 'Inhale 🌲',
      },
      hold: {
        innerColor: 'from-amber-200 via-emerald-300 to-teal-400',
        glowColor: 'rgba(251, 191, 36, 0.55)',
        title: 'Hold the Forest Magic...',
        subtitle: 'Keep the peaceful firefly warmth safe in your cozy chest',
        statusBadge: 'Hold ✨',
      },
      exhale: {
        innerColor: 'from-teal-400 via-emerald-600 to-slate-800',
        glowColor: 'rgba(16, 185, 129, 0.35)',
        title: 'Breathe Out Whispers...',
        subtitle: 'Blow all busy wiggles softly into the whispering pine needles',
        statusBadge: 'Exhale 🍃',
      },
      rest: {
        innerColor: 'from-slate-400 via-emerald-800 to-slate-900',
        glowColor: 'rgba(20, 184, 166, 0.3)',
        title: 'Rest in the Cozy Moss...',
        subtitle: 'Feel how quiet, warm, and sheltered you are under the trees',
        statusBadge: 'Rest 🌿',
      },
    },
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    shortLabel: 'Deep Ocean',
    tagline: 'Bioluminescent calm depths & gentle bubbles',
    icon: Waves,
    suggestedSoundscape: 'ocean-waves',
    cardBg: 'bg-gradient-to-b from-[#051c36]/98 via-[#031326]/98 to-[#020a14]/98',
    cardBorder: 'border-cyan-800/50',
    cardShadow: 'shadow-cyan-950/90',
    headerBg: 'bg-cyan-950/30 border-cyan-900/40',
    activePillBg: 'bg-cyan-600/90 text-white shadow-cyan-600/30 border-cyan-400',
    accentBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    accentText: 'text-cyan-400',
    phaseConfig: {
      inhale: {
        innerColor: 'from-cyan-200 via-teal-300 to-blue-500',
        glowColor: 'rgba(34, 211, 238, 0.45)',
        title: 'Draw in the Ocean Calm...',
        subtitle: 'Feel the refreshing, peaceful blue tide filling your chest',
        statusBadge: 'Inhale 🌊',
      },
      hold: {
        innerColor: 'from-teal-200 via-cyan-300 to-indigo-400',
        glowColor: 'rgba(45, 212, 191, 0.6)',
        title: 'Hold the Glowing Deep...',
        subtitle: 'Let bioluminescent coral light shine gently inside your heart',
        statusBadge: 'Hold 🫧',
      },
      exhale: {
        innerColor: 'from-cyan-400 via-blue-600 to-slate-800',
        glowColor: 'rgba(59, 130, 246, 0.35)',
        title: 'Release Like Soft Waves...',
        subtitle: 'Let all tension drift away like bubbles into the calm blue',
        statusBadge: 'Exhale 🌊',
      },
      rest: {
        innerColor: 'from-slate-400 via-cyan-800 to-slate-950',
        glowColor: 'rgba(6, 182, 212, 0.3)',
        title: 'Float on the Gentle Current...',
        subtitle: 'Drifting softly, feeling weightless, calm, and ready to dream',
        statusBadge: 'Rest 🐚',
      },
    },
  },
  {
    id: 'cosmic-starlight',
    name: 'Cosmic Stars',
    shortLabel: 'Cosmic Stars',
    tagline: 'Velvet night sky, constellations & stardust',
    icon: Sparkles,
    suggestedSoundscape: 'celestial-hum',
    cardBg: 'bg-gradient-to-b from-[#110d2a]/98 via-[#0b071e]/98 to-[#070514]/98',
    cardBorder: 'border-indigo-900/60',
    cardShadow: 'shadow-indigo-950/90',
    headerBg: 'bg-indigo-950/30 border-indigo-950/70',
    activePillBg: 'bg-indigo-600/90 text-white shadow-indigo-600/30 border-indigo-400',
    accentBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    accentText: 'text-indigo-400',
    phaseConfig: {
      inhale: {
        innerColor: 'from-sky-300 via-indigo-400 to-purple-500',
        glowColor: 'rgba(56, 189, 248, 0.45)',
        title: 'Breathe In Slowly...',
        subtitle: 'Fill your lungs with warm, peaceful starlight',
        statusBadge: 'Inhale 🌟',
      },
      hold: {
        innerColor: 'from-purple-300 via-pink-400 to-indigo-500',
        glowColor: 'rgba(216, 180, 254, 0.55)',
        title: 'Hold Gently...',
        subtitle: 'Hold the calm starlight inside your cozy chest',
        statusBadge: 'Hold ✨',
      },
      exhale: {
        innerColor: 'from-indigo-400 via-purple-500 to-slate-700',
        glowColor: 'rgba(168, 85, 247, 0.35)',
        title: 'Breathe Out Softly...',
        subtitle: 'Blow out all the day’s wiggles into the quiet night',
        statusBadge: 'Exhale 🍃',
      },
      rest: {
        innerColor: 'from-slate-400 via-indigo-600 to-slate-800',
        glowColor: 'rgba(99, 102, 241, 0.3)',
        title: 'Rest & Be Still...',
        subtitle: 'Feel how cozy, warm, and quiet your body is',
        statusBadge: 'Rest 💤',
      },
    },
  },
  {
    id: 'aurora-glow',
    name: 'Northern Aurora',
    shortLabel: 'Northern Aurora',
    tagline: 'Dancing ribbons of polar light & soft dusk',
    icon: Sunrise,
    suggestedSoundscape: 'starlight-chimes',
    cardBg: 'bg-gradient-to-b from-[#0f1d33]/98 via-[#091826]/98 to-[#060e1a]/98',
    cardBorder: 'border-teal-800/50',
    cardShadow: 'shadow-teal-950/90',
    headerBg: 'bg-teal-950/30 border-teal-900/40',
    activePillBg: 'bg-teal-600/90 text-white shadow-teal-600/30 border-teal-400',
    accentBadge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    accentText: 'text-teal-400',
    phaseConfig: {
      inhale: {
        innerColor: 'from-emerald-300 via-teal-300 to-purple-500',
        glowColor: 'rgba(110, 231, 183, 0.45)',
        title: 'Breathe In the Aurora...',
        subtitle: 'Inhale the glowing emerald and lavender ribbons of light',
        statusBadge: 'Inhale 🌌',
      },
      hold: {
        innerColor: 'from-violet-300 via-purple-400 to-teal-400',
        glowColor: 'rgba(196, 181, 253, 0.6)',
        title: 'Hold the Dancing Colors...',
        subtitle: 'Feel the gentle polar warmth shining quietly inside you',
        statusBadge: 'Hold 💫',
      },
      exhale: {
        innerColor: 'from-teal-400 via-purple-600 to-slate-800',
        glowColor: 'rgba(167, 139, 250, 0.35)',
        title: 'Release into the Arctic Sky...',
        subtitle: 'Let all tension dissolve into the endless starry north',
        statusBadge: 'Exhale 🌌',
      },
      rest: {
        innerColor: 'from-slate-400 via-purple-800 to-slate-950',
        glowColor: 'rgba(139, 92, 246, 0.3)',
        title: 'Rest in the Quiet Glow...',
        subtitle: 'Surrounded by soft glowing ribbons, peaceful and cozy',
        statusBadge: 'Rest 🌠',
      },
    },
  },
];

export interface GuidedBreathingPattern {
  id: string;
  name: string;
  description: string;
  targetAge: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  restSeconds: number;
}

export const BREATHING_PATTERNS: GuidedBreathingPattern[] = [
  {
    id: 'starry-balance',
    name: 'Starry Breath',
    description: 'Gentle balance for relaxation',
    targetAge: 'Ages 4-9',
    inhaleSeconds: 4,
    holdSeconds: 2,
    exhaleSeconds: 4,
    restSeconds: 1,
  },
  {
    id: 'teddy-bear',
    name: 'Teddy Bear Snuggle',
    description: 'Short & gentle for little ones',
    targetAge: 'Ages 3-5',
    inhaleSeconds: 3,
    holdSeconds: 1,
    exhaleSeconds: 3,
    restSeconds: 1,
  },
  {
    id: 'deep-slumber',
    name: 'Deep Slumber',
    description: 'Long soothing sighs into dreamland',
    targetAge: 'Ages 6-9+',
    inhaleSeconds: 4,
    holdSeconds: 4,
    exhaleSeconds: 6,
    restSeconds: 2,
  },
];

const BEDTIME_AFFIRMATIONS = [
  'Let your shoulders drop and feel heavy as a cozy blanket.',
  'Your mind is peaceful like a quiet starry sky.',
  'All of today’s busy wiggles are floating away like little clouds.',
  'Your heart is beating calm, steady, and warm.',
  'You are safe, loved, and ready for happy dreams.',
  'Every breath invites soft sleep a little closer.',
];

const SOUNDSCAPE_OPTIONS: { id: BreathingSoundscape; label: string; icon: string }[] = [
  { id: 'celestial-hum', label: 'Celestial Hum (432Hz)', icon: '✨' },
  { id: 'ocean-waves', label: 'Ocean Waves', icon: '🌊' },
  { id: 'night-breeze', label: 'Starry Breeze', icon: '🍃' },
  { id: 'starlight-chimes', label: 'Sleep Chimes', icon: '🔔' },
  { id: 'warm-rain', label: 'Warm Rain', icon: '🌧️' },
  { id: 'silent', label: 'Silent Mode', icon: '🔇' },
];

const AmbientParticles: React.FC<{ visualization: BreathingVisualization }> = ({
  visualization,
}) => {
  if (visualization === 'forest-stars') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft emerald canopy ambient glow */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-emerald-600/15 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-teal-600/15 blur-3xl" />
        {/* Drifting glowing fireflies */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`firefly-${i}`}
            className="absolute rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.95)]"
            style={{
              width: i % 2 === 0 ? 5 : 3.5,
              height: i % 2 === 0 ? 5 : 3.5,
              left: `${((i * 19 + 7) % 90) + 5}%`,
              top: `${((i * 23 + 11) % 85) + 5}%`,
            }}
            animate={{
              x: [0, i % 2 === 0 ? 14 : -14, 0],
              y: [0, i % 3 === 0 ? -18 : -10, 0],
              opacity: [0.25, 0.95, 0.25],
              scale: [0.75, 1.35, 0.75],
            }}
            transition={{
              duration: 3.2 + (i % 4) * 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.25,
            }}
          />
        ))}
      </div>
    );
  }

  if (visualization === 'deep-ocean') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Oceanic cyan glow */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-cyan-600/15 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-blue-600/15 blur-3xl" />
        {/* Bioluminescent rising sea bubbles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`bubble-${i}`}
            className="absolute rounded-full border border-cyan-300/60 bg-cyan-400/20 shadow-[0_0_8px_rgba(34,211,238,0.5)] backdrop-blur-[1px]"
            style={{
              width: 7 + (i % 4) * 4,
              height: 7 + (i % 4) * 4,
              left: `${((i * 17 + 9) % 88) + 6}%`,
              bottom: `${(i * 14) % 40}%`,
            }}
            animate={{
              y: [0, -160 - (i % 3) * 35],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              opacity: [0, 0.85, 0],
              scale: [0.75, 1.15, 0.85],
            }}
            transition={{
              duration: 4.2 + (i % 3) * 1.1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.35,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/80 ml-1 mt-0.5" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (visualization === 'aurora-glow') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dancing aurora light ribbon */}
        <motion.div
          className="absolute -top-8 -left-10 w-[130%] h-52 bg-gradient-to-r from-emerald-500/15 via-teal-400/20 to-purple-500/15 blur-3xl pointer-events-none"
          animate={{
            opacity: [0.35, 0.7, 0.35],
            scaleY: [1, 1.3, 1],
            x: [-18, 18, -18],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Soft polar starlight */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`polar-star-${i}`}
            className="absolute rounded-full bg-teal-200 shadow-[0_0_6px_rgba(153,246,228,0.8)]"
            style={{
              width: i % 3 === 0 ? 3.5 : 2.5,
              height: i % 3 === 0 ? 3.5 : 2.5,
              left: `${((i * 19 + 5) % 90) + 5}%`,
              top: `${((i * 21 + 8) % 85) + 5}%`,
            }}
            animate={{
              opacity: [0.2, 0.9, 0.2],
              scale: [0.7, 1.3, 0.7],
            }}
            transition={{
              duration: 2.5 + (i % 3) * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.25,
            }}
          />
        ))}
      </div>
    );
  }

  // cosmic-starlight default
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-purple-600/15 blur-3xl" />
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-indigo-200 shadow-[0_0_6px_rgba(199,210,254,0.8)]"
          style={{
            width: i % 3 === 0 ? 3.5 : 2.5,
            height: i % 3 === 0 ? 3.5 : 2.5,
            left: `${((i * 21 + 13) % 92) + 4}%`,
            top: `${((i * 17 + 9) % 88) + 6}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.7, 1.3, 0.7],
          }}
          transition={{
            duration: 2 + (i % 3) * 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

interface GuidedBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReadyForStory?: () => void;
  childName?: string;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

export const GuidedBreathingModal: React.FC<GuidedBreathingModalProps> = ({
  isOpen,
  onClose,
  onReadyForStory,
  childName = 'Little Explorer',
}) => {
  // State
  const [visualization, setVisualization] = useState<BreathingVisualization>('forest-stars');
  const [activePatternId, setActivePatternId] = useState<string>('starry-balance');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [targetCycles] = useState<number>(5);
  const [isSessionFinished, setIsSessionFinished] = useState<boolean>(false);

  // Audio controls
  const [soundscape, setSoundscape] = useState<BreathingSoundscape>('night-breeze');
  const [volume, setVolume] = useState<number>(0.35);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [breathToneEnabled, setBreathToneEnabled] = useState<boolean>(true);
  const [showSoundMenu, setShowSoundMenu] = useState<boolean>(false);
  const [affirmationIndex, setAffirmationIndex] = useState<number>(0);

  const activePattern =
    BREATHING_PATTERNS.find((p) => p.id === activePatternId) || BREATHING_PATTERNS[0];

  const activeTheme =
    VISUALIZATION_THEMES.find((t) => t.id === visualization) || VISUALIZATION_THEMES[0];

  // Store pattern config in ref to keep timer loop stable
  const patternRef = useRef(activePattern);
  patternRef.current = activePattern;

  const currentPhaseRef = useRef(currentPhase);
  currentPhaseRef.current = currentPhase;

  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const breathToneEnabledRef = useRef(breathToneEnabled);
  breathToneEnabledRef.current = breathToneEnabled;

  // Initialize and clean up audio when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsActive(true);
      setIsSessionFinished(false);
      setCompletedCycles(0);
      setCurrentPhase('inhale');
      setPhaseSecondsLeft(activePattern.inhaleSeconds);

      // Start calm ambient background
      if (!isMuted && soundscape !== 'silent') {
        guidedBreathingAudio.startAmbient(soundscape, volume);
      }

      // Play initial breath cue
      if (!isMuted && breathToneEnabled) {
        guidedBreathingAudio.playPhaseTone('inhale', activePattern.inhaleSeconds, true, volume);
      }
    } else {
      // Teardown audio on modal close
      guidedBreathingAudio.cleanup();
    }

    return () => {
      guidedBreathingAudio.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle ambient soundscape or volume changes
  useEffect(() => {
    if (!isOpen) return;

    if (isMuted || soundscape === 'silent') {
      guidedBreathingAudio.stopAmbient();
    } else {
      guidedBreathingAudio.startAmbient(soundscape, volume);
    }
  }, [isOpen, soundscape, isMuted, volume]);

  useEffect(() => {
    if (isOpen && !isMuted) {
      guidedBreathingAudio.setVolume(volume);
    }
  }, [isOpen, volume, isMuted]);

  // Main Breathing Clock loop
  useEffect(() => {
    if (!isOpen || !isActive || isSessionFinished) return;

    const timer = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Transition to next phase
        const current = currentPhaseRef.current;
        const pattern = patternRef.current;
        let nextPhase: BreathPhase = 'inhale';
        let nextDuration = pattern.inhaleSeconds;

        if (current === 'inhale') {
          if (pattern.holdSeconds > 0) {
            nextPhase = 'hold';
            nextDuration = pattern.holdSeconds;
          } else {
            nextPhase = 'exhale';
            nextDuration = pattern.exhaleSeconds;
          }
        } else if (current === 'hold') {
          nextPhase = 'exhale';
          nextDuration = pattern.exhaleSeconds;
        } else if (current === 'exhale') {
          if (pattern.restSeconds > 0) {
            nextPhase = 'rest';
            nextDuration = pattern.restSeconds;
          } else {
            nextPhase = 'inhale';
            nextDuration = pattern.inhaleSeconds;
          }
        } else if (current === 'rest') {
          nextPhase = 'inhale';
          nextDuration = pattern.inhaleSeconds;
        }

        // On completing exhale/rest, increment completed breath cycle
        if (current === 'exhale' && pattern.restSeconds === 0) {
          setCompletedCycles((c) => {
            const updated = c + 1;
            if (updated >= targetCycles) {
              setIsSessionFinished(true);
              guidedBreathingAudio.playCompletionChime();
            }
            return updated;
          });
          setAffirmationIndex((i) => (i + 1) % BEDTIME_AFFIRMATIONS.length);
        } else if (current === 'rest') {
          setCompletedCycles((c) => {
            const updated = c + 1;
            if (updated >= targetCycles) {
              setIsSessionFinished(true);
              guidedBreathingAudio.playCompletionChime();
            }
            return updated;
          });
          setAffirmationIndex((i) => (i + 1) % BEDTIME_AFFIRMATIONS.length);
        }

        setCurrentPhase(nextPhase);

        // Play cue tone for new phase if audio enabled
        if (!isMutedRef.current && breathToneEnabledRef.current) {
          guidedBreathingAudio.playPhaseTone(
            nextPhase,
            nextDuration,
            true,
            volumeRef.current
          );
        }

        return nextDuration;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, isSessionFinished, targetCycles]);

  // Restart breathing session
  const handleRestart = useCallback(() => {
    setCompletedCycles(0);
    setIsSessionFinished(false);
    setIsActive(true);
    setCurrentPhase('inhale');
    setPhaseSecondsLeft(activePattern.inhaleSeconds);

    if (!isMuted && breathToneEnabled) {
      guidedBreathingAudio.playPhaseTone('inhale', activePattern.inhaleSeconds, true, volume);
    }
  }, [activePattern, isMuted, breathToneEnabled, volume]);

  // Switch breathing pattern
  const handleSelectPattern = (patternId: string) => {
    setActivePatternId(patternId);
    const pat = BREATHING_PATTERNS.find((p) => p.id === patternId) || BREATHING_PATTERNS[0];
    setCurrentPhase('inhale');
    setPhaseSecondsLeft(pat.inhaleSeconds);
    if (!isMuted && breathToneEnabled) {
      guidedBreathingAudio.playPhaseTone('inhale', pat.inhaleSeconds, true, volume);
    }
  };

  // Switch soothing background visualization
  const handleSelectVisualization = (visId: BreathingVisualization) => {
    setVisualization(visId);
    const theme = VISUALIZATION_THEMES.find((t) => t.id === visId);
    if (theme && !isMuted) {
      setSoundscape(theme.suggestedSoundscape);
    }
  };

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' && !isSessionFinished) {
        e.preventDefault();
        setIsActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSessionFinished]);

  if (!isOpen) return null;

  // Visual cues based on phase and active visualization theme
  const getPhaseDetails = () => {
    const themeConfig = activeTheme.phaseConfig[currentPhase];
    const duration =
      currentPhase === 'inhale'
        ? activePattern.inhaleSeconds
        : currentPhase === 'hold'
        ? activePattern.holdSeconds
        : currentPhase === 'exhale'
        ? activePattern.exhaleSeconds
        : activePattern.restSeconds;

    const icon =
      currentPhase === 'inhale'
        ? Wind
        : currentPhase === 'hold'
        ? Sparkles
        : currentPhase === 'exhale'
        ? Heart
        : Moon;

    const scale =
      currentPhase === 'inhale'
        ? 1.7
        : currentPhase === 'hold'
        ? 1.74
        : currentPhase === 'exhale'
        ? 1.0
        : 1.05;

    const haloOpacity =
      currentPhase === 'inhale'
        ? 0.85
        : currentPhase === 'hold'
        ? 0.95
        : currentPhase === 'exhale'
        ? 0.4
        : 0.3;

    return {
      title: themeConfig.title,
      subtitle: themeConfig.subtitle,
      icon,
      scale,
      haloOpacity,
      glowColor: themeConfig.glowColor,
      innerColor: themeConfig.innerColor,
      duration,
      statusBadge: themeConfig.statusBadge,
    };
  };

  const phaseDetails = getPhaseDetails();

  return (
    <div
      id="guided-breathing-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto"
    >
      {/* Dynamic Background Atmosphere according to visualization theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700">
        {visualization === 'forest-stars' ? (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-600/15 blur-3xl" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:24px_24px]" />
          </>
        ) : visualization === 'deep-ocean' ? (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-600/15 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:24px_24px]" />
          </>
        ) : visualization === 'aurora-glow' ? (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-600/15 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a78bfa_1px,transparent_1px)] [background-size:24px_24px]" />
          </>
        ) : (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl" />
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:24px_24px]" />
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`relative w-full max-w-2xl rounded-3xl ${activeTheme.cardBg} border ${activeTheme.cardBorder} shadow-2xl ${activeTheme.cardShadow} overflow-hidden text-slate-100 flex flex-col my-auto transition-colors duration-500`}
      >
        <AmbientParticles visualization={visualization} />

        {/* Modal Top Header Bar */}
        <div className={`flex items-center justify-between px-5 sm:px-8 py-4 border-b ${activeTheme.headerBg} transition-colors duration-300 relative z-10`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900/60 border border-white/20 flex items-center justify-center shadow-inner">
              <activeTheme.icon className={`w-4 h-4 ${activeTheme.accentText}`} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Guided Bedtime Breathing</span>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${activeTheme.accentBadge}`}>
                  {activeTheme.shortLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Helping <strong className="text-white font-semibold">{childName}</strong> settle down before storytime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Quick Toggle */}
            <button
              type="button"
              id="breathing-mute-toggle-btn"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="guided-breathing-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-colors"
              title="Close Guided Breathing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 sm:p-8 flex flex-col items-center justify-center space-y-5 relative z-10">
          {!isSessionFinished ? (
            <>
              {/* Soothing Scenery / Mood Selector Toggle */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                    <activeTheme.icon className={`w-3.5 h-3.5 ${activeTheme.accentText}`} />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Soothing Mood: </span>
                    <span className="text-slate-300 text-[11px] hidden md:inline">
                      {activeTheme.tagline}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  {VISUALIZATION_THEMES.map((theme) => {
                    const isSelected = theme.id === visualization;
                    const ThemeIcon = theme.icon;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        id={`breathing-scenery-${theme.id}-btn`}
                        onClick={() => handleSelectVisualization(theme.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? `${theme.activePillBg} scale-105 border`
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                        }`}
                        title={theme.tagline}
                      >
                        <ThemeIcon className="w-3.5 h-3.5" />
                        <span>{theme.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pattern Selector Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-md">
                {BREATHING_PATTERNS.map((p) => {
                  const isSelected = p.id === activePatternId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPattern(p.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        isSelected
                          ? `${activeTheme.activePillBg} scale-105 border`
                          : 'bg-slate-900/60 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="ml-1.5 opacity-70 text-[10px]">({p.targetAge})</span>
                    </button>
                  );
                })}
              </div>

              {/* CENTRAL GLOWING EXPANDING/CONTRACTING ORB */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2 select-none">
                {/* Outermost Pulsing Nebular Ring */}
                <motion.div
                  animate={{
                    scale: phaseDetails.scale * 1.35,
                    opacity: phaseDetails.haloOpacity * 0.45,
                  }}
                  transition={{
                    duration: phaseDetails.duration,
                    ease: 'easeInOut',
                  }}
                  style={{
                    backgroundColor: phaseDetails.glowColor,
                  }}
                  className="absolute w-44 h-44 sm:w-48 sm:h-48 rounded-full blur-2xl pointer-events-none"
                />

                {/* Second Radiating Ripple Wave Ring */}
                <motion.div
                  animate={{
                    scale: phaseDetails.scale * 1.18,
                    opacity: phaseDetails.haloOpacity * 0.75,
                  }}
                  transition={{
                    duration: phaseDetails.duration,
                    ease: 'easeInOut',
                  }}
                  className="absolute w-40 h-40 sm:w-44 sm:h-44 rounded-full border-2 border-indigo-400/40 pointer-events-none shadow-lg shadow-indigo-500/20"
                />

                {/* THE CORE GLOWING ORB */}
                <motion.div
                  animate={{
                    scale: phaseDetails.scale,
                  }}
                  transition={{
                    duration: phaseDetails.duration,
                    ease: 'easeInOut',
                  }}
                  className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr ${phaseDetails.innerColor} shadow-2xl flex flex-col items-center justify-center text-white relative z-10 cursor-pointer overflow-hidden group`}
                  onClick={() => setIsActive(!isActive)}
                  title={isActive ? 'Click to Pause' : 'Click to Resume'}
                >
                  {/* Subtle Inner Glass Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/25 rounded-full pointer-events-none" />

                  {/* Sparkle Particles on Orb */}
                  <div className="absolute top-3 left-6 w-2 h-2 rounded-full bg-white/80 blur-[0.5px]" />
                  <div className="absolute bottom-5 right-7 w-1.5 h-1.5 rounded-full bg-white/60 blur-[0.5px]" />

                  {/* Dynamic Phase Text inside Orb */}
                  <div className="relative z-10 flex flex-col items-center text-center px-3">
                    <span className="text-xl sm:text-2xl font-black tracking-wider drop-shadow-md">
                      {phaseSecondsLeft}s
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/95 drop-shadow">
                      {currentPhase}
                    </span>
                  </div>
                </motion.div>

                {/* Floating Celestial Orbital Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-56 h-56 sm:w-60 sm:h-60 rounded-full border border-dashed border-indigo-400/20 pointer-events-none"
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-300 shadow-lg shadow-amber-300/80" />
                </motion.div>
              </div>

              {/* Dynamic Affirmation & Guidance Phase Description */}
              <div className="text-center space-y-1.5 max-w-md min-h-[64px]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/40 text-xs text-indigo-300 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{phaseDetails.statusBadge}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-playfair text-white tracking-wide">
                  {phaseDetails.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-light">
                  {phaseDetails.subtitle}
                </p>
              </div>

              {/* Starlight Breath Progress Counter */}
              <div className="w-full max-w-sm px-4 py-3 rounded-2xl bg-slate-900/60 border border-indigo-950/70 flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Starlight Breaths</span>
                  </span>
                  <span className="font-bold text-amber-300">
                    {completedCycles} of {targetCycles} Completed
                  </span>
                </div>

                {/* Star Badges for Each Completed Breath */}
                <div className="flex items-center justify-center gap-2.5 w-full pt-1">
                  {Array.from({ length: targetCycles }).map((_, idx) => {
                    const isCompleted = idx < completedCycles;
                    const isCurrent = idx === completedCycles && !isSessionFinished;
                    return (
                      <motion.div
                        key={`star-step-${idx}`}
                        animate={isCurrent ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={isCurrent ? { repeat: Infinity, duration: 2 } : undefined}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/40'
                            : isCurrent
                            ? 'bg-indigo-600/80 text-white border border-indigo-400'
                            : 'bg-slate-800/60 text-slate-600 border border-slate-700/40'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Gentle Calming Bedtime Affirmation Card */}
              <div className="w-full max-w-md text-center px-4 py-2 rounded-xl bg-indigo-950/30 border border-indigo-900/30 text-xs text-indigo-200/90 italic font-serif">
                &ldquo;{BEDTIME_AFFIRMATIONS[affirmationIndex]}&rdquo;
              </div>

              {/* Primary Play/Pause Controls & Sound Picker */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  id="breathing-play-pause-btn"
                  onClick={() => setIsActive(!isActive)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 min-h-[42px]"
                >
                  {isActive ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause Breathing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Resume Calm</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="breathing-restart-btn"
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-indigo-900/50 transition-colors min-h-[42px]"
                  title="Reset from first breath"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>

                <button
                  type="button"
                  id="breathing-soundscape-menu-btn"
                  onClick={() => setShowSoundMenu(!showSoundMenu)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-indigo-900/50 transition-colors min-h-[42px]"
                >
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Ambient:</span>
                  <span className="text-amber-300 font-bold capitalize">
                    {soundscape.replace('-', ' ')}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>
              </div>

              {/* Soundscape & Tone Customization Drawer */}
              {showSoundMenu && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-md p-4 rounded-2xl bg-slate-900/90 border border-indigo-900/60 space-y-3.5 text-xs text-slate-300 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ambient Sleep Soundscape</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSoundMenu(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Current Mood Sync Helper */}
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <activeTheme.icon className={`w-3.5 h-3.5 ${activeTheme.accentText}`} />
                      <span>Mood: <strong className="text-white font-medium">{activeTheme.name}</strong></span>
                    </span>
                    <button
                      type="button"
                      id="breathing-sync-soundscape-btn"
                      onClick={() => setSoundscape(activeTheme.suggestedSoundscape)}
                      className="text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
                    >
                      Use {activeTheme.suggestedSoundscape.replace('-', ' ')}
                    </button>
                  </div>

                  {/* Soundscape pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOUNDSCAPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSoundscape(opt.id)}
                        className={`p-2 rounded-xl text-left flex items-center gap-2 border transition-all ${
                          soundscape === opt.id
                            ? 'bg-indigo-600/80 text-white border-indigo-400 font-bold shadow-sm'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span className="truncate text-[11px]">{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Volume Slider & Chime Toggle */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Ambient Volume</span>
                      <span className="font-bold text-indigo-300">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.9"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 rounded-lg bg-slate-800"
                    />

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-400">Breath Cue Chime</span>
                      <button
                        type="button"
                        onClick={() => setBreathToneEnabled(!breathToneEnabled)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                          breathToneEnabled
                            ? 'bg-indigo-900/60 text-indigo-200 border-indigo-700'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {breathToneEnabled ? (
                          <>
                            <Bell className="w-3 h-3 text-amber-400" />
                            <span>Chime On</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3 h-3 text-slate-500" />
                            <span>Muted</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            /* COMPLETION SCREEN: Celebratory Sleep Transition */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-6 max-w-md flex flex-col items-center"
            >
              {/* Glowing Star Icon Badge */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-400/40 animate-pulse">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs uppercase tracking-widest border border-amber-400/30">
                  Peaceful Mind Achieved
                </span>
                <h3 className="text-2xl sm:text-3xl font-playfair font-bold text-white tracking-wide">
                  Wonderfully Calm, {childName}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  You completed 5 deep starlight breaths. Your mind and body are cozy, relaxed, and ready to embark into tonight&apos;s bedtime story.
                </p>
              </div>

              {/* Action Buttons: Choose Story or Continue Breathing */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-3">
                {onReadyForStory && (
                  <button
                    type="button"
                    id="breathing-ready-for-story-btn"
                    onClick={() => {
                      onClose();
                      onReadyForStory();
                    }}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-xl shadow-amber-400/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Begin Bedtime Story</span>
                  </button>
                )}

                <button
                  type="button"
                  id="breathing-do-more-breaths-btn"
                  onClick={handleRestart}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-indigo-900/60 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Breathe More</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-indigo-950/40 border-t border-indigo-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Soothing Sleep Preparation • Safe for ages 3–9</span>
          </span>
          <span className="hidden sm:inline opacity-70">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">Space</kbd> to Pause
          </span>
        </div>
      </motion.div>
    </div>
  );
};
