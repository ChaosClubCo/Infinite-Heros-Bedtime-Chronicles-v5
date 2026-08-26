import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Story, StoryScene, AppSettings, CelestialBadge } from '../types';
import { getHeroById } from '../data/heroes';
import { VoiceNarrator, ambientSoundEngine } from '../services/audioNarration';
import { SleepDurationEstimator } from './SleepDurationEstimator';
import { AmbientWaveVisualizer } from './AmbientWaveVisualizer';
import { BadgeUnlockCelebrationModal } from './BadgeUnlockCelebrationModal';
import confetti from 'canvas-confetti';
import {
  VolumeX,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
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
  Shield,
  ArrowLeft,
  X,
  Award,
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

interface StoryReaderProps {
  story: Story;
  settings: AppSettings;
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
  const [ambientVolume, setAmbientVolume] = useState<number>(settings.ambientVolume || 0.3);
  const [ambientLoopMinutes, setAmbientLoopMinutes] = useState<number>(30);
  const [showSleepForecastModal, setShowSleepForecastModal] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState<number>(
    settings.readingSpeed === 'gentle' ? 0.75 : settings.readingSpeed === 'medium' ? 0.88 : 1.0
  );
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSoundControls, setShowSoundControls] = useState(false);
  const [isBreathingIn, setIsBreathingIn] = useState(true);
  const [unlockedBadgesToCelebrate, setUnlockedBadgesToCelebrate] = useState<CelestialBadge[]>([]);
  const [showBadgeCelebrationModal, setShowBadgeCelebrationModal] = useState(false);

  const hero = getHeroById(story.heroId);
  const scenes = story.scenes || [];
  const currentScene: StoryScene | undefined = scenes[currentSceneIndex] || scenes[0];
  const progressPercent = Math.round(((currentSceneIndex + 1) / Math.max(scenes.length, 1)) * 100);

  // Parse sentences for real-time visual follow-along highlighting
  const parsedSentences = useMemo(() => {
    return parseSceneSentences(currentScene?.text || '', currentScene?.sleepAffirmation);
  }, [currentScene?.text, currentScene?.sleepAffirmation]);

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

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;
    const timer = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          VoiceNarrator.stop();
          ambientSoundEngine.stopAmbient();
          setIsPlayingNarration(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepTimerRemaining]);

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

  // Read the current scene aloud with real-time sentence tracking
  const handleSpeakCurrentScene = useCallback(() => {
    if (!currentScene) return;
    if (isPlayingNarration) {
      VoiceNarrator.pause();
      setIsPlayingNarration(false);
      setSpokenCharIndex(null);
    } else {
      setIsPlayingNarration(true);
      setSpokenCharIndex(0);
      const textToRead = currentScene.sleepAffirmation
        ? `${currentScene.text}. ... ${currentScene.sleepAffirmation}`
        : currentScene.text;

      VoiceNarrator.speak(textToRead, {
        speedRate: readingSpeed,
        onStart: () => {
          setSpokenCharIndex(0);
        },
        onBoundary: (charIndex) => {
          setSpokenCharIndex(charIndex);
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
  }, [currentScene, isPlayingNarration, readingSpeed, settings.autoAdvance, currentSceneIndex, scenes.length, handleNextScene]);

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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05051a] text-slate-100 overflow-y-auto">
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
              onClick={() => {
                if (sleepTimerRemaining) {
                  setSleepTimerRemaining(null);
                } else {
                  setSleepTimerRemaining(15 * 60); // 15 mins default
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                sleepTimerRemaining
                  ? 'bg-purple-950/80 border-purple-400 text-purple-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title="Sleep Timer"
            >
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{sleepTimerRemaining ? formatTimer(sleepTimerRemaining) : 'Timer'}</span>
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

      {/* Progress Bar */}
      <div className="w-full bg-slate-900/80 h-1 relative z-10">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Ambient Sound Settings Popover */}
      {showSoundControls && (
        <div className="relative z-20 mx-4 sm:mx-auto max-w-lg mt-3 p-4 rounded-2xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ambient Soundscape
            </span>
            <button
              type="button"
              onClick={() => setShowSoundControls(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {[
              { id: 'none', label: 'Off', icon: VolumeX },
              { id: 'ocean', label: 'Ocean', icon: Waves },
              { id: 'rain', label: 'Rain', icon: CloudRain },
              { id: 'wind', label: 'Breeze', icon: Wind },
              { id: 'fire', label: 'Fire', icon: Flame },
              { id: 'train', label: 'Train', icon: Train },
            ].map((snd) => {
              const Icon = snd.icon;
              const isSelected = ambientSound === snd.id;
              return (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => setAmbientSound(snd.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{snd.label}</span>
                </button>
              );
            })}
          </div>

          {ambientSound !== 'none' && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400 shrink-0">Sound Volume:</span>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-full accent-indigo-400"
              />
              <span className="text-slate-300 font-mono w-8">{Math.round(ambientVolume * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Main Story Stage */}
      <main className="relative z-10 flex-1 flex flex-col justify-between max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Constellation & Hero Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/90 text-indigo-300 border border-slate-800 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Scene {currentSceneIndex + 1} of {scenes.length}</span>
          </div>

          {/* Gentle Breathing Guide for Calming Sleep Stories */}
          {story.mode === 'sleep' && (
            <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-950/40 px-3 py-1 rounded-full border border-purple-800/40">
              <div
                className={`w-2.5 h-2.5 rounded-full bg-purple-400 transition-all duration-1000 ${
                  isBreathingIn ? 'scale-125 opacity-100' : 'scale-75 opacity-40'
                }`}
              />
              <span>{isBreathingIn ? 'Breathe in peace...' : 'Breathe out calm...'}</span>
            </div>
          )}
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
            {isPlayingNarration && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm animate-pulse">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Follow along with the golden starlight words</span>
              </div>
            )}

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
        <div className="relative z-10 mt-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause Voice Narration Button */}
            <button
              id="narration-play-btn"
              type="button"
              onClick={handleSpeakCurrentScene}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
                isPlayingNarration
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
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

            {/* Speed Rate Toggle */}
            <button
              type="button"
              onClick={() => {
                setReadingSpeed((prev) => (prev === 0.75 ? 0.88 : prev === 0.88 ? 1.0 : 0.75));
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700"
              title="Narration Speed"
            >
              {readingSpeed === 0.75 ? '0.75x (Gentle)' : readingSpeed === 0.88 ? '0.9x (Calm)' : '1.0x (Normal)'}
            </button>
          </div>

          {/* Navigation Next/Prev Scene Controls */}
          <div className="flex items-center gap-2">
            <button
              id="reader-prev-btn"
              type="button"
              onClick={handlePrevScene}
              disabled={currentSceneIndex === 0}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {currentSceneIndex < scenes.length - 1 ? (
              <button
                id="reader-next-btn"
                type="button"
                onClick={handleNextScene}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
              >
                <span>Next Scene</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="reader-finish-btn"
                type="button"
                onClick={handleComplete}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Story</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient Audio Wave Visualizer reacting to current ambient soundscape */}
        <div className="w-full mt-2">
          <AmbientWaveVisualizer
            ambientSound={ambientSound}
            ambientVolume={ambientVolume}
            isPlayingNarration={isPlayingNarration}
            onOpenSoundControls={() => setShowSoundControls(true)}
            variant="floor"
          />
        </div>
      </main>

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
    </div>
  );
};
