import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Heart,
  RotateCw,
  Wind,
  Moon,
  Sparkle,
  Waves,
  CloudRain,
  Music2,
  Calendar,
} from 'lucide-react';
import {
  BedtimeAffirmation,
  DAILY_AFFIRMATIONS,
  getDailyAffirmationForDate,
  formatAffirmationPhrase,
} from '../data/bedtimeAffirmations';
import { ambientSoundEngine } from '../services/audioNarration';
import { AmbientSoundTrack } from '../types';

interface DailyAffirmationWidgetProps {
  childName?: string;
  className?: string;
  ambientSound?: AmbientSoundTrack;
  ambientVolume?: number;
  onOpenWindDown?: () => void;
}

export const DailyAffirmationWidget: React.FC<DailyAffirmationWidgetProps> = ({
  childName = 'Little Explorer',
  className = '',
  ambientSound = 'wind',
  ambientVolume = 0.35,
  onOpenWindDown,
}) => {
  const [currentAffirmation, setCurrentAffirmation] = useState<BedtimeAffirmation>(() =>
    getDailyAffirmationForDate(new Date())
  );
  const [isCustomSpun, setIsCustomSpun] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPlayingAmbient, setIsPlayingAmbient] = useState(false);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCountdown, setBreathingCountdown] = useState(4);

  // Check if current affirmation is favorited in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bedtime_favorite_affirmations');
      if (saved) {
        const favIds: string[] = JSON.parse(saved);
        setIsFavorited(favIds.includes(currentAffirmation.id));
      } else {
        setIsFavorited(false);
      }
    } catch {
      setIsFavorited(false);
    }
  }, [currentAffirmation.id]);

  // Breathing exercise timer
  useEffect(() => {
    if (!showBreathingGuide) return;

    const interval = setInterval(() => {
      setBreathingCountdown((prev) => {
        if (prev <= 1) {
          setBreathingPhase((currPhase) => {
            if (currPhase === 'inhale') return 'hold';
            if (currPhase === 'hold') return 'exhale';
            return 'inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showBreathingGuide]);

  // Clean up speech synthesis & ambient audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (isPlayingAmbient) {
        ambientSoundEngine.stopAmbient();
      }
    };
  }, [isPlayingAmbient]);

  // Map ambient sound to icon and label
  const soundscapeInfo = useMemo(() => {
    switch (ambientSound) {
      case 'ocean':
        return { name: 'Ocean Waves', icon: Waves, color: 'text-sky-300', bgGlow: 'from-sky-500/10' };
      case 'rain':
        return { name: 'Gentle Rain', icon: CloudRain, color: 'text-blue-300', bgGlow: 'from-blue-500/10' };
      case 'forest':
        return { name: 'Night Forest', icon: Wind, color: 'text-emerald-300', bgGlow: 'from-emerald-500/10' };
      case 'wind':
        return { name: 'Starry Wind', icon: Wind, color: 'text-purple-300', bgGlow: 'from-purple-500/10' };
      case 'lullaby':
        return { name: 'Lullaby Chimes', icon: Music2, color: 'text-pink-300', bgGlow: 'from-pink-500/10' };
      case 'whitenoise':
        return { name: 'Cosmic Drift', icon: Moon, color: 'text-indigo-300', bgGlow: 'from-indigo-500/10' };
      default:
        return { name: 'Starry Wind', icon: Wind, color: 'text-purple-300', bgGlow: 'from-purple-500/10' };
    }
  }, [ambientSound]);

  const handleToggleAmbient = () => {
    if (isPlayingAmbient) {
      ambientSoundEngine.stopAmbient();
      setIsPlayingAmbient(false);
    } else {
      const trackToPlay = ambientSound === 'none' ? 'wind' : ambientSound;
      ambientSoundEngine.playAmbient(trackToPlay, ambientVolume);
      setIsPlayingAmbient(true);
    }
  };

  const handleToggleFavorite = () => {
    try {
      const saved = localStorage.getItem('bedtime_favorite_affirmations');
      let favIds: string[] = saved ? JSON.parse(saved) : [];
      if (isFavorited) {
        favIds = favIds.filter((id) => id !== currentAffirmation.id);
        setIsFavorited(false);
      } else {
        favIds.push(currentAffirmation.id);
        setIsFavorited(true);
      }
      localStorage.setItem('bedtime_favorite_affirmations', JSON.stringify(favIds));
    } catch (e) {
      console.error('Failed to update favorite affirmations:', e);
      setIsFavorited(!isFavorited);
    }
  };

  const handleSpinAnother = () => {
    const remaining = DAILY_AFFIRMATIONS.filter((a) => a.id !== currentAffirmation.id);
    const randomIndex = Math.floor(Math.random() * remaining.length);
    setCurrentAffirmation(remaining[randomIndex]);
    setIsCustomSpun(true);
    if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleResetToDaily = () => {
    setCurrentAffirmation(getDailyAffirmationForDate(new Date()));
    setIsCustomSpun(false);
    if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSpeakAffirmation = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const formattedText = formatAffirmationPhrase(currentAffirmation.phrase, childName);
    const utterance = new SpeechSynthesisUtterance(formattedText);
    utterance.rate = 0.82; // Slow, soothing bedtime pace
    utterance.pitch = 1.05; // Friendly warm pitch

    const voices = window.speechSynthesis.getVoices();
    const gentleVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Google') ||
            v.name.includes('Karen') ||
            v.name.includes('Serena'))) ||
        v.lang === 'en-US'
    );
    if (gentleVoice) {
      utterance.voice = gentleVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const now = new Date();
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(now);

  const themeTagDetails: Record<
    BedtimeAffirmation['theme'],
    { label: string; bg: string; text: string; border: string; glow: string }
  > = {
    peace: { label: 'Inner Calm', bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-500/40', glow: 'from-indigo-500/20' },
    love: { label: 'Safe & Cherished', bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-500/40', glow: 'from-rose-500/20' },
    wonder: { label: 'Starlight Wonder', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-500/40', glow: 'from-amber-500/20' },
    courage: { label: 'Gentle Bravery', bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-500/40', glow: 'from-cyan-500/20' },
    kindness: { label: 'Warm Heart', bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500/40', glow: 'from-emerald-500/20' },
  };

  const currentTag = themeTagDetails[currentAffirmation.theme] || themeTagDetails.peace;
  const SoundIcon = soundscapeInfo.icon;

  return (
    <section
      id="daily-bedtime-affirmation-widget"
      aria-label="Daily Bedtime Affirmation"
      className={`relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#120d2a] via-[#0d0922] to-[#180f33] border border-indigo-900/60 shadow-xl backdrop-blur-xl ${className}`}
    >
      {/* Dynamic Cosmic Ambient Aura synced to Theme & Soundscape */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-bl ${currentTag.glow} to-transparent blur-3xl pointer-events-none -mr-16 -mt-16`} />
      <div className={`absolute bottom-0 left-0 w-72 h-72 rounded-full bg-gradient-to-tr ${soundscapeInfo.bgGlow} to-transparent blur-3xl pointer-events-none -ml-12 -mb-12`} />

      {/* Decorative Star Dust Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#a5b4fc_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-7 space-y-4">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-sm shadow-amber-400/20">
              <Sparkles className="w-4 h-4 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-playfair font-bold text-white tracking-wide">
                  Daily Bedtime Affirmation
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold ${currentTag.bg} ${currentTag.text} border ${currentTag.border}`}>
                  {currentTag.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-light mt-0.5">
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3 h-3 text-amber-400/80" />
                  {isCustomSpun ? 'Constellation Wheel Selection' : `${dayOfWeek}, ${monthDay}`}
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="flex items-center gap-1 text-indigo-300 font-medium">
                  <SoundIcon className="w-3 h-3" />
                  <span>{soundscapeInfo.name}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Tools: Soundscape Play, Narration, Star Breath, Favorite, Spin */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Ambient Soundscape Audio Play/Pause Button */}
            <button
              type="button"
              id="affirmation-ambient-audio-btn"
              onClick={handleToggleAmbient}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isPlayingAmbient
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400 animate-pulse'
                  : 'bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/60 text-slate-300 hover:text-white'
              }`}
              title={isPlayingAmbient ? `Pause ${soundscapeInfo.name} soundscape` : `Play gentle ${soundscapeInfo.name} ambient soundscape`}
              aria-label={isPlayingAmbient ? 'Pause ambient soundscape' : 'Play gentle ambient soundscape'}
            >
              <SoundIcon className={`w-3.5 h-3.5 ${isPlayingAmbient ? 'text-amber-300' : 'text-indigo-400'}`} />
              <span className="hidden sm:inline">{isPlayingAmbient ? 'Sound Playing' : 'Play Atmosphere'}</span>
            </button>

            {/* Listen Aloud Button */}
            <button
              type="button"
              id="affirmation-speak-btn"
              onClick={handleSpeakAffirmation}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isSpeaking
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-300'
                  : 'bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/60 text-slate-200 hover:text-white'
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Listen to affirmation'}
              aria-label={isSpeaking ? 'Stop speaking' : 'Listen to affirmation'}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Mute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Star Breath Toggle */}
            <button
              type="button"
              id="affirmation-breath-btn"
              onClick={() => setShowBreathingGuide(!showBreathingGuide)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all ${
                showBreathingGuide
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'bg-indigo-950/60 hover:bg-indigo-900 border-indigo-900/80 text-slate-300 hover:text-white'
              }`}
              title="Take a starry breath"
              aria-label="Toggle starry breath guide"
            >
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Star Breath</span>
            </button>

            {/* Favorite Button */}
            <button
              type="button"
              id="affirmation-favorite-btn"
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-xl border transition-all ${
                isFavorited
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm shadow-rose-500/20'
                  : 'bg-indigo-950/60 hover:bg-indigo-900 border-indigo-900/80 text-slate-400 hover:text-white'
              }`}
              title={isFavorited ? 'Saved in bedtime memories' : 'Save to favorite affirmations'}
              aria-label={isFavorited ? 'Saved in bedtime memories' : 'Save to favorite affirmations'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-rose-400' : ''}`} />
            </button>

            {/* Spin / Next Thought */}
            <button
              type="button"
              id="affirmation-spin-btn"
              onClick={handleSpinAnother}
              className="p-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-900/80 text-slate-300 hover:text-amber-300 transition-colors"
              title="Spark another calming thought"
              aria-label="Spark another calming thought"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Affirmation Hero Phrase with Fluid Cross-Fade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAffirmation.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="py-3 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-slate-950/40 border border-indigo-900/40 relative overflow-hidden"
          >
            {/* Ambient Wave Bar Visualizer Indicator */}
            {isPlayingAmbient && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
            )}

            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl font-serif text-amber-400/40 select-none leading-none pt-1">
                &ldquo;
              </span>
              <div className="flex-1 space-y-2.5">
                <p className="text-lg sm:text-2xl font-playfair font-medium text-slate-100 leading-relaxed tracking-wide">
                  {formatAffirmationPhrase(currentAffirmation.phrase, childName)}
                </p>

                {currentAffirmation.breathGuidance && (
                  <div className="flex items-center gap-2 text-xs text-indigo-200/90 font-light italic">
                    <Sparkle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{currentAffirmation.breathGuidance}</span>
                  </div>
                )}
              </div>
              <span className="text-3xl sm:text-4xl font-serif text-amber-400/40 select-none leading-none self-end pb-1">
                &rdquo;
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Interactive Star Breath Guided Overlay */}
        <AnimatePresence>
          {showBreathingGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-indigo-950/50 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Expanding Breathing Circle */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                    <motion.div
                      animate={{
                        scale: breathingPhase === 'inhale' ? 1.35 : breathingPhase === 'hold' ? 1.35 : 0.85,
                        opacity: breathingPhase === 'inhale' ? 0.9 : breathingPhase === 'hold' ? 1 : 0.4,
                      }}
                      transition={{ duration: 4, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-emerald-400/20 border-2 border-emerald-400/60 shadow-lg shadow-emerald-500/20"
                    />
                    <motion.div
                      animate={{
                        scale: breathingPhase === 'inhale' ? 1.15 : breathingPhase === 'hold' ? 1.15 : 0.9,
                      }}
                      transition={{ duration: 4, ease: 'easeInOut' }}
                      className="absolute w-10 h-10 rounded-full bg-teal-400/30 blur-sm"
                    />
                    <div className="relative text-center">
                      <span className="text-sm sm:text-base font-mono font-bold text-white">
                        {breathingCountdown}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5" />
                      <span>
                        {breathingPhase === 'inhale' && 'Breathe In Gentle Starlight...'}
                        {breathingPhase === 'hold' && 'Hold Softly & Cozy...'}
                        {breathingPhase === 'exhale' && 'Release & Melt Into Pillow...'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-light">
                      Feel your chest rise and fall as calmness fills your room.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBreathingGuide(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 shrink-0"
                >
                  Done with Breath
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Sub-actions & Routine Connection */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            {isCustomSpun && (
              <button
                type="button"
                onClick={handleResetToDaily}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                <span>Back to Today&apos;s Date Affirmation</span>
              </button>
            )}
            {!isCustomSpun && (
              <span className="text-[11px] text-slate-400">
                Rotates each calendar day with a peaceful intention
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onOpenWindDown && (
              <button
                type="button"
                onClick={onOpenWindDown}
                className="text-[11px] text-indigo-300 hover:text-white font-medium flex items-center gap-1.5 hover:underline"
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjust Ambient &amp; Timer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
