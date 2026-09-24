import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Story, StoryScene, AppSettings, CelestialBadge, VocabularyWord } from '../types';
import { getHeroById } from '../data/heroes';
import {
  VoiceNarrator,
  ambientSoundEngine,
  PRELOADED_NARRATORS,
  CharacterNarrator,
} from '../services/audioNarration';
import { SleepDurationEstimator } from './SleepDurationEstimator';
import { SleepTimerModal } from './SleepTimerModal';
import { AmbientWaveVisualizer } from './AmbientWaveVisualizer';
import { BadgeUnlockCelebrationModal } from './BadgeUnlockCelebrationModal';
import { VocabularySparkModal } from './VocabularySparkModal';
import { findVocabularyWordByText, getVocabularyWordById } from '../data/vocabularyWords';
import confetti from 'canvas-confetti';
import {
  VolumeX,
  Volume2,
  Volume1,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sparkles,
  Moon,
  Clock,
  CheckCircle2,
  CloudRain,
  Waves,
  Wind,
  Flame,
  Train,
  Music2,
  ArrowLeft,
  X,
  Award,
  Sliders,
  Gauge,
  Bot,
  Check,
  Star,
  Heart,
} from 'lucide-react';

interface ParsedSentence {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  isAffirmation?: boolean;
}

function parseSceneSentences(sceneText: string, affirmationText?: string): ParsedSentence[] {
  const result: ParsedSentence[] = [];
  if (!sceneText) return result;

  // Split by sentence terminators (. ! ?) including optional closing quotes or newlines
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+["'”’]?|\n+|$)/g;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = sentenceRegex.exec(sceneText)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const matchStart = match.index;
      const leadingSpace = raw.search(/\S/);
      const start = matchStart + (leadingSpace >= 0 ? leadingSpace : 0);
      const end = start + trimmed.length;

      result.push({
        id: `s-${idx++}`,
        text: trimmed,
        startIndex: start,
        endIndex: end,
        isAffirmation: false,
      });
    }
  }

  if (result.length === 0 && sceneText.trim().length > 0) {
    result.push({
      id: `s-0`,
      text: sceneText.trim(),
      startIndex: 0,
      endIndex: sceneText.length,
      isAffirmation: false,
    });
  }

  if (affirmationText && affirmationText.trim().length > 0) {
    const prefix = `${sceneText}. ... `;
    const affStart = prefix.length;
    result.push({
      id: `aff-0`,
      text: affirmationText.trim(),
      startIndex: affStart,
      endIndex: affStart + affirmationText.trim().length,
      isAffirmation: true,
    });
  }

  return result;
}

const SOUND_OPTIONS = [
  { id: 'none', label: 'Off', name: 'Muted', icon: VolumeX },
  { id: 'ocean', label: 'Ocean', name: 'Ocean Waves', icon: Waves },
  { id: 'rain', label: 'Rain', name: 'Gentle Rain', icon: CloudRain },
  { id: 'wind', label: 'Breeze', name: 'Night Breeze', icon: Wind },
  { id: 'fire', label: 'Fire', name: 'Cozy Fire', icon: Flame },
  { id: 'train', label: 'Train', name: 'Dream Train', icon: Train },
];

export const READING_SPEED_OPTIONS = [
  { id: 'slow', label: 'Slow', rate: 0.75, sublabel: '0.75x', description: 'Extra calm bedtime pacing' },
  { id: 'gentle', label: 'Gentle', rate: 0.88, sublabel: '0.9x', description: 'Soothing story rhythm' },
  { id: 'natural', label: 'Natural', rate: 1.0, sublabel: '1.0x', description: 'Standard conversational flow' },
] as const;

