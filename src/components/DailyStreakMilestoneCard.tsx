import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Sparkles,
  Award,
  Moon,
  Shield,
  Heart,
  Zap,
  CheckCircle2,
  Lock,
  X,
  PartyPopper,
  Star,
} from 'lucide-react';
import { StreakMilestone } from '../types';
import {
  STREAK_MILESTONES,
  getAchievedMilestone,
  getNextMilestone,
  triggerSubtleConfettiShower,
} from '../utils/confetti';
import { ambientSoundEngine } from '../services/audioNarration';

interface DailyStreakMilestoneCardProps {
  currentStreak: number;
  childName?: string;
  onAdvanceStreak?: () => void;
  onSelectMilestone?: (milestone: StreakMilestone) => void;
}

export const DailyStreakMilestoneCard: React.FC<DailyStreakMilestoneCardProps> = ({
  currentStreak,
  childName = 'Little Explorer',
  onAdvanceStreak,
  onSelectMilestone,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<StreakMilestone | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationBanner, setCelebrationBanner] = useState<{
    title: string;
    description: string;
    badgeName: string;
  } | null>(null);

  const currentAchieved = getAchievedMilestone(currentStreak);
  const nextMilestone = getNextMilestone(currentStreak);

  // Calculate progress percentage to next milestone
  const prevThreshold = currentAchieved ? currentAchieved.days : 0;
  const targetThreshold = nextMilestone.days;
  const progressSpan = Math.max(targetThreshold - prevThreshold, 1);
  const currentProgress = Math.max(currentStreak - prevThreshold, 0);
  const progressPercent = Math.min(
    Math.round((currentProgress / progressSpan) * 100),
    100
  );

  const getMilestoneIcon = (iconName: string, sizeClass = 'w-4 h-4') => {
    switch (iconName) {
      case 'Flame':
        return <Flame className={sizeClass} />;
      case 'Sparkles':
        return <Sparkles className={sizeClass} />;
      case 'Award':
        return <Award className={sizeClass} />;
      case 'Moon':
        return <Moon className={sizeClass} />;
      case 'Shield':
        return <Shield className={sizeClass} />;
      case 'Heart':
        return <Heart className={sizeClass} />;
      case 'Zap':
        return <Zap className={sizeClass} />;
      default:
        return <Star className={sizeClass} />;
    }
  };

  const handleCelebrate = (milestone?: StreakMilestone) => {
    setIsCelebrating(true);
    triggerSubtleConfettiShower({
      particleCount: 55,
      playSound: true,
      intensity: 'gentle',
      originY: 0.38,
    });

    const target = milestone || currentAchieved || STREAK_MILESTONES[0];
    setCelebrationBanner({
      title: `${target.title} Milestone!`,
      description: target.description,
      badgeName: target.badgeName,
    });

    setTimeout(() => {
      setIsCelebrating(false);
    }, 1200);
  };

  const handleAdvance = () => {
    if (onAdvanceStreak) {
      const nextStreakVal = currentStreak + 1;
      const matched = STREAK_MILESTONES.find((m) => m.days === nextStreakVal);
      
      onAdvanceStreak();

      // If hitting a milestone threshold, trigger celebration shower!
      if (matched) {
        triggerSubtleConfettiShower({
          particleCount: 65,
          playSound: true,
          intensity: 'medium',
          originY: 0.35,
        });
        setCelebrationBanner({
          title: `New Milestone Reached: ${matched.title}!`,
          description: matched.description,
          badgeName: matched.badgeName,
        });
      } else {
        triggerSubtleConfettiShower({
          particleCount: 35,
          playSound: true,
          intensity: 'gentle',
          originY: 0.4,
        });
      }
    }
  };

  return (
    <section
      aria-label="Bedtime Consistency and Daily Reading Streak"
      className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#140e2e] via-[#100b26] to-[#160f33] border border-indigo-900/60 shadow-xl overflow-hidden backdrop-blur-md"
    >
      {/* Subtle Background Cosmic Nebulae */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header Row */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-950/70">
        
        {/* Streak Identity & Avatar */}
        <div className="flex items-center gap-3.5">
          <motion.div
            animate={isCelebrating ? { scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] } : { scale: [1, 1.05, 1] }}
            transition={isCelebrating ? { duration: 0.6 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center shrink-0"
          >
            <div className="w-full h-full rounded-[14px] bg-slate-950/90 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6 fill-amber-400 text-amber-300 drop-shadow-sm animate-pulse" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold shadow-sm border border-amber-300">
              {currentStreak}d
            </span>
          </motion.div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-playfair font-bold text-white tracking-wide">
                {currentStreak}-Night Bedtime Streak
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>{currentAchieved ? currentAchieved.badgeName : 'Starlight Spark'}</span>
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 font-light mt-0.5">
              {childName}’s bedtime reading habit is glowing bright in the starlight!
            </p>
          </div>
        </div>

        {/* Action Controls: Celebrate & Check-In */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* Celebrate Confetti Trigger Button */}
          <button
            type="button"
            id="celebrate-streak-btn"
            onClick={() => handleCelebrate()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 hover:border-amber-400 text-amber-300 transition-all active:scale-95 shadow-sm"
            title="Trigger celebratory confetti shower for bedtime consistency"
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Celebrate Streak</span>
          </button>

          {/* Log / Check-in Reading Button */}
          {onAdvanceStreak && (
            <button
              type="button"
              id="log-tonight-read-btn"
              onClick={handleAdvance}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              title="Check-in tonight's bedtime story & build consistency"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Log Reading (+1)</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress to Next Milestone Bar */}
      <div className="relative z-10 my-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-indigo-200/90 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping" />
            <span>Next Milestone: <strong>{nextMilestone.title}</strong></span>
          </span>
          <span className="text-amber-300 font-bold font-mono">
            {currentStreak} / {nextMilestone.days} Nights ({progressPercent}%)
          </span>
        </div>

        {/* Progress Track */}
        <div className="relative w-full h-2.5 rounded-full bg-indigo-950/80 border border-indigo-900/80 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-sm shadow-amber-400/50"
          />
        </div>
      </div>

      {/* Milestone Badges Trail */}
      <div className="relative z-10 pt-2">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Consistency Milestones</span>
          </span>
          <span className="text-[10px] text-indigo-300/70">
            Tap any milestone badge to preview starlight rewards
          </span>
        </div>

        {/* Scrollable Milestone Badges Horizontal Track */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-indigo-900">
          {STREAK_MILESTONES.map((milestone) => {
            const isAchieved = currentStreak >= milestone.days;
            const isNext = nextMilestone.days === milestone.days;

            return (
              <button
                key={milestone.days}
                type="button"
                id={`milestone-badge-${milestone.days}`}
                onClick={() => {
                  setSelectedMilestone(milestone);
                  if (isAchieved) {
                    handleCelebrate(milestone);
                  } else {
                    ambientSoundEngine.playStarTwinkle(0.9);
                  }
                  if (onSelectMilestone) {
                    onSelectMilestone(milestone);
                  }
                }}
                className={`relative group flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all shrink-0 text-left ${
                  isAchieved
                    ? 'bg-gradient-to-r from-amber-400/20 to-orange-500/10 border-amber-400/60 text-amber-200 hover:border-amber-300 hover:bg-amber-400/25 shadow-md shadow-amber-950/40'
                    : isNext
                    ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200 hover:border-amber-400/40 hover:bg-indigo-900/50'
                    : 'bg-slate-950/40 border-indigo-950/60 text-slate-400 opacity-60 hover:opacity-80'
                }`}
              >
                {/* Milestone Badge Icon */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isAchieved
                      ? 'bg-amber-400/30 text-amber-300 border border-amber-400/50'
                      : isNext
                      ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-600/40'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {getMilestoneIcon(milestone.icon, 'w-3.5 h-3.5')}
                </div>

                <div className="pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {milestone.days} Nights
                    </span>
                    {isAchieved ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : isNext ? (
                      <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-500" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300/80 truncate max-w-[100px]">
                    {milestone.badgeName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Celebratory Banner Toast */}
      <AnimatePresence>
        {celebrationBanner && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="relative z-20 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-[#0e0926] border border-amber-400/70 shadow-2xl flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shrink-0 shadow-md">
                <PartyPopper className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-200">
                    {celebrationBanner.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/30 text-amber-300 border border-amber-400/40">
                    {celebrationBanner.badgeName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200/90 mt-0.5 line-clamp-1">
                  {celebrationBanner.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCelebrationBanner(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Milestone Details Popover Modal */}
      <AnimatePresence>
        {selectedMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedMilestone(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md p-6 rounded-3xl bg-[#0f0927] border border-amber-400/60 shadow-2xl space-y-4 text-left"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Milestone Header */}
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-lg">
                  {getMilestoneIcon(selectedMilestone.icon, 'w-7 h-7')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">
                      {selectedMilestone.days}-Night Milestone
                    </span>
                    {currentStreak >= selectedMilestone.days ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        Achieved!
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedMilestone.days - currentStreak} nights left
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-playfair font-bold text-white mt-0.5">
                    {selectedMilestone.title}
                  </h3>
                </div>
              </div>

              {/* Description & Affirmation */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-950 space-y-2">
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedMilestone.description}
                </p>
                <div className="pt-2 border-t border-indigo-950/80 flex items-start gap-2 text-indigo-300 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                  <span className="italic">&ldquo;{selectedMilestone.affirmation}&rdquo;</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {currentStreak >= selectedMilestone.days ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleCelebrate(selectedMilestone);
                      setSelectedMilestone(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <PartyPopper className="w-4 h-4" />
                    <span>Shower Confetti Celebration</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedMilestone(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    Keep Reading Tonight
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
