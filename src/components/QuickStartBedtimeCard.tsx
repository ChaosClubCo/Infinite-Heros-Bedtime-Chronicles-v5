import React, { useState, useMemo } from 'react';
import { Story, CompletedStoryRecord } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';
import {
  Sparkles,
  Clock,
  Wind,
  BookOpen,
  Play,
  Zap,
  CheckCircle2,
  ChevronRight,
  Info,
  Heart,
} from 'lucide-react';

export interface QuickStartBedtimeCardProps {
  onSelectStory: (story: Story) => void;
  onOpenGuidedBreathing: () => void;
  childName?: string;
  childAge?: number;
  completedStories?: CompletedStoryRecord[];
  savedStories?: Story[];
  streakCount?: number;
  className?: string;
}

type RoutineType = 'story' | 'breathing';

interface TimeAndHistoryRecommendation {
  primaryType: RoutineType;
  title: string;
  subtitle: string;
  reason: string;
  timeContext: string;
  historicalContext: string;
  estimatedMinutes: number;
  recommendedStory: Story;
}

export const QuickStartBedtimeCard: React.FC<QuickStartBedtimeCardProps> = ({
  onSelectStory,
  onOpenGuidedBreathing,
  childName = 'Little Explorer',
  childAge = 5,
  completedStories = [],
  savedStories = [],
  streakCount = 3,
  className = '',
}) => {
  // Current time analysis
  const [now] = useState<Date>(() => new Date());
  const [selectedRoutineType, setSelectedRoutineType] = useState<RoutineType | null>(null);

  // Compute recommendation based on current time & historical data
  const recommendation = useMemo<TimeAndHistoryRecommendation>(() => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const timeString = `${displayHour}:${formattedMinutes} ${ampm}`;

    // 1. Determine optimal 15-minute story from historical favorites or featured
    let candidateStory = FEATURED_STORIES[0]; // Default: The Silver Moon Fox (12-15 min)

    // Check if user has saved stories or completed stories
    if (completedStories.length > 0) {
      const lastCompleted = completedStories[0];
      // Find a story that wasn't just completed or shares the hero
      const nextStory =
        FEATURED_STORIES.find((s) => s.id !== lastCompleted.id) || FEATURED_STORIES[1];
      if (nextStory) {
        candidateStory = nextStory;
      }
    } else if (savedStories.length > 0) {
      candidateStory = savedStories[0];
    }

    // 2. Classify time of day & bedtime window
    // - Late Bedtime: >= 20:30 (8:30 PM) or after 9 PM
    // - Prime Bedtime: 19:00 - 20:30 (7:00 PM - 8:30 PM)
    // - Early Evening: 17:30 - 19:00 (5:30 PM - 7:00 PM)
    // - Daytime / Afternoon: < 17:30
    const isLateBedtime = (hours === 20 && minutes >= 30) || hours >= 21 || hours < 4;
    const isPrimeBedtime = (hours === 19) || (hours === 20 && minutes < 30);
    const isEarlyEvening = hours >= 17 && hours < 19;

    let primaryType: RoutineType = 'story';
    let timeContext = '';
    let historicalContext = '';
    let reason = '';
    let title = '';
    let subtitle = '';

    // Factor in historical completion count and streak
    const hasLongStreak = streakCount >= 3;
    const completedCount = completedStories.length;

    if (isLateBedtime) {
      // Late evening: Recommend 5-min guided breathing to avoid overstimulation
      primaryType = 'breathing';
      title = '5-Minute Gentle Breathing Orbit';
      subtitle = 'Rapid calm & diaphragmatic sleep breathwork';
      timeContext = `It's ${timeString} • Late Bedtime Wind-Down`;
      historicalContext = completedCount > 0
        ? `Based on ${completedCount} completed bedtime stories and a ${streakCount}-night streak.`
        : `Recommended for soothing rapid wind-down after 8:30 PM.`;
      reason = `It is past typical story hour (${timeString}). A gentle 5-minute breathing session helps ${childName} settle into deep sleep quickly without screen overstimulation.`;
    } else if (isPrimeBedtime) {
      // Prime bedtime: Recommend 15-minute story journey
      primaryType = 'story';
      title = `15-Minute Bedtime Story: ${candidateStory.title}`;
      subtitle = `${candidateStory.category} • Perfect bedtime pacing`;
      timeContext = `It's ${timeString} • Prime Storytime Window`;
      historicalContext = hasLongStreak
        ? `Building on your active ${streakCount}-night reading streak!`
        : `Optimal 15-minute cadence for age ${childAge}.`;
      reason = `Prime bedtime window (${timeString}). A 15-minute soothing tale eases imagination and calms thoughts for restful dreaming.`;
    } else if (isEarlyEvening) {
      // Early evening: Recommend 15-minute story or preparation
      primaryType = 'story';
      title = `15-Minute Cozy Story: ${candidateStory.title}`;
      subtitle = `Gentle early evening transition into quiet hours`;
      timeContext = `It's ${timeString} • Evening Wind-Down`;
      historicalContext = `Paving the way for night ${streakCount + 1} of bedtime consistency.`;
      reason = `Starting bedtime early (${timeString}) helps prevent overtiredness with a calming 15-minute chronicle.`;
    } else {
      // Daytime / Afternoon Nap or calm
      primaryType = 'breathing';
      title = '5-Minute Starlight Breathing Reset';
      subtitle = 'Orb of Calm • Gentle mindful pause';
      timeContext = `It's ${timeString} • Daytime Rest & Reset`;
      historicalContext = `Quick relaxation routine to recharge peaceful focus.`;
      reason = `Take a gentle 5-minute diaphragmatic breathing pause with the glowing celestial orb.`;
    }

    return {
      primaryType,
      title,
      subtitle,
      reason,
      timeContext,
      historicalContext,
      estimatedMinutes: primaryType === 'story' ? 15 : 5,
      recommendedStory: candidateStory,
    };
  }, [now, childName, childAge, completedStories, savedStories, streakCount]);

  // Active routine type is either user-toggled or algorithmic default
  const activeType = selectedRoutineType || recommendation.primaryType;
  const isStoryActive = activeType === 'story';

  const handleLaunchRoutine = () => {
    if (isStoryActive) {
      onSelectStory(recommendation.recommendedStory);
    } else {
      onOpenGuidedBreathing();
    }
  };

  return (
    <section
      id="bedtime-quick-start-card"
      aria-label="Bedtime Quick-Start Assistant"
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 border border-amber-500/30 bg-gradient-to-br from-[#120d2b] via-[#0d0922] to-[#1a1236] shadow-xl shadow-indigo-950/50 transition-all ${className}`}
    >
      {/* Background Starlight & Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Meta Bar: Smart Bedtime Suggestion Badge + Time Indicator */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-indigo-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm">
            <Zap className="w-4 h-4 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bangers tracking-wider text-amber-300">
                BEDTIME QUICK-START
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-950 border border-indigo-700/60 text-indigo-300 uppercase tracking-wider">
                Smart Match
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{recommendation.timeContext}</p>
          </div>
        </div>

        {/* Time and Streak Pills */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/50 text-[11px] text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{isStoryActive ? '15 min' : '5 min'}</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-500/30 text-[11px] font-bold text-amber-300">
            <span>🔥 {streakCount}d streak</span>
          </div>
        </div>
      </div>

      {/* Routine Selector Tabs (15-Min Story vs 5-Min Breathing) */}
      <div className="relative z-10 grid grid-cols-2 gap-2 mt-4 p-1 rounded-2xl bg-slate-950/70 border border-indigo-900/50">
        <button
          type="button"
          id="quickstart-tab-story"
          onClick={() => setSelectedRoutineType('story')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isStoryActive
              ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/20 border border-amber-400/60 text-amber-200 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <BookOpen className={`w-4 h-4 ${isStoryActive ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>15-Min Story</span>
          {recommendation.primaryType === 'story' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black tracking-wide uppercase">
              Rec
            </span>
          )}
        </button>

        <button
          type="button"
          id="quickstart-tab-breathing"
          onClick={() => setSelectedRoutineType('breathing')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            !isStoryActive
              ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-600/20 border border-cyan-400/60 text-cyan-200 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Wind className={`w-4 h-4 ${!isStoryActive ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span>5-Min Breathing</span>
          {recommendation.primaryType === 'breathing' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-black tracking-wide uppercase">
              Rec
            </span>
          )}
        </button>
      </div>

      {/* Routine Detail Card */}
      <div className="relative z-10 mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isStoryActive
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
              }`}
            >
              {isStoryActive ? 'Suggested Bedtime Story' : 'Suggested Sleep Breathwork'}
            </span>
            <span className="text-[11px] text-slate-400">
              For {childName} (Age {childAge})
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {isStoryActive ? (
              <>
                <span>{recommendation.recommendedStory.title}</span>
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40 shrink-0" />
              </>
            ) : (
              <span>Starry Orb Guided Breathing • 5-Minute Diaphragmatic Loop</span>
            )}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {isStoryActive
              ? recommendation.recommendedStory.summary
              : 'Soothing 4-7-8 breathing orb with gentle sine waves and starlight pulses to calm heart rate and drift into restful sleep.'}
          </p>

          {/* Algorithmic Reason Callout */}
          <div className="flex items-start gap-1.5 pt-1 text-[11px] text-amber-300/90 font-medium">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>{recommendation.reason}</span>
          </div>
        </div>

        {/* Primary Action Button (1-Tap Launch) */}
        <div className="w-full sm:w-auto shrink-0 flex flex-col items-stretch sm:items-end gap-2">
          <button
            type="button"
            id="quickstart-launch-routine-btn"
            onClick={handleLaunchRoutine}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
              isStoryActive
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-500/30'
                : 'bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:from-cyan-300 hover:to-indigo-400 text-white shadow-cyan-500/30'
            }`}
          >
            {isStoryActive ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start 15-Min Story</span>
              </>
            ) : (
              <>
                <Wind className="w-4 h-4" />
                <span>Start 5-Min Breathing</span>
              </>
            )}
            <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
          </button>

          <span className="text-[10px] text-slate-400 text-center sm:text-right flex items-center justify-center sm:justify-end gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Instant launch • No setup required</span>
          </span>
        </div>
      </div>

      {/* Historical Data Context Footer */}
      <div className="relative z-10 mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{recommendation.historicalContext}</span>
        </div>
        <div className="text-slate-400">
          <span>Bedtime Routine Assistant</span>
        </div>
      </div>
    </section>
  );
};