interface StoryReaderProps {
  story: Story;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onClose: () => void;
  onCompleteStory: (storyId: string) => CelestialBadge[] | void;
  onToggleSaveStory: (story: Story) => void;
  isSaved?: boolean;
  badges?: CelestialBadge[];
  onNavigateToVault?: () => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  settings,
  onClose,
  onCompleteStory,
  onToggleSaveStory,
  isSaved = false,
  badges = [],
  onNavigateToVault,
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);
  const [spokenCharIndex, setSpokenCharIndex] = useState<number | null>(null);
  const [ambientSound, setAmbientSound] = useState<string>(settings.ambientSound || 'none');
  const [ambientVolume, setAmbientVolume] = useState<number>(
    settings.ambientVolume !== undefined ? settings.ambientVolume : 0.3
  );
  const [narrationVolume] = useState<number>(0.95);
  const [ambientLoopMinutes, setAmbientLoopMinutes] = useState<number>(30);
  const [showSleepForecastModal, setShowSleepForecastModal] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState<number>(
    settings.readingSpeed === 'gentle' ? 0.75 : settings.readingSpeed === 'medium' ? 0.88 : 1.0
  );
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [sleepTimerTotalSeconds, setSleepTimerTotalSeconds] = useState<number | null>(null);
  const [isSleepTimerPaused, setIsSleepTimerPaused] = useState(false);
  const [enableGradualFadeout, setEnableGradualFadeout] = useState(true);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSoundControls, setShowSoundControls] = useState(false);
  const [isBreathingIn, setIsBreathingIn] = useState(true);
  const [unlockedBadgesToCelebrate, setUnlockedBadgesToCelebrate] = useState<CelestialBadge[]>([]);
  const [showBadgeCelebrationModal, setShowBadgeCelebrationModal] = useState(false);
  const [activeVocabWord, setActiveVocabWord] = useState<VocabularyWord | null>(null);
  const prevAmbientVolumeRef = useRef<number>(ambientVolume > 0 ? ambientVolume : 0.3);

  // AI Character Narrator Voice Selection state
  const [selectedNarratorId, setSelectedNarratorId] = useState<string>(() => {
    const initial = settings.narratorVoice;
    if (initial === 'moonbeam' || initial === 'voice-moonbeam') return 'luna';
    if (initial === 'starlight-guide') return 'stella';
    if (initial === 'forest-whisperer') return 'zephyr';
    if (initial === 'cozy-hearth') return 'orion';
    if (initial === 'wise-hearth') return 'barnaby';
    if (initial === 'playful-dreamer') return 'pip';
    if (PRELOADED_NARRATORS.some((n) => n.id === initial)) return initial;
    return 'luna';
  });
  const [showNarratorDropdown, setShowNarratorDropdown] = useState(false);
  const [previewingNarratorId, setPreviewingNarratorId] = useState<string | null>(null);
  const narratorDropdownRef = useRef<HTMLDivElement | null>(null);

  const activeNarrator = useMemo(() => {
    return (
      PRELOADED_NARRATORS.find((n) => n.id === selectedNarratorId) || PRELOADED_NARRATORS[0]
    );
  }, [selectedNarratorId]);

  // Click outside to dismiss AI Narrator dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        narratorDropdownRef.current &&
        !narratorDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNarratorDropdown(false);
      }
    };
    if (showNarratorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNarratorDropdown]);

  const activeSoundOption = useMemo(() => {
    return SOUND_OPTIONS.find((s) => s.id === ambientSound) || SOUND_OPTIONS[0];
  }, [ambientSound]);

  const activeSpeedOption = useMemo(() => {
    return (
      READING_SPEED_OPTIONS.find((s) => Math.abs(readingSpeed - s.rate) < 0.05) ||
      READING_SPEED_OPTIONS[1]
    );
  }, [readingSpeed]);

  // Breathing animation cycle duration (in seconds) synchronized with Reading Speed setting
  // Slow (0.75x) -> 6.0s deep bedtime breath cycle
  // Gentle (0.9x) -> 4.8s calming soothing breath cycle
  // Natural (1.0x) -> 3.6s relaxed natural breath cycle
  const breathingDuration = useMemo(() => {
    if (readingSpeed <= 0.76) return 6.0;
    if (readingSpeed <= 0.90) return 4.8;
    return 3.6;
  }, [readingSpeed]);

  const handleToggleMuteAmbient = useCallback(() => {
    if (ambientVolume > 0) {
      prevAmbientVolumeRef.current = ambientVolume;
      setAmbientVolume(0);
    } else {
      const restored = prevAmbientVolumeRef.current > 0 ? prevAmbientVolumeRef.current : 0.3;
      setAmbientVolume(restored);
      if (ambientSound === 'none') {
        setAmbientSound('ocean');
      }
    }
  }, [ambientVolume, ambientSound]);

  const hero = getHeroById(story.heroId);
  const scenes = story.scenes || [];
  const currentScene: StoryScene | undefined = scenes[currentSceneIndex] || scenes[0];
  const progressPercent = Math.round(((currentSceneIndex + 1) / Math.max(scenes.length, 1)) * 100);

  // Parse sentences for real-time visual follow-along highlighting
  const parsedSentences = useMemo(() => {
    return parseSceneSentences(currentScene?.text || '', currentScene?.sleepAffirmation);
  }, [currentScene?.text, currentScene?.sleepAffirmation]);

  // Scan current scene for vocabulary spark words
  const currentSceneVocabWord = useMemo(() => {
    if (!currentScene?.text) return null;
    return findVocabularyWordByText(currentScene.text);
  }, [currentScene?.text]);

  // Determine active sentence index by current character offset
  const activeSentenceId = useMemo(() => {
    if (!isPlayingNarration || spokenCharIndex === null || parsedSentences.length === 0) {
      return null;
    }
    for (let i = parsedSentences.length - 1; i >= 0; i--) {
      if (spokenCharIndex >= parsedSentences[i].startIndex) {
        return parsedSentences[i].id;
      }
    }
    return parsedSentences[0].id;
  }, [isPlayingNarration, spokenCharIndex, parsedSentences]);

  // Breathing animation cycle for calming sleep mode
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBreathingIn((prev) => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Sleep timer countdown with gradual audio fade-out
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0 || isSleepTimerPaused) return;

    const timer = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Timer reached 0: gracefully stop audio and reset
          VoiceNarrator.stop();
          ambientSoundEngine.stopAmbient();
          setIsPlayingNarration(false);
          setSleepTimerTotalSeconds(null);
          return null;
        }

        const nextRemaining = prev - 1;

        // Gradual fade-out calculation over final 60 seconds
        if (enableGradualFadeout) {
          const fadeWindow = Math.min(
            60,
            sleepTimerTotalSeconds ? Math.max(20, Math.floor(sleepTimerTotalSeconds * 0.35)) : 60
          );
          if (nextRemaining <= fadeWindow) {
            const fadeFactor = Math.max(0.04, nextRemaining / fadeWindow);
            ambientSoundEngine.setVolume(ambientVolume * fadeFactor);
          }
        }

        return nextRemaining;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    sleepTimerRemaining,
    isSleepTimerPaused,
    enableGradualFadeout,
    sleepTimerTotalSeconds,
    ambientVolume,
  ]);

  // Ambient sound engine sync
  useEffect(() => {
    if (ambientSound !== 'none') {
      ambientSoundEngine.playAmbient(ambientSound, ambientVolume);
    } else {
      ambientSoundEngine.stopAmbient();
    }
    return () => {
      ambientSoundEngine.stopAmbient();
    };
  }, [ambientSound, ambientVolume]);

  useEffect(() => {
    ambientSoundEngine.setVolume(ambientVolume);
  }, [ambientVolume]);

  const celebrationTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup any pending celebration timers
  useEffect(() => {
    return () => {
      celebrationTimersRef.current.forEach((t) => clearTimeout(t));
      celebrationTimersRef.current = [];
    };
  }, []);

  const triggerCelebration = useCallback(() => {
    // Play warm celestial chime audio
    ambientSoundEngine.playCelebrationChime();

    // Clear any previous timers
    celebrationTimersRef.current.forEach((t) => clearTimeout(t));
    celebrationTimersRef.current = [];

    try {
      const heroColor = hero?.color || '#FFD54F';
      const celebrationPalette = [
        heroColor,
        '#6366F1', // Indigo
        '#A855F7', // Purple
        '#F59E0B', // Amber gold
        '#38BDF8', // Starlight sky cyan
        '#EC4899', // Sparkle pink
        '#10B981', // Emerald star
      ];

      // Stage 1: Central starlight burst
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.55 },
        colors: celebrationPalette,
        scalar: 1.15,
        ticks: 220,
        shapes: ['circle', 'square'],
      });

      // Stage 2: Left side cannon launch
      const timer1 = setTimeout(() => {
        confetti({
          particleCount: 55,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.7 },
          colors: celebrationPalette,
          scalar: 1.2,
          ticks: 200,
        });
      }, 180);

      // Stage 3: Right side cannon launch
      const timer2 = setTimeout(() => {
        confetti({
          particleCount: 55,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.7 },
          colors: celebrationPalette,
          scalar: 1.2,
          ticks: 200,
        });
      }, 360);

      // Stage 4: Gentle starlight shower from above
      const timer3 = setTimeout(() => {
        confetti({
          particleCount: 45,
          spread: 120,
          origin: { y: 0.25 },
          colors: ['#FFD700', '#FFF8DC', '#E0E7FF', heroColor, '#F472B6'],
          gravity: 0.75,
          ticks: 320,
          scalar: 0.95,
        });
      }, 650);

      celebrationTimersRef.current = [timer1, timer2, timer3];
    } catch {
      // Ignored if canvas context is restricted
    }
  }, [hero?.color]);

  const handleComplete = useCallback(() => {
    setIsCompleted(true);
    const newlyUnlocked = onCompleteStory(story.id);
    if (newlyUnlocked && Array.isArray(newlyUnlocked) && newlyUnlocked.length > 0) {
      setUnlockedBadgesToCelebrate(newlyUnlocked);
      setShowBadgeCelebrationModal(true);
    } else {
      triggerCelebration();
    }
  }, [onCompleteStory, story.id, triggerCelebration]);

  const handleNextScene = useCallback(() => {
    VoiceNarrator.stop();
    setIsPlayingNarration(false);
    setSpokenCharIndex(null);
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentSceneIndex, scenes.length, handleComplete]);

  const [rewindToast, setRewindToast] = useState<string | null>(null);
  const rewindToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showRewindFeedback = useCallback((msg: string) => {
    if (rewindToastTimeoutRef.current) {
      clearTimeout(rewindToastTimeoutRef.current);
    }
    setRewindToast(msg);
    rewindToastTimeoutRef.current = setTimeout(() => {
      setRewindToast(null);
    }, 1600);
  }, []);

  const handleJumpToScene = useCallback((targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < scenes.length && targetIndex !== currentSceneIndex) {
      VoiceNarrator.stop();
      setIsPlayingNarration(false);
      setSpokenCharIndex(null);
      setCurrentSceneIndex(targetIndex);
      showRewindFeedback(`Navigated to Scene ${targetIndex + 1}`);
    }
  }, [scenes.length, currentSceneIndex, showRewindFeedback]);

  const fullTextToRead = useMemo(() => {
    if (!currentScene) return '';
    return currentScene.sleepAffirmation
      ? `${currentScene.text}. ... ${currentScene.sleepAffirmation}`
      : currentScene.text;
  }, [currentScene]);

  // Read the current scene aloud starting from a specific character offset
  const startNarration = useCallback((fromCharOffset: number = 0) => {
    if (!currentScene) return;
    const offset = Math.max(0, Math.min(fromCharOffset, fullTextToRead.length));
    const subtext = fullTextToRead.slice(offset);

    setIsPlayingNarration(true);
    setSpokenCharIndex(offset);

    VoiceNarrator.speak(subtext, {
      voiceId: selectedNarratorId,
      speedRate: readingSpeed,
      volume: narrationVolume,
      onStart: () => {
        setSpokenCharIndex(offset);
      },
      onBoundary: (charIndex) => {
        setSpokenCharIndex(offset + charIndex);
      },
      onEnd: () => {
        setIsPlayingNarration(false);
        setSpokenCharIndex(null);
        if (settings.autoAdvance && currentSceneIndex < scenes.length - 1) {
          setTimeout(() => {
            handleNextScene();
          }, 1800);
        }
      },
      onError: () => {
        setIsPlayingNarration(false);
        setSpokenCharIndex(null);
      },
    });
  }, [currentScene, fullTextToRead, selectedNarratorId, readingSpeed, narrationVolume, settings.autoAdvance, currentSceneIndex, scenes.length, handleNextScene]);

  // Toggle narration playback (play/pause)
  const handleTogglePlayPause = useCallback(() => {
    if (!currentScene) return;
    if (isPlayingNarration) {
      VoiceNarrator.pause();
      setIsPlayingNarration(false);
    } else {
      // If we had a spoken position, resume from that sentence start, else from beginning
      let resumeChar = spokenCharIndex || 0;
      if (spokenCharIndex !== null && spokenCharIndex > 0) {
        for (let i = parsedSentences.length - 1; i >= 0; i--) {
          if (parsedSentences[i].startIndex <= spokenCharIndex) {
            resumeChar = parsedSentences[i].startIndex;
            break;
          }
        }
      }
      startNarration(resumeChar);
    }
  }, [currentScene, isPlayingNarration, spokenCharIndex, parsedSentences, startNarration]);

  // Rewind narration by approximately 10 seconds
  const handleRewind10Seconds = useCallback(() => {
    const currentChar = spokenCharIndex ?? 0;
    // Estimate ~13 characters per second at ~0.85 rate
    const charsToRewind = Math.round(readingSpeed * 10 * 14);
    const targetChar = Math.max(0, currentChar - charsToRewind);

    // Find the sentence that begins at or before targetChar
    let targetSentenceStart = 0;
    for (let i = parsedSentences.length - 1; i >= 0; i--) {
      if (parsedSentences[i].startIndex <= targetChar) {
        targetSentenceStart = parsedSentences[i].startIndex;
        break;
      }
    }

    const isNearStart = currentChar <= 25 && targetSentenceStart === 0;
    showRewindFeedback(isNearStart ? 'Scene Start ⏪' : '-10s Rewind ⏪');

    if (isPlayingNarration) {
      VoiceNarrator.stop();
      startNarration(targetSentenceStart);
    } else {
      setSpokenCharIndex(targetSentenceStart);
    }
  }, [spokenCharIndex, readingSpeed, parsedSentences, isPlayingNarration, showRewindFeedback, startNarration]);

  // Adjust reading speed and update active narration seamlessly if playing
  const handleSelectReadingSpeed = useCallback((newRate: number) => {
    setReadingSpeed(newRate);
    if (isPlayingNarration && currentScene) {
      VoiceNarrator.stop();
      let resumeChar = spokenCharIndex || 0;
      if (spokenCharIndex !== null && spokenCharIndex > 0) {
        for (let i = parsedSentences.length - 1; i >= 0; i--) {
          if (parsedSentences[i].startIndex <= spokenCharIndex) {
            resumeChar = parsedSentences[i].startIndex;
            break;
          }
        }
      }
      const offset = Math.max(0, Math.min(resumeChar, fullTextToRead.length));
      const subtext = fullTextToRead.slice(offset);

      setIsPlayingNarration(true);
      setSpokenCharIndex(offset);

      VoiceNarrator.speak(subtext, {
        voiceId: selectedNarratorId,
        speedRate: newRate,
        volume: narrationVolume,
        onStart: () => {
          setSpokenCharIndex(offset);
        },
        onBoundary: (charIndex) => {
          setSpokenCharIndex(offset + charIndex);
        },
        onEnd: () => {
          setIsPlayingNarration(false);
          setSpokenCharIndex(null);
          if (settings.autoAdvance && currentSceneIndex < scenes.length - 1) {
            setTimeout(() => {
              handleNextScene();
            }, 1800);
          }
        },
        onError: () => {
          setIsPlayingNarration(false);
          setSpokenCharIndex(null);
        },
      });
    }
  }, [isPlayingNarration, currentScene, spokenCharIndex, parsedSentences, fullTextToRead, selectedNarratorId, narrationVolume, settings.autoAdvance, currentSceneIndex, scenes.length, handleNextScene]);

  // Select AI Character Narrator and smoothly re-narrate if active
  const handleSelectNarrator = useCallback((narratorId: string) => {
    setSelectedNarratorId(narratorId);
    setShowNarratorDropdown(false);
    const chosen = PRELOADED_NARRATORS.find((n) => n.id === narratorId) || PRELOADED_NARRATORS[0];
    showRewindFeedback(`${chosen.avatarEmoji} ${chosen.name.split(' ')[0]} Voice Active`);

    if (isPlayingNarration && currentScene) {
      VoiceNarrator.stop();
      let resumeChar = spokenCharIndex || 0;
      if (spokenCharIndex !== null && spokenCharIndex > 0) {
        for (let i = parsedSentences.length - 1; i >= 0; i--) {
          if (parsedSentences[i].startIndex <= spokenCharIndex) {
            resumeChar = parsedSentences[i].startIndex;
            break;
          }
        }
      }
      const offset = Math.max(0, Math.min(resumeChar, fullTextToRead.length));
      const subtext = fullTextToRead.slice(offset);

      setIsPlayingNarration(true);
      setSpokenCharIndex(offset);

      VoiceNarrator.speak(subtext, {
        voiceId: narratorId,
        speedRate: readingSpeed,
        volume: narrationVolume,
        onStart: () => {
          setSpokenCharIndex(offset);
        },
        onBoundary: (charIndex) => {
          setSpokenCharIndex(offset + charIndex);
        },
        onEnd: () => {
          setIsPlayingNarration(false);
          setSpokenCharIndex(null);
          if (settings.autoAdvance && currentSceneIndex < scenes.length - 1) {
            setTimeout(() => {
              handleNextScene();
            }, 1800);
          }
        },
        onError: () => {
          setIsPlayingNarration(false);
          setSpokenCharIndex(null);
        },
      });
    }
  }, [isPlayingNarration, currentScene, spokenCharIndex, parsedSentences, fullTextToRead, readingSpeed, narrationVolume, settings.autoAdvance, currentSceneIndex, scenes.length, handleNextScene, showRewindFeedback]);

  // Preview voice sample phrase for testing character voices
  const handlePreviewVoice = useCallback((narrator: CharacterNarrator, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingNarratorId === narrator.id) {
      VoiceNarrator.stop();
      setPreviewingNarratorId(null);
    } else {
      if (isPlayingNarration) {
        setIsPlayingNarration(false);
      }
      setPreviewingNarratorId(narrator.id);
      VoiceNarrator.previewSample(narrator.id, {
        onStart: () => setPreviewingNarratorId(narrator.id),
        onEnd: () => setPreviewingNarratorId(null),
      });
    }
  }, [previewingNarratorId, isPlayingNarration]);

  // Auto-speak on scene change if auto narration was already active
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Scene changed - stop previous speech and reset sentence highlight
    VoiceNarrator.stop();
    setIsPlayingNarration(false);
    setSpokenCharIndex(null);
  }, [currentSceneIndex]);

  const handlePrevScene = () => {
    VoiceNarrator.stop();
    setIsPlayingNarration(false);
    setSpokenCharIndex(null);
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((prev) => prev - 1);
    }
  };

  const handleSelectChoice = (choice: { nextSceneId: string }) => {
    VoiceNarrator.stop();
    setIsPlayingNarration(false);
    setSpokenCharIndex(null);
    const targetIndex = scenes.findIndex((s) => s.id === choice.nextSceneId);
    if (targetIndex !== -1) {
      setCurrentSceneIndex(targetIndex);
    } else if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  // Sleep Timer Action Handlers
  const handleSetSleepTimer = useCallback(
    (minutes: number) => {
      const totalSecs = Math.max(10, Math.round(minutes * 60));
      setSleepTimerTotalSeconds(totalSecs);
      setSleepTimerRemaining(totalSecs);
      setIsSleepTimerPaused(false);
      showRewindFeedback(`🌙 Sleep timer set for ${minutes} min`);
    },
    [showRewindFeedback]
  );

  const handleTogglePauseSleepTimer = useCallback(() => {
    setIsSleepTimerPaused((prev) => {
      const next = !prev;
      showRewindFeedback(next ? '⏸️ Sleep timer paused' : '▶️ Sleep timer resumed');
      return next;
    });
  }, [showRewindFeedback]);

  const handleAddSleepTimerMinutes = useCallback(
    (extraMinutes: number) => {
      setSleepTimerRemaining((prev) => {
        const current = prev !== null ? prev : 0;
        const updated = current + extraMinutes * 60;
        setSleepTimerTotalSeconds((tot) => (tot !== null ? tot + extraMinutes * 60 : updated));
        showRewindFeedback(`➕ Added ${extraMinutes}m to sleep timer`);
        return updated;
      });
    },
    [showRewindFeedback]
  );

  const handleCancelSleepTimer = useCallback(() => {
    setSleepTimerRemaining(null);
    setSleepTimerTotalSeconds(null);
    setIsSleepTimerPaused(false);
    ambientSoundEngine.setVolume(ambientVolume);
    showRewindFeedback('Sleep timer turned off');
  }, [ambientVolume, showRewindFeedback]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05051a] text-slate-100 overflow-y-auto">
      {/* Subtle Top-of-Screen Scene Progress Bar with Breathing Rhythm Animation */}
      <div
        id="story-scene-progress-top"
        role="progressbar"
        aria-label="Story scene reading progress"
        aria-valuenow={currentSceneIndex + 1}
        aria-valuemin={1}
        aria-valuemax={scenes.length}
        aria-valuetext={`Scene ${currentSceneIndex + 1} of ${scenes.length}`}
        className="w-full sticky top-0 z-40 bg-slate-950/95 border-b border-indigo-950/80 backdrop-blur-md px-3 sm:px-8 py-1.5 shadow-sm relative overflow-hidden group"
      >
        {/* Subtle Calming Breathing Glow Aura synced with Reading Speed */}
        <motion.div
          key={`breathing-aura-${breathingDuration}`}
          animate={{
            opacity: [0.15, 0.55, 0.15],
            scaleY: [0.9, 1.15, 0.9],
          }}
          transition={{
            duration: breathingDuration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-500/15 to-amber-400/10 pointer-events-none"
        />

        {/* Dynamic Breathing Underline Glow */}
        <motion.div
          key={`breathing-line-${breathingDuration}`}
          animate={{
            opacity: [0.25, 0.85, 0.25],
            scaleX: [0.92, 1, 0.92],
          }}
          transition={{
            duration: breathingDuration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none"
        />

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 relative z-10">
          {/* Segmented Scene Progress Bar */}
          <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
            {scenes.map((sceneItem, idx) => {
              const isPast = idx < currentSceneIndex;
              const isCurrent = idx === currentSceneIndex;
              return (
                <button
                  key={sceneItem.id || idx}
                  type="button"
                  onClick={() => handleJumpToScene(idx)}
                  className="flex-1 group/btn py-0.5 focus:outline-none cursor-pointer"
                  title={`Scene ${idx + 1}: ${sceneItem.title || `Scene ${idx + 1}`}`}
                  aria-label={`Jump to Scene ${idx + 1} of ${scenes.length}${isCurrent ? ' (Current)' : ''}`}
                >
                  <div
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 relative overflow-hidden ${
                      isPast
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 opacity-90'
                        : isCurrent
                        ? 'bg-gradient-to-r from-purple-400 via-amber-400 to-yellow-300 shadow-sm shadow-amber-400/50 ring-1 ring-amber-300/70'
                        : 'bg-slate-800/80 group-hover/btn:bg-slate-700/80'
                    }`}
                  >
                    {isCurrent && (
                      <motion.div
                        key={`breathing-track-${breathingDuration}`}
                        animate={{
                          opacity: [0.3, 0.85, 0.3],
                          scale: [0.98, 1.02, 0.98],
                        }}
                        transition={{
                          duration: breathingDuration,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 bg-white/40"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right side: Breathing Pace Indicator & Scene Counter */}
          <div className="flex items-center gap-2 shrink-0 select-none">
            {/* Visual Bedtime Breathing Guide Badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/50 text-[10px] text-indigo-200/90 shadow-sm"
              title={`Breathing rhythm visual aid (${breathingDuration}s cycle) — synchronized to ${activeSpeedOption.label} (${activeSpeedOption.sublabel}) reading speed`}
            >
              <motion.span
                key={`breathing-dot-${breathingDuration}`}
                animate={{
                  scale: [0.8, 1.45, 0.8],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: breathingDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/90"
              />
              <span className="font-semibold text-slate-300">Breathe</span>
              <span className="text-[9px] text-indigo-300/80 font-mono">({activeSpeedOption.label})</span>
            </div>

            {/* Scene Progress Counter Label */}
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 pl-0.5">
              <span className="text-amber-300 font-bold">Scene {currentSceneIndex + 1}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">{scenes.length}</span>
              <span className="hidden md:inline text-indigo-300/75 text-[10px] pl-1 font-mono">
                ({progressPercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Hero Ambient Glow Backdrop */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 opacity-25 blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${hero.color} 0%, rgba(99, 102, 241, 0.1) 60%, transparent 100%)`,
        }}
      />

      {/* Top Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            id="reader-back-btn"
            type="button"
            onClick={() => {
              VoiceNarrator.stop();
              ambientSoundEngine.stopAmbient();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Back to Stories"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: hero.color }}
              />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                {story.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Guided by <span className="text-indigo-300 font-medium">{hero.name}</span> • {hero.power}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Visual Sleep Duration / Sleep Forecast Button */}
          <button
            id="sleep-forecast-btn"
            type="button"
            onClick={() => setShowSleepForecastModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              story.mode === 'sleep'
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 shadow-md shadow-purple-900/30 hover:border-purple-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="View Sleep Duration & Wake-Up Projection"
          >
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Sleep Duration</span>
            <span className="sm:hidden">Sleep</span>
          </button>

          {/* Sleep Timer Toggle */}
          <div className="relative">
            <button
              id="sleep-timer-btn"
              type="button"
              onClick={() => setShowSleepTimerModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                sleepTimerRemaining !== null
                  ? isSleepTimerPaused
                    ? 'bg-amber-950/80 border-amber-500/70 text-amber-200 shadow-md'
                    : 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-md shadow-purple-900/40 ring-1 ring-purple-400/40'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title={
                sleepTimerRemaining !== null
                  ? `Sleep Timer: ${formatTimer(sleepTimerRemaining)} remaining ${isSleepTimerPaused ? '(Paused)' : ''} — Click to manage`
                  : 'Set Bedtime Sleep Timer'
              }
            >
              <Clock className={`w-3.5 h-3.5 ${sleepTimerRemaining !== null && !isSleepTimerPaused ? 'text-purple-300 animate-pulse' : 'text-purple-400'}`} />
              <span>{sleepTimerRemaining !== null ? formatTimer(sleepTimerRemaining) : 'Timer'}</span>
            </button>
          </div>

          {/* Ambient Soundscape Toggle */}
          <button
            id="sound-controls-toggle"
            type="button"
            onClick={() => setShowSoundControls(!showSoundControls)}
            className={`p-2 rounded-xl border text-xs transition-all ${
              ambientSound !== 'none'
                ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200 shadow-md shadow-indigo-500/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="Ambient Sleep Sounds"
          >
            <Music2 className="w-4 h-4" />
          </button>

          {/* Bookmark / Save */}
          <button
            id="reader-save-btn"
            type="button"
            onClick={() => onToggleSaveStory(story)}
            className={`p-2 rounded-xl border transition-all ${
              isSaved
                ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title={isSaved ? 'Saved in Bedtime Favorites' : 'Save to Favorites'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Ambient Sound Settings Popover */}
      {showSoundControls && (
        <div className="relative z-20 mx-4 sm:mx-auto max-w-lg mt-3 p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ambient Sleep Soundscapes
            </span>
            <button
              type="button"
              onClick={() => setShowSoundControls(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close sound settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sound selection grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {SOUND_OPTIONS.map((snd) => {
              const Icon = snd.icon;
              const isSelected = ambientSound === snd.id;
              return (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => {
                    setAmbientSound(snd.id);
                    if (snd.id !== 'none' && ambientVolume === 0) {
                      setAmbientVolume(0.3);
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate w-full text-center">{snd.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dedicated Ambient Sleep Sound Volume Slider in Popover */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMuteAmbient}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                  title={ambientVolume === 0 ? 'Unmute ambient sound' : 'Mute ambient sound'}
                  aria-label={ambientVolume === 0 ? 'Unmute ambient sound' : 'Mute ambient sound'}
                >
                  {ambientVolume === 0 || ambientSound === 'none' ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : ambientVolume < 0.4 ? (
                    <Volume1 className="w-4 h-4 text-indigo-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                  )}
                </button>
                <label
                  htmlFor="popover-ambient-volume-slider"
                  className="text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Ambient Sound Volume
                </label>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/40">
                {ambientSound === 'none' ? 'Muted' : `${Math.round(ambientVolume * 100)}%`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="popover-ambient-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ambientSound === 'none' ? 0 : ambientVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setAmbientVolume(val);
                  if (ambientSound === 'none' && val > 0) {
                    setAmbientSound('ocean');
                  }
                }}
                aria-label="Ambient sleep sound volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ambientVolume * 100)}
                aria-valuetext={`${Math.round(ambientVolume * 100)} percent`}
                className="w-full h-2 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              />
            </div>

            {/* Quick Volume Balance Presets */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Bedtime Balance:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Soft', value: 0.15 },
                  { label: 'Balanced', value: 0.35 },
                  { label: 'Immersive', value: 0.65 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setAmbientVolume(preset.value);
                      if (ambientSound === 'none') setAmbientSound('ocean');
                    }}
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-medium transition-all ${
                      Math.abs(ambientVolume - preset.value) < 0.05 && ambientSound !== 'none'
                        ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {preset.label} ({Math.round(preset.value * 100)}%)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Story Stage */}
      <main className="relative z-10 flex-1 flex flex-col justify-between max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 sm:pb-36">
        {/* Visual Progress Indicator Track & Scene Stepper */}
        <div className="mb-4 p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-md">
          {/* Header row: Scene info, companion badge, progress %, time remaining, breathing guide */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Scene {currentSceneIndex + 1} of {scenes.length}</span>
              </div>

              {story.companionName && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/60 text-purple-200 border border-purple-800/40">
                  <Heart className="w-3 h-3 text-pink-400 fill-pink-400/40" />
                  <span>With {story.companionName}</span>
                </div>
              )}

              {currentSceneIndex === scenes.length - 1 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/40 animate-pulse">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Bedtime Finale</span>
                </span>
              )}
            </div>

            {/* Right side: Gentle breathing guide or percentage & remaining time */}
            <div className="flex items-center gap-2 text-xs">
              {story.mode === 'sleep' && (
                <div className="hidden sm:flex items-center gap-1.5 text-purple-300 bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                  <div
                    className={`w-2 h-2 rounded-full bg-purple-400 transition-all duration-1000 ${
                      isBreathingIn ? 'scale-125 opacity-100' : 'scale-75 opacity-40'
                    }`}
                  />
                  <span className="text-[11px]">{isBreathingIn ? 'Breathe in...' : 'Breathe out...'}</span>
                </div>
              )}

              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>
                  {currentSceneIndex === scenes.length - 1
                    ? 'Final scene'
                    : `~${Math.max(1, Math.round((scenes.length - currentSceneIndex) * 1.5))} min left`}
                </span>
              </span>

              <span className="font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30 text-[11px]">
                {Math.round(((currentSceneIndex + 1) / scenes.length) * 100)}% Read
              </span>
            </div>
          </div>

          {/* Visual Continuous Starlight Progress Bar */}
          <div className="relative w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80 mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 shadow-sm"
              initial={false}
              animate={{ width: `${((currentSceneIndex + 1) / scenes.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          {/* Stepped Interactive Scene Checkpoints */}
          <div className="flex items-center justify-between relative px-1">
            {scenes.map((scene, idx) => {
              const isPast = idx < currentSceneIndex;
              const isCurrent = idx === currentSceneIndex;

              return (
                <button
                  key={scene.id || idx}
                  type="button"
                  onClick={() => handleJumpToScene(idx)}
                  className="group relative flex flex-col items-center focus:outline-none transition-all cursor-pointer"
                  title={`Scene ${idx + 1}${isPast ? ' (Completed - tap to review)' : isCurrent ? ' (Reading now)' : ' (Upcoming - tap to jump)'}`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isPast
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 border border-amber-300 scale-95 hover:scale-105'
                        : isCurrent
                        ? 'bg-indigo-600 text-white border-2 border-amber-400 shadow-lg shadow-indigo-600/50 ring-4 ring-indigo-500/30 scale-110'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200 hover:scale-105'
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isCurrent ? (
                      <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-spin-slow" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <span
                    className={`mt-1 text-[10px] sm:text-[11px] font-semibold transition-colors ${
                      isCurrent
                        ? 'text-amber-300 font-bold'
                        : isPast
                        ? 'text-indigo-300'
                        : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  >
                    {idx === scenes.length - 1 ? 'End' : `Part ${idx + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sleep Journey Mode: Inline Sleep Duration & Wake-Up Projection Bar */}
        {story.mode === 'sleep' && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowSleepForecastModal(true)}
              className="w-full text-left transition-all hover:scale-[1.01]"
            >
              <SleepDurationEstimator
                storyDurationMinutes={story.audioDurationMinutes || 6}
                ambientSound={ambientSound}
                ambientLoopMinutes={ambientLoopMinutes}
                childAge={settings.childAge || 5}
                childName={settings.childName || 'Explorer'}
                variant="compact"
                interactive={false}
              />
            </button>
          </div>
        )}

        {/* Scene Text & Affirmation Card */}
        <div className="my-auto py-4">
          <div className="relative p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-2xl backdrop-blur-xl">
            {/* Glowing Accent Corner */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-tr-3xl opacity-15 blur-2xl pointer-events-none"
              style={{ backgroundColor: hero.color }}
            />

            {/* Story Paragraph with Follow-Along Highlighting */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isPlayingNarration && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Follow along with the golden starlight words</span>
                </div>
              )}

              {currentSceneVocabWord && (
                <button
                  type="button"
                  onClick={() => setActiveVocabWord(currentSceneVocabWord)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Discover this word spark!"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Word Spark: <span className="font-bangers tracking-wider text-amber-300 text-sm">{currentSceneVocabWord.word}</span></span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/30 text-amber-100">Tap to Learn</span>
                </button>
              )}
            </div>

            <div className="text-lg sm:text-2xl text-slate-100 font-nunito leading-relaxed tracking-normal font-medium selection:bg-indigo-500">
              {parsedSentences
                .filter((s) => !s.isAffirmation)
                .map((sentence) => {
                  const isCurrentSpoken = isPlayingNarration && activeSentenceId === sentence.id;
                  return (
                    <span
                      key={sentence.id}
                      className={`inline transition-all duration-300 rounded-lg ${
                        isCurrentSpoken
                          ? 'bg-amber-400/25 text-amber-200 font-bold px-1.5 py-0.5 shadow-sm shadow-amber-400/20 border border-amber-300/40 ring-1 ring-amber-400/30'
                          : isPlayingNarration
                          ? 'text-slate-300 opacity-90'
                          : 'text-slate-100'
                      }`}
                    >
                      {sentence.text}{' '}
                    </span>
                  );
                })}
            </div>

            {/* Sleep Affirmation */}
            {currentScene?.sleepAffirmation && (
              <div
                className={`mt-8 pt-6 border-t border-slate-800/80 flex items-start gap-3 transition-all duration-300 rounded-2xl ${
                  isPlayingNarration && activeSentenceId === 'aff-0'
                    ? 'bg-amber-400/15 p-3.5 border border-amber-400/40 text-amber-200 shadow-md shadow-amber-400/10'
                    : 'text-indigo-300/90'
                }`}
              >
                <Moon
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isPlayingNarration && activeSentenceId === 'aff-0'
                      ? 'text-amber-300 animate-bounce'
                      : 'text-amber-400 animate-pulse'
                  }`}
                />
                <p className="text-sm sm:text-base italic font-medium font-jakarta leading-relaxed">
                  &ldquo;{currentScene.sleepAffirmation}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Interactive Choices (If Available in Scene) */}
          {currentScene?.choices && currentScene.choices.length > 0 && !currentScene.isFinal && (
            <div className="mt-6 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                What does {hero.name} do next?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentScene.choices.map((choice) => (
                  <button
                    key={choice.id}
                    id={`choice-btn-${choice.id}`}
                    type="button"
                    onClick={() => handleSelectChoice(choice)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-left text-sm font-semibold text-slate-200 hover:text-white shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.01]"
                  >
                    <span>{choice.text}</span>
                    <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Audio & Narration Bar */}
        <div className="relative z-10 mt-6 rounded-2xl bg-slate-950/85 border border-slate-800/90 backdrop-blur-md overflow-hidden shadow-2xl">
          {/* Top Row: Narration & Navigation */}
          <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70">
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Play/Pause Voice Narration Button */}
              <button
                id="narration-play-btn"
                type="button"
                onClick={handleTogglePlayPause}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
                  isPlayingNarration
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
                title={isPlayingNarration ? 'Pause Story Narration' : 'Read Scene Aloud'}
              >
                {isPlayingNarration ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Story</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>

              {/* Rewind 10s Button */}
              <button
                id="narration-rewind-btn"
                type="button"
                onClick={handleRewind10Seconds}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 text-xs font-semibold transition-all active:scale-95 group"
                title="Rewind narration by 10 seconds"
                aria-label="Rewind narration by 10 seconds"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400 group-hover:text-amber-300 transition-transform group-hover:-rotate-45" />
                <span>10s</span>
              </button>

              {/* Speed Rate Toggle */}
              <button
                id="card-reading-speed-btn"
                type="button"
                onClick={() => {
                  const nextRate =
                    readingSpeed === 0.75 ? 0.88 : readingSpeed === 0.88 ? 1.0 : 0.75;
                  handleSelectReadingSpeed(nextRate);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors hidden sm:inline-flex active:scale-95 group"
                title={`Narration Speed: ${activeSpeedOption.label} (${activeSpeedOption.sublabel}) — Tap to cycle (Slow, Gentle, Natural)`}
              >
                <Gauge className="w-3.5 h-3.5 text-indigo-400 group-hover:text-amber-300 transition-colors" />
                <span>Speed: {activeSpeedOption.label}</span>
                <span className="text-[10px] text-indigo-300 font-mono">({activeSpeedOption.sublabel})</span>
              </button>

              {/* Narration Active Pill */}
              {isPlayingNarration && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-semibold animate-pulse">
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span>Voice Active</span>
                </div>
              )}
            </div>

            {/* Navigation Next/Prev Scene Controls */}
            <div className="flex items-center gap-2">
              <button
                id="reader-prev-btn"
                type="button"
                onClick={handlePrevScene}
                disabled={currentSceneIndex === 0}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Scene"
                aria-label="Previous Scene"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {currentSceneIndex < scenes.length - 1 ? (
                <button
                  id="reader-next-btn"
                  type="button"
                  onClick={handleNextScene}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95 group"
                  title="Skip to Next Scene"
                  aria-label="Skip to Next Scene"
                >
                  <span>Next Scene</span>
                  <SkipForward className="w-4 h-4 text-indigo-300 group-hover:text-amber-300 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <button
                  id="reader-finish-btn"
                  type="button"
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Story</span>
                </button>
              )}
            </div>
          </div>

          {/* Dedicated Ambient Sleep Sounds Volume Slider & Balancing Panel */}
          <div className="px-3.5 sm:px-4 py-3 bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left: Soundscape Selector Pill & Mute Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="ambient-sound-toggle-menu"
                onClick={() => setShowSoundControls(!showSoundControls)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm group"
                title="Change ambient sound track"
              >
                {(() => {
                  const Icon = activeSoundOption.icon;
                  return <Icon className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />;
                })()}
                <span>{activeSoundOption.name}</span>
                <Sliders className="w-3 h-3 text-slate-400 group-hover:text-slate-200 ml-0.5" />
              </button>

              <button
                type="button"
                id="ambient-mute-btn"
                onClick={handleToggleMuteAmbient}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition-colors"
                title={ambientVolume === 0 || ambientSound === 'none' ? 'Unmute Ambient Sleep Sound' : 'Mute Ambient Sleep Sound'}
                aria-label={ambientVolume === 0 || ambientSound === 'none' ? 'Unmute Ambient Sleep Sound' : 'Mute Ambient Sleep Sound'}
              >
                {ambientVolume === 0 || ambientSound === 'none' ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : ambientVolume < 0.4 ? (
                  <Volume1 className="w-3.5 h-3.5 text-indigo-300" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </button>
            </div>

            {/* Middle: Dedicated Ambient Sleep Sound Volume Slider */}
            <div className="flex-1 flex items-center gap-2.5 min-w-[200px]">
              <label
                htmlFor="ambient-sleep-sound-volume-slider"
                className="text-[11px] font-semibold text-slate-400 shrink-0 select-none cursor-pointer hidden md:inline"
              >
                Ambient Sound:
              </label>

              <div className="relative flex-1 flex items-center">
                <input
                  id="ambient-sleep-sound-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ambientSound === 'none' ? 0 : ambientVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAmbientVolume(val);
                    if (ambientSound === 'none' && val > 0) {
                      setAmbientSound('ocean');
                    }
                  }}
                  aria-label="Ambient sleep sounds volume slider for balancing with narration"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(ambientVolume * 100)}
                  aria-valuetext={`${Math.round(ambientVolume * 100)} percent`}
                  className="w-full h-2 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #38bdf8 ${Math.round(
                      (ambientSound === 'none' ? 0 : ambientVolume) * 100
                    )}%, #1e293b ${Math.round((ambientSound === 'none' ? 0 : ambientVolume) * 100)}%, #1e293b 100%)`,
                  }}
                />
              </div>

              <span className="text-xs font-mono font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 min-w-[42px] text-center">
                {ambientSound === 'none' ? '0%' : `${Math.round(ambientVolume * 100)}%`}
              </span>
            </div>

            {/* Right: Quick Bedtime Balance Presets */}
            <div className="flex items-center gap-1.5 shrink-0 justify-end">
              <span className="text-[10px] uppercase font-semibold text-slate-400 hidden lg:inline">
                Preset:
              </span>
              {[
                { label: 'Soft', value: 0.15 },
                { label: 'Balanced', value: 0.35 },
                { label: 'Deep', value: 0.65 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setAmbientVolume(preset.value);
                    if (ambientSound === 'none') setAmbientSound('ocean');
                  }}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    Math.abs(ambientVolume - preset.value) < 0.05 && ambientSound !== 'none'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title={`Set ambient volume to ${Math.round(preset.value * 100)}%`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ambient Audio Wave Visualizer reacting to current ambient soundscape */}
        <div className="w-full mt-2">
          <AmbientWaveVisualizer
            ambientSound={ambientSound}
            ambientVolume={ambientVolume}
            isPlayingNarration={isPlayingNarration}
            onOpenSoundControls={() => setShowSoundControls(true)}
            onVolumeChange={setAmbientVolume}
            variant="floor"
          />
        </div>
      </main>

      {/* Persistent Bottom Playback Control Panel */}
      <footer
        id="story-playback-control-panel"
        aria-label="Story Narration and Playback Controls"
        className="sticky bottom-0 z-40 w-full bg-slate-950/95 border-t border-indigo-900/60 backdrop-blur-xl shadow-2xl px-3 sm:px-6 py-2.5 sm:py-3 transition-all"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Current Scene Info & Live Narration/Audio Status */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                  isPlayingNarration
                    ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 border border-indigo-900/60 text-slate-300'
                }`}
              >
                {isPlayingNarration ? (
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse fill-current" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
              </div>
            </div>

            <div className="min-w-0 hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate max-w-[140px] lg:max-w-[220px]">
                  {currentScene?.title || `Scene ${currentSceneIndex + 1}`}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                  ({currentSceneIndex + 1}/{scenes.length})
                </span>
              </div>
              <p className="text-[10px] text-indigo-300/80 truncate">
                {isPlayingNarration ? 'Voice narration active • Bedtime pace' : 'Paused • Tap play to listen'}
              </p>
            </div>

            {/* Rewind Feedback Toast Pill */}
            {rewindToast && (
              <div
                id="rewind-toast-feedback"
                className="animate-fade-in flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/50 text-amber-200 text-xs font-bold shadow-lg shadow-amber-400/20 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{rewindToast}</span>
              </div>
            )}
          </div>

          {/* Center: Core Playback Controls (Previous, Rewind 10s, Play/Pause, Skip Next Scene) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 shrink-0">
            {/* Step to Previous Scene */}
            <button
              id="bottom-playback-prev-scene-btn"
              type="button"
              onClick={handlePrevScene}
              disabled={currentSceneIndex === 0}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              title="Previous Scene"
              aria-label="Previous Scene"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Rewind 10 Seconds Button */}
            <button
              id="bottom-playback-rewind-10s-btn"
              type="button"
              onClick={handleRewind10Seconds}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-indigo-900/70 bg-slate-900/90 hover:bg-slate-850 text-indigo-200 hover:text-amber-300 hover:border-amber-400/40 transition-all active:scale-95 group shadow-sm"
              title="Rewind narration by 10 seconds"
              aria-label="Rewind narration by 10 seconds"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400 group-hover:text-amber-300 transition-transform group-hover:-rotate-45" />
              <span className="text-xs font-bold font-mono">10s</span>
            </button>

            {/* Play / Pause Main Action Button */}
            <button
              id="bottom-playback-play-pause-btn"
              type="button"
              onClick={handleTogglePlayPause}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg active:scale-95 ${
                isPlayingNarration
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300/40'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 ring-1 ring-indigo-400/40'
              }`}
              title={isPlayingNarration ? 'Pause Story Narration' : 'Play / Read Scene Aloud'}
              aria-label={isPlayingNarration ? 'Pause Story Narration' : 'Play / Read Scene Aloud'}
            >
              {isPlayingNarration ? (
                <>
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            {/* Skip to Next Scene Button */}
            {currentSceneIndex < scenes.length - 1 ? (
              <button
                id="bottom-playback-skip-next-btn"
                type="button"
                onClick={handleNextScene}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95 group shadow-sm"
                title="Skip to Next Scene"
                aria-label="Skip to Next Scene"
              >
                <span className="hidden sm:inline">Next Scene</span>
                <SkipForward className="w-4 h-4 text-indigo-300 group-hover:text-amber-300 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button
                id="bottom-playback-complete-btn"
                type="button"
                onClick={handleComplete}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                title="Complete Story"
                aria-label="Complete Story"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Complete</span>
              </button>
            )}
          </div>

          {/* Right: AI Narrator Select + Ambient Audio Volume Slider + Reading Speed + Sound Settings */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* AI Narrator Select Dropdown Trigger & Popover Menu */}
            <div className="relative" ref={narratorDropdownRef}>
              <button
                id="bottom-ai-narrator-select-btn"
                type="button"
                onClick={() => setShowNarratorDropdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none active:scale-95 group ${
                  showNarratorDropdown
                    ? 'bg-indigo-950/90 border-indigo-400 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/40'
                    : 'bg-slate-900/90 border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
                aria-haspopup="listbox"
                aria-expanded={showNarratorDropdown}
                aria-label={`AI Narrator: ${activeNarrator.name} (${activeNarrator.characterTitle})`}
                title={`AI Narrator Voice: ${activeNarrator.name} — Click to switch voice`}
              >
                <span className="text-sm leading-none" role="img" aria-hidden="true">
                  {activeNarrator.avatarEmoji}
                </span>
                <div className="flex flex-col text-left leading-tight hidden xs:flex">
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate max-w-[70px] sm:max-w-[90px]">
                    {activeNarrator.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-indigo-300/80 font-normal truncate max-w-[70px] sm:max-w-[90px]">
                    {activeNarrator.badge}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                    showNarratorDropdown ? 'rotate-180 text-indigo-300' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Popover */}
              {showNarratorDropdown && (
                <div
                  id="narrator-select-dropdown-menu"
                  role="listbox"
                  aria-label="Select AI Character Narrator"
                  className="absolute bottom-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mb-2.5 w-[310px] sm:w-[360px] max-h-[420px] overflow-y-auto rounded-2xl bg-slate-950/95 border border-indigo-500/30 p-3 shadow-2xl backdrop-blur-xl z-50 animate-fade-in"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      <span>AI Narrator Voice</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-medium">
                      {PRELOADED_NARRATORS.length} Voices
                    </span>
                  </div>

                  {/* Voices list */}
                  <div className="space-y-1.5">
                    {PRELOADED_NARRATORS.map((narrator) => {
                      const isSelected = selectedNarratorId === narrator.id;
                      const isPreviewing = previewingNarratorId === narrator.id;

                      return (
                        <div
                          key={narrator.id}
                          id={`narrator-option-${narrator.id}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectNarrator(narrator.id)}
                          className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-950/70 border-indigo-400/80 shadow-md shadow-indigo-900/30 ring-1 ring-indigo-400/30'
                              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                          }`}
                        >
                          {/* Avatar Badge */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm transition-transform group-hover:scale-105 bg-gradient-to-br ${narrator.gradient}`}
                          >
                            <span>{narrator.avatarEmoji}</span>
                          </div>

                          {/* Information */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <h4 className="text-xs font-bold text-slate-100 truncate">
                                  {narrator.name}
                                </h4>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-800/90 text-indigo-300 font-medium shrink-0">
                                  {narrator.badge}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="flex items-center text-indigo-400 shrink-0">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1 leading-snug">
                              {narrator.tagline}
                            </p>
                            <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5 italic">
                              &ldquo;{narrator.samplePhrase}&rdquo;
                            </p>
                          </div>

                          {/* Voice Preview Button */}
                          <button
                            id={`preview-voice-btn-${narrator.id}`}
                            type="button"
                            onClick={(e) => handlePreviewVoice(narrator, e)}
                            className={`p-1.5 rounded-lg border transition-all shrink-0 self-center active:scale-95 ${
                              isPreviewing
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300 animate-pulse'
                                : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                            title={`Listen to sample phrase for ${narrator.name}`}
                            aria-label={`Listen to sample phrase for ${narrator.name}`}
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${isPreviewing ? 'text-amber-300' : ''}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Ambient Audio Independent Volume Slider Control */}
            <div
              id="bottom-ambient-audio-control"
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-indigo-800/60 transition-all group"
              title={`Ambient Audio Soundscape Volume: ${ambientSound === 'none' || ambientVolume === 0 ? 'Muted' : `${Math.round(ambientVolume * 100)}%`} (${activeSoundOption.name})`}
            >
              {/* Quick Mute / Unmute Button */}
              <button
                id="bottom-ambient-mute-btn"
                type="button"
                onClick={handleToggleMuteAmbient}
                className="text-slate-400 group-hover:text-indigo-300 hover:text-white transition-colors focus:outline-none"
                aria-label={ambientVolume === 0 || ambientSound === 'none' ? 'Unmute Ambient Soundscape' : 'Mute Ambient Soundscape'}
                title={ambientVolume === 0 || ambientSound === 'none' ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
              >
                {ambientVolume === 0 || ambientSound === 'none' ? (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400 transition-colors" />
                ) : ambientVolume < 0.5 ? (
                  <Volume1 className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
                )}
              </button>

              {/* Slider Label & Sound Type (desktop/tablet) */}
              <div className="hidden xl:flex flex-col text-left mr-0.5 select-none">
                <span className="text-[10px] font-bold text-slate-300 leading-tight">Ambient</span>
                <span className="text-[9px] text-indigo-300/80 leading-tight truncate max-w-[65px]">
                  {ambientSound === 'none' ? 'Off' : activeSoundOption.name}
                </span>
              </div>

              {/* Independent Ambient Volume Range Slider */}
              <div className="flex items-center gap-1.5">
                <input
                  id="ambient-audio-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientSound === 'none' ? 0 : ambientVolume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setAmbientVolume(newVol);
                    if (newVol > 0 && ambientSound === 'none') {
                      setAmbientSound('ocean');
                    }
                  }}
                  aria-label="Ambient Audio Volume"
                  className="w-14 sm:w-20 md:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400 hover:accent-indigo-300 transition-all focus:outline-none"
                />

                {/* Percentage Readout */}
                <span className="text-[10px] font-mono text-slate-400 min-w-[24px] text-right font-medium select-none">
                  {ambientSound === 'none' || ambientVolume === 0 ? '0%' : `${Math.round(ambientVolume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Reading Speed 3-Way Toggle Group (Slow, Gentle, Natural) */}
            <div
              id="bottom-reading-speed-group"
              className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-sm"
              role="group"
              aria-label="Story Narration Reading Speed"
              title={`Reading Speed: ${activeSpeedOption.label} (${activeSpeedOption.sublabel}) — ${activeSpeedOption.description}`}
            >
              <div className="hidden xl:flex items-center gap-1 pl-2 pr-1 select-none text-slate-400">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-300">Speed</span>
              </div>
              <div className="flex items-center gap-0.5">
                {READING_SPEED_OPTIONS.map((speed) => {
                  const isSelected = Math.abs(readingSpeed - speed.rate) < 0.05;
                  return (
                    <button
                      key={speed.id}
                      id={`reading-speed-toggle-${speed.id}`}
                      type="button"
                      onClick={() => handleSelectReadingSpeed(speed.rate)}
                      className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all select-none active:scale-95 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40 font-bold ring-1 ring-indigo-400/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                      aria-pressed={isSelected}
                      title={`Set reading speed to ${speed.label} (${speed.sublabel}) — ${speed.description}`}
                    >
                      <span>{speed.label}</span>
                      <span
                        className={`ml-1 text-[9px] font-mono hidden md:inline ${
                          isSelected ? 'text-indigo-200' : 'text-slate-500'
                        }`}
                      >
                        {speed.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bedtime Sleep Timer Trigger Button */}
            <button
              id="bottom-playback-sleep-timer-btn"
              type="button"
              onClick={() => setShowSleepTimerModal(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none active:scale-95 group ${
                sleepTimerRemaining !== null
                  ? isSleepTimerPaused
                    ? 'bg-amber-950/80 border-amber-500/70 text-amber-200 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/40'
                    : 'bg-purple-950/90 border-purple-400 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400/50'
                  : 'bg-slate-900/90 border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
              title={
                sleepTimerRemaining !== null
                  ? `Sleep Timer: ${formatTimer(sleepTimerRemaining)} remaining ${isSleepTimerPaused ? '(Paused)' : ''} — Click to adjust`
                  : 'Set Bedtime Sleep Timer (gradual audio fade-out)'
              }
              aria-label="Bedtime Sleep Timer Settings"
            >
              <Moon
                className={`w-3.5 h-3.5 ${
                  sleepTimerRemaining !== null
                    ? isSleepTimerPaused
                      ? 'text-amber-400'
                      : 'text-purple-300 animate-pulse'
                    : 'text-purple-400 group-hover:text-purple-300'
                }`}
              />
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold">
                  {sleepTimerRemaining !== null ? formatTimer(sleepTimerRemaining) : 'Timer'}
                </span>
                {sleepTimerRemaining !== null && isSleepTimerPaused && (
                  <span className="text-[9px] text-amber-300 font-normal hidden xs:inline">(paused)</span>
                )}
              </div>
            </button>

            {/* Quick Ambient Sound Selector Toggle */}
            <button
              id="bottom-playback-sound-btn"
              type="button"
              onClick={() => setShowSoundControls(!showSoundControls)}
              className={`p-2 rounded-xl border text-xs transition-all ${
                ambientSound !== 'none'
                  ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200 shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={`Ambient Soundscape Settings (${activeSoundOption.name})`}
              aria-label="Ambient Sleep Sounds Settings"
            >
              <Music2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Bedtime Sleep Timer Countdown & Fade-out Modal */}
      <SleepTimerModal
        isOpen={showSleepTimerModal}
        onClose={() => setShowSleepTimerModal(false)}
        remainingSeconds={sleepTimerRemaining}
        totalSeconds={sleepTimerTotalSeconds}
        isPaused={isSleepTimerPaused}
        onSetTimer={handleSetSleepTimer}
        onTogglePause={handleTogglePauseSleepTimer}
        onAddMinutes={handleAddSleepTimerMinutes}
        onCancelTimer={handleCancelSleepTimer}
        enableFadeout={enableGradualFadeout}
        onToggleFadeout={setEnableGradualFadeout}
        storyDurationMinutes={story.audioDurationMinutes || 6}
        scenesRemainingCount={Math.max(1, scenes.length - currentSceneIndex)}
        currentSceneIndex={currentSceneIndex}
        totalScenesCount={scenes.length}
      />

      {/* Interactive Sleep Forecast & Duration Modal */}
      {showSleepForecastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-2xl w-full relative">
            <button
              type="button"
              onClick={() => setShowSleepForecastModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <SleepDurationEstimator
              storyDurationMinutes={story.audioDurationMinutes || 6}
              ambientSound={ambientSound}
              ambientLoopMinutes={ambientLoopMinutes}
              childAge={settings.childAge || 5}
              childName={settings.childName || 'Explorer'}
              variant="card"
              onAmbientLoopChange={(m) => setAmbientLoopMinutes(m)}
              interactive={true}
            />

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSleepForecastModal(false)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
              >
                Close Sleep Forecast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal Celebration */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-indigo-500/40 text-center shadow-2xl relative overflow-hidden">
            <div
              className="absolute -top-16 -right-16 w-36 h-36 rounded-full opacity-30 blur-2xl"
              style={{ backgroundColor: hero.color }}
            />

            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-slate-950 font-bold shadow-xl"
              style={{ backgroundColor: hero.color }}
            >
              <Sparkles className="w-8 h-8 fill-current" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">Sweet Dreams, Explorer!</h3>
            <p className="text-sm text-indigo-300 mb-6">
              You completed <span className="font-semibold text-white">&ldquo;{story.title}&rdquo;</span> with {hero.name}.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-6 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Constellation Glow:</span>
                <span className="font-bold text-amber-400">✨ {hero.constellation}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Bedtime Minutes Read:</span>
                <span className="font-bold text-indigo-300">+{story.audioDurationMinutes || 5} min</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Sleep Routine:</span>
                <span className="font-bold text-emerald-400">Tucked in & Safe 🛌</span>
              </div>
            </div>

            {/* Unlocked Badges Banner if any unlocked */}
            {unlockedBadgesToCelebrate.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 mb-5 text-left flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md shrink-0"
                    style={{
                      backgroundColor: `${unlockedBadgesToCelebrate[0].color}25`,
                      color: unlockedBadgesToCelebrate[0].color,
                      borderColor: unlockedBadgesToCelebrate[0].color,
                      borderWidth: '1px',
                    }}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                      🌟 Badge Unlocked!
                    </div>
                    <div className="text-xs font-bold text-white truncate max-w-[180px]">
                      {unlockedBadgesToCelebrate[0].name}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBadgeCelebrationModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow transition-all active:scale-95 shrink-0"
                >
                  Celebrate!
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveVocabWord(
                    currentSceneVocabWord || getVocabularyWordById('vocab-constellation')
                  );
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  {currentSceneVocabWord
                    ? `View Word Spark: ${currentSceneVocabWord.word} 🌟`
                    : 'View Word Spark: CONSTELLATION 🌟'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (unlockedBadgesToCelebrate.length > 0) {
                    setShowBadgeCelebrationModal(true);
                  } else {
                    triggerCelebration();
                  }
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>
                  {unlockedBadgesToCelebrate.length > 0
                    ? 'Replay Badge Unlock Celebration'
                    : 'Replay Star Celebration'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  VoiceNarrator.stop();
                  ambientSoundEngine.stopAmbient();
                  onClose();
                }}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                Return to Starlight Library
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setCurrentSceneIndex(0);
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                Read Story Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Unlock Celebration Full Modal */}
      {showBadgeCelebrationModal && unlockedBadgesToCelebrate.length > 0 && (
        <BadgeUnlockCelebrationModal
          badges={unlockedBadgesToCelebrate}
          heroColor={hero?.color}
          storyTitle={story.title}
          onClose={() => setShowBadgeCelebrationModal(false)}
          onViewVault={() => {
            setShowBadgeCelebrationModal(false);
            onClose();
            onNavigateToVault?.();
          }}
        />
      )}

      {/* Vocabulary Spark Modal */}
      <VocabularySparkModal
        isOpen={Boolean(activeVocabWord)}
        word={activeVocabWord}
        onClose={() => setActiveVocabWord(null)}
      />
    </div>
  );
};
