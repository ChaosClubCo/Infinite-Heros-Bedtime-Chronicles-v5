import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Moon,
  Sparkles,
  Volume2,
  X,
  Plus,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

export interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingSeconds: number | null;
  totalSeconds: number | null;
  isPaused: boolean;
  onSetTimer: (minutes: number) => void;
  onTogglePause: () => void;
  onAddMinutes: (extraMinutes: number) => void;
  onCancelTimer: () => void;
  enableFadeout: boolean;
  onToggleFadeout: (enabled: boolean) => void;
  storyDurationMinutes?: number;
  scenesRemainingCount?: number;
  currentSceneIndex?: number;
  totalScenesCount?: number;
}

const PRESET_DURATIONS = [
  {
    minutes: 5,
    title: 'Quick Catnap',
    desc: 'For almost-asleep kids',
    emoji: '🌙',
    badge: '5 min',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    minutes: 10,
    title: 'Gentle Wind-Down',
    desc: 'Soft soothing drift',
    emoji: '💫',
    badge: '10 min',
    color: 'from-indigo-600 to-purple-700',
  },
  {
    minutes: 15,
    title: 'Bedtime Routine',
    desc: 'Recommended standard',
    emoji: '🌟',
    badge: '15 min',
    color: 'from-purple-600 to-pink-700',
    isPopular: true,
  },
  {
    minutes: 20,
    title: 'Deep Relaxation',
    desc: 'Calm restorative rest',
    emoji: '🌌',
    badge: '20 min',
    color: 'from-pink-600 to-rose-700',
  },
  {
    minutes: 30,
    title: 'Sweet Slumber',
    desc: 'Peaceful deep dream sleep',
    emoji: '✨',
    badge: '30 min',
    color: 'from-amber-600 to-orange-700',
  },
  {
    minutes: 45,
    title: 'Extended Lullaby',
    desc: 'Longer soothing soundscape',
    emoji: '🪐',
    badge: '45 min',
    color: 'from-emerald-600 to-teal-700',
  },
  {
    minutes: 60,
    title: 'Full Hour',
    desc: 'Maximum bedtime companion',
    emoji: '🕰️',
    badge: '60 min',
    color: 'from-teal-600 to-cyan-700',
  },
];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  remainingSeconds,
  totalSeconds,
  isPaused,
  onSetTimer,
  onTogglePause,
  onAddMinutes,
  onCancelTimer,
  enableFadeout,
  onToggleFadeout,
  scenesRemainingCount = 1,
  currentSceneIndex = 0,
  totalScenesCount = 5,
}) => {
  const [customMinutes, setCustomMinutes] = useState<number>(15);

  const formattedRemaining = useMemo(() => {
    if (remainingSeconds === null) return '00:00';
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const progressPercent = useMemo(() => {
    if (remainingSeconds === null || totalSeconds === null || totalSeconds <= 0) return 0;
    const elapsed = totalSeconds - remainingSeconds;
    return Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));
  }, [remainingSeconds, totalSeconds]);

  const isWithinFadeWindow = useMemo(() => {
    if (remainingSeconds === null || !enableFadeout) return false;
    return remainingSeconds <= 60;
  }, [remainingSeconds, enableFadeout]);

  // Estimated story end minutes
  const storyEndMinutes = useMemo(() => {
    const remainingScenes = Math.max(1, (totalScenesCount || 5) - (currentSceneIndex || 0));
    return Math.max(3, remainingScenes * 2);
  }, [totalScenesCount, currentSceneIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="max-w-xl w-full my-auto rounded-3xl bg-slate-900/95 border border-purple-500/30 p-5 sm:p-6 text-slate-100 shadow-2xl relative overflow-hidden backdrop-blur-xl"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Bedtime Sleep Timer
                  {remainingSeconds !== null && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-700/60 animate-pulse">
                      Active
                    </span>
                  )}
                </h3>
                <p className="text-xs text-indigo-300/90">
                  Fades out narration &amp; ambient audio once your child drifts to sleep
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              aria-label="Close Sleep Timer Settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ACTIVE TIMER HERO CARD */}
          {remainingSeconds !== null && (
            <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/70 via-indigo-950/60 to-slate-900/80 border border-purple-500/40 shadow-inner relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: Timer Display */}
                <div className="text-center sm:text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    {isPaused ? 'Timer Paused' : 'Time Remaining'}
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm flex items-center justify-center sm:justify-start gap-2">
                    <span>{formattedRemaining}</span>
                    {isWithinFadeWindow && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-sans font-semibold animate-pulse">
                        Fading out
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-purple-300/80 mt-1">
                    {enableFadeout
                      ? isWithinFadeWindow
                        ? '🍃 Audio volume is currently easing down gently'
                        : '✨ Gentle fade-out will soften audio in the last 60 seconds'
                      : 'Audio will stop when the timer reaches zero'}
                  </p>
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAddMinutes(5)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-600/60 text-purple-200 text-xs font-bold transition-all active:scale-95 shadow-sm"
                    title="Add 5 minutes to sleep timer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>5m</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddMinutes(10)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-600/60 text-purple-200 text-xs font-bold transition-all active:scale-95 shadow-sm"
                    title="Add 10 minutes to sleep timer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>10m</span>
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePause}
                    className={`p-2.5 rounded-xl border font-bold text-xs transition-all active:scale-95 shadow-sm ${
                      isPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white'
                        : 'bg-indigo-900/80 hover:bg-indigo-800 border-indigo-500/60 text-indigo-200'
                    }`}
                    title={isPaused ? 'Resume countdown' : 'Pause countdown'}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={onCancelTimer}
                    className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 font-bold text-xs transition-all active:scale-95 shadow-sm"
                    title="Cancel and turn off sleep timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3.5 w-full bg-slate-950/70 h-2 rounded-full overflow-hidden border border-purple-900/50">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-300 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* PRESET TIMER SELECTION GRID */}
          <div className="relative z-10 mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Select Bedtime Duration
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Click to activate</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_DURATIONS.map((preset) => {
                const isSelected =
                  remainingSeconds !== null &&
                  totalSeconds !== null &&
                  Math.abs(totalSeconds / 60 - preset.minutes) < 0.2;

                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => {
                      onSetTimer(preset.minutes);
                    }}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition-all active:scale-95 group relative overflow-hidden ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-400 shadow-lg shadow-purple-950/50 ring-1 ring-purple-400/50'
                        : 'bg-slate-900/80 border-slate-800/90 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    {preset.isPopular && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Popular
                      </span>
                    )}
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-base">{preset.emoji}</span>
                      <span className="text-xs font-bold font-mono text-purple-300 group-hover:text-purple-200">
                        {preset.badge}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-purple-200 truncate">
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}

              {/* Match Story End Preset */}
              <button
                type="button"
                onClick={() => onSetTimer(storyEndMinutes)}
                className="flex flex-col text-left p-3 rounded-2xl border border-indigo-800/60 bg-indigo-950/40 hover:bg-indigo-950/70 hover:border-indigo-500/70 transition-all active:scale-95 group relative"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base">📖</span>
                  <span className="text-xs font-bold font-mono text-indigo-300">
                    ~{storyEndMinutes} min
                  </span>
                </div>
                <span className="text-xs font-bold text-white group-hover:text-indigo-200 truncate">
                  End of Story
                </span>
                <span className="text-[10px] text-indigo-300/80 line-clamp-1 mt-0.5">
                  {scenesRemainingCount} scene{scenesRemainingCount === 1 ? '' : 's'} left
                </span>
              </button>
            </div>
          </div>

          {/* CUSTOM MINUTES SLIDER */}
          <div className="mb-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Custom Duration
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300 px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-800/50">
                {customMinutes} minutes
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="custom-sleep-timer-slider"
                type="range"
                min="1"
                max="90"
                step="1"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onSetTimer(customMinutes)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95 shrink-0"
              >
                Set {customMinutes}m
              </button>
            </div>
          </div>

          {/* GENTLE FADEOUT TOGGLE & ACOUSTIC INFO */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 relative z-10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-900/60 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="gentle-fadeout-toggle"
                  className="text-xs font-bold text-slate-200 cursor-pointer"
                >
                  Gradual Audio Fade-Out (Last 60 seconds)
                </label>
                <input
                  id="gentle-fadeout-toggle"
                  type="checkbox"
                  checked={enableFadeout}
                  onChange={(e) => onToggleFadeout(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Prevents sudden quietness from startling light sleepers by slowly easing audio
                volume down to zero.
              </p>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="mt-4 flex items-center justify-end gap-2 relative z-10">
            {remainingSeconds !== null && (
              <button
                type="button"
                onClick={onCancelTimer}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700"
              >
                Turn Off Timer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
