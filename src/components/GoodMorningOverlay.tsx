import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Sunrise,
  Sparkles,
  Flame,
  Star,
  Moon,
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  ChevronRight,
  Palette,
} from 'lucide-react';
import { DreamJournalEntry } from '../types';
import { getAvatarById } from '../data/avatars';
import { getAchievedMilestone, getNextMilestone, triggerSubtleConfettiShower } from '../utils/confetti';
import { ambientSoundEngine } from '../services/audioNarration';

interface GoodMorningOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  childName?: string;
  childAvatar?: string;
  lastDreamEntry?: DreamJournalEntry | null;
  onOpenDreamJournal?: () => void;
  onOpenStoryLibrary?: () => void;
}

export const GoodMorningOverlay: React.FC<GoodMorningOverlayProps> = ({
  isOpen,
  onClose,
  streakCount,
  childName = 'Little Explorer',
  childAvatar = 'fox',
  lastDreamEntry,
  onOpenDreamJournal,
  onOpenStoryLibrary,
}) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  const avatarObj = getAvatarById(childAvatar);
  const currentAchieved = getAchievedMilestone(streakCount);
  const nextMilestone = getNextMilestone(streakCount);

  // Play sunrise chime on open
  useEffect(() => {
    if (isOpen && soundEnabled && !hasPlayedSound) {
      const timer = setTimeout(() => {
        ambientSoundEngine.playMorningSunriseChime();
        setHasPlayedSound(true);
        triggerSubtleConfettiShower({
          particleCount: 40,
          playSound: false,
          intensity: 'gentle',
          originY: 0.25,
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, soundEnabled, hasPlayedSound, animationKey]);

  // Reset sound trigger when closed
  useEffect(() => {
    if (!isOpen) {
      setHasPlayedSound(false);
    }
  }, [isOpen]);

  const handleReplaySunrise = () => {
    setAnimationKey((prev) => prev + 1);
    if (soundEnabled) {
      ambientSoundEngine.playMorningSunriseChime();
    }
    triggerSubtleConfettiShower({
      particleCount: 35,
      playSound: false,
      intensity: 'gentle',
      originY: 0.3,
    });
  };

  const getMoodBadge = (mood?: string) => {
    switch (mood) {
      case 'peaceful':
        return { label: 'Peaceful Slumber', emoji: '🌙', color: 'bg-teal-500/20 border-teal-400/40 text-teal-300' };
      case 'magical':
        return { label: 'Magical Dream', emoji: '✨', color: 'bg-purple-500/20 border-purple-400/40 text-purple-300' };
      case 'adventurous':
        return { label: 'Epic Adventure', emoji: '🚀', color: 'bg-amber-500/20 border-amber-400/40 text-amber-300' };
      case 'cozy':
        return { label: 'Warm & Cozy', emoji: '☕', color: 'bg-orange-500/20 border-orange-400/40 text-orange-300' };
      case 'funny':
        return { label: 'Giggle Dream', emoji: '😄', color: 'bg-pink-500/20 border-pink-400/40 text-pink-300' };
      default:
        return { label: 'Sweet Dreams', emoji: '⭐', color: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300' };
    }
  };

  if (!isOpen) return null;

  const moodInfo = getMoodBadge(lastDreamEntry?.mood);

  return (
    <AnimatePresence>
      <div
        id="good-morning-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`Good Morning ${childName} - Bedtime Streak & Dream Check-In`}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      >
        {/* Backdrop Dark Tint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Sunrise Sky Container */}
        <motion.div
          key={`sunrise-container-${animationKey}`}
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-2xl rounded-3xl overflow-hidden border border-amber-300/40 shadow-2xl shadow-amber-500/20 bg-slate-950 text-white z-10 my-auto"
        >
          {/* ============================================================ */}
          {/* SUN-RISING ANIMATED DAWN SKY HERO HEADER */}
          {/* ============================================================ */}
          <div className="relative h-64 sm:h-72 w-full overflow-hidden flex flex-col justify-between p-5 sm:p-6">
            
            {/* Animated Dawn Sky Gradient (Twilight Indigo transitioning to Radiant Golden Dawn) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 bg-gradient-to-b from-[#110d2e] via-[#3a1c4d] to-[#d97706] opacity-90"
            />
            
            {/* Secondary Golden-Rose Dawn Bloom */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.85, scale: 1 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute inset-0 bg-gradient-to-t from-[#fbbf24]/50 via-[#f43f5e]/30 to-transparent"
            />

            {/* Glowing Rising Sun with Solar Flare Rings */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-12 flex items-center justify-center pointer-events-none">
              {/* Outer Corona Glow Pulses */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [1, 1.3, 1.15], opacity: [0.3, 0.7, 0.5] }}
                transition={{ duration: 3.5, ease: 'easeOut', repeat: Infinity, repeatType: 'mirror' }}
                className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-amber-400/40 via-yellow-300/30 to-orange-400/20 blur-2xl"
              />

              {/* Sunbeam Light Rays Spreading */}
              <motion.div
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 360, opacity: 0.65 }}
                transition={{ rotate: { duration: 40, repeat: Infinity, ease: 'linear' }, opacity: { duration: 1.5 } }}
                className="absolute w-60 h-60 sm:w-72 sm:h-72"
              >
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-0.5 h-32 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-t from-transparent via-amber-200/50 to-transparent origin-center"
                    style={{ transform: `translate(-50%, -50%) rotate(${i * 30}deg)` }}
                  />
                ))}
              </motion.div>

              {/* Sun Disc Rising Upwards */}
              <motion.div
                initial={{ y: 90, scale: 0.7, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 1.8, type: 'spring', damping: 18, stiffness: 120 }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-white shadow-2xl shadow-amber-300/80 flex items-center justify-center p-1 border-2 border-yellow-100"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-300 via-yellow-100 to-white flex items-center justify-center shadow-inner">
                  <Sun className="w-12 h-12 text-amber-500 fill-amber-300 animate-spin" style={{ animationDuration: '30s' }} />
                </div>
              </motion.div>
            </div>

            {/* Layered Morning Rolling Hills Silhouettes (SVG) */}
            <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none">
              {/* Back Soft Purple Morning Hill */}
              <svg className="absolute bottom-0 w-full h-20 text-[#25133d]/70 fill-current" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <path d="M0,120 C250,50 400,160 700,90 C850,50 950,110 1000,100 L1000,200 L0,200 Z" />
              </svg>
              {/* Mid Golden-Amber Morning Ridge */}
              <svg className="absolute bottom-0 w-full h-16 text-[#3b1740]/85 fill-current" preserveAspectRatio="none" viewBox="0 0 1000 160">
                <path d="M0,90 C180,140 380,40 600,100 C800,160 900,80 1000,110 L1000,160 L0,160 Z" />
              </svg>
              {/* Front Dark Silhouette Meadow */}
              <svg className="absolute bottom-0 w-full h-10 text-[#0c081e] fill-current" preserveAspectRatio="none" viewBox="0 0 1000 100">
                <path d="M0,40 C300,90 650,20 1000,60 L1000,100 L0,100 Z" />
              </svg>
            </div>

            {/* Flying Morning Songbirds in the Distance */}
            <motion.div
              initial={{ x: -60, y: 15, opacity: 0 }}
              animate={{ x: 380, y: -25, opacity: [0, 0.9, 0.9, 0] }}
              transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity, delay: 0.6 }}
              className="absolute top-12 left-6 pointer-events-none flex items-center gap-3 text-amber-200/70"
            >
              <span className="text-xs font-serif italic">v</span>
              <span className="text-[10px] font-serif italic -mt-2">v</span>
            </motion.div>

            {/* Top Bar Controls (Sound, Replay Sunrise, Close) */}
            <div className="relative z-20 flex items-center justify-between">
              {/* Morning Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-amber-300/40 text-amber-300 text-xs font-bold backdrop-blur-md shadow-sm">
                <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                <span>Morning Wake-Up • Dawn Rise</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Sound Toggle */}
                <button
                  type="button"
                  id="morning-sound-toggle-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-full bg-slate-950/60 border border-indigo-900/60 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-colors"
                  title={soundEnabled ? 'Mute sunrise chime' : 'Enable sunrise chime'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>

                {/* Replay Sunrise Button */}
                <button
                  type="button"
                  id="replay-sunrise-btn"
                  onClick={handleReplaySunrise}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/60 border border-indigo-900/60 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-semibold transition-colors"
                  title="Replay the rising sun animation and chime"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Replay Sun</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  id="close-morning-overlay-btn"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-slate-950/60 border border-indigo-900/60 hover:border-slate-600 text-slate-400 hover:text-white transition-colors"
                  title="Close morning check-in"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Title inside Header */}
            <div className="relative z-20 text-center pb-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-bold shadow-sm backdrop-blur-md mb-1.5"
              >
                <span className="text-sm">{avatarObj.emoji}</span>
                <span>Good Morning, {childName}!</span>
                <Sparkles className="w-3 h-3 text-amber-300 fill-current" />
              </motion.div>
              <h2 className="text-xl sm:text-2xl font-playfair font-bold text-white drop-shadow-md">
                You Slept Under the Stars! ☀️
              </h2>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BODY CONTENT: STREAK STATUS & DREAM ENTRY SUMMARY */}
          {/* ============================================================ */}
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 bg-[#0b081c]">
            
            {/* 1. Bedtime Reading Streak Card */}
            <div
              id="morning-streak-banner"
              className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-indigo-950/50 to-slate-900/60 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-inner"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-md shadow-amber-500/30 flex items-center justify-center shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-amber-400">
                    <Flame className="w-6 h-6 fill-amber-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-white font-playfair">
                      {streakCount}-Night Bedtime Streak Active!
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {currentAchieved?.badgeName || 'Starlight Hero'}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/80 font-light mt-0.5">
                    Your bedtime consistency is shining bright! Recharged and ready for the day.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-950/70 border border-indigo-900/60 text-amber-300 shrink-0">
                <span>Next Milestone:</span>
                <span className="text-white font-bold">{nextMilestone.days} Nights ({nextMilestone.title})</span>
              </div>
            </div>

            {/* 2. Child's Last Dream Entry Summary */}
            <div
              id="morning-last-dream-summary"
              className="p-4 sm:p-5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-purple-300" />
                  <h3 className="text-xs sm:text-sm font-bold text-white font-playfair tracking-wide">
                    Last Night&apos;s Dream Memory
                  </h3>
                </div>
                {lastDreamEntry && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${moodInfo.color}`}>
                    <span>{moodInfo.emoji}</span>
                    <span>{moodInfo.label}</span>
                  </span>
                )}
              </div>

              {lastDreamEntry ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3.5 items-start">
                    {/* Illustration Thumbnail if present */}
                    {lastDreamEntry.illustration?.url ? (
                      <div className="relative w-full sm:w-24 h-24 rounded-xl overflow-hidden border border-indigo-700/50 shrink-0 group">
                        <img
                          src={lastDreamEntry.illustration.url}
                          alt={lastDreamEntry.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-slate-950/80 text-[8px] text-amber-300 font-bold border border-amber-400/40">
                          AI Art
                        </span>
                      </div>
                    ) : (
                      <div className="w-full sm:w-16 h-16 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-2xl shrink-0">
                        {moodInfo.emoji}
                      </div>
                    )}

                    {/* Dream Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-amber-300 truncate">
                          &ldquo;{lastDreamEntry.title}&rdquo;
                        </h4>
                        {/* Sleep Rating Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400 shrink-0" title={`Sleep rating: ${lastDreamEntry.sleepRating || 5} stars`}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (lastDreamEntry.sleepRating || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Content quote */}
                      <p className="text-xs text-slate-300 italic line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-indigo-950">
                        &ldquo;{lastDreamEntry.content}&rdquo;
                      </p>

                      {/* Tags & Time */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {lastDreamEntry.tags?.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-900 text-indigo-200 text-[10px] border border-indigo-900/50">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-indigo-300/70 font-mono">
                          {lastDreamEntry.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state: invite child to record morning dream */
                <div className="p-3 rounded-xl bg-slate-950/60 border border-dashed border-indigo-800/60 text-center space-y-2">
                  <p className="text-xs text-indigo-200/80">
                    No dream recorded yet for last night! What did {childName} visit during sleep?
                  </p>
                  <p className="text-[11px] text-amber-300/90 font-light">
                    Record your morning thoughts while memories are fresh!
                  </p>
                </div>
              )}

              {/* Dream Journal CTA Link */}
              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  id="morning-open-journal-btn"
                  onClick={() => {
                    onClose();
                    onOpenDreamJournal?.();
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors group"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{lastDreamEntry ? 'Open Dream Journal & Illustrate' : 'Record This Morning’s Dream'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* 3. Morning Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              {/* Record Dream Primary Button */}
              <button
                type="button"
                id="morning-record-dream-primary-btn"
                onClick={() => {
                  onClose();
                  onOpenDreamJournal?.();
                }}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Palette className="w-4 h-4" />
                <span>Record Morning Dream</span>
              </button>

              {/* Start Today's Adventure Button */}
              <button
                type="button"
                id="morning-start-day-btn"
                onClick={() => {
                  onClose();
                  onOpenStoryLibrary?.();
                }}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-850 border border-indigo-800/80 hover:border-amber-400/60 text-white transition-all hover:scale-[1.02] active:scale-95"
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Start Today&apos;s Adventure</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
